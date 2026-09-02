import express from 'express'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient, ObjectId } from 'mongodb'
import { JSONSchemaType } from 'ajv'
import { MongoRestRouter } from './mongo-rest-route'

interface Widget {
  _id?: string
  name: string
  count: number
}

const widgetSchema: JSONSchemaType<Widget> = {
  type: 'object',
  properties: {
    _id: {type: 'string', nullable: true},
    name: {type: 'string'},
    count: {type: 'number'},
  },
  required: ['name', 'count'],
  additionalProperties: true,
}

describe('MongoRestRouter', () => {
  let mongoServer: MongoMemoryServer
  let client: MongoClient
  let db: Db
  let app: express.Express

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    client = new MongoClient(mongoServer.getUri())
    await client.connect()
  }, 30000)

  afterAll(async () => {
    await client.close()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    db = client.db(`test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    app = express()
    app.use('/widgets', MongoRestRouter('widgets', widgetSchema, {db: () => db}))
  })

  afterEach(async () => {
    await db.dropDatabase()
  })

  /** Inserts a widget directly, letting Mongo generate a real ObjectId, and returns it with its id as a string. */
  const seedWidget = async (overrides: Partial<Omit<Widget, '_id'>> = {}) => {
    const {insertedId} = await db.collection('widgets').insertOne({name: 'Sprocket', count: 3, ...overrides})
    return {id: insertedId.toHexString(), _id: insertedId}
  }

  describe('POST /', () => {
    it('should insert a valid entry and return its id', async () => {
      const res = await request(app).post('/widgets').send({name: 'Gizmo', count: 1})
      expect(res.status).toBe(200)
      expect(res.body.insertedId).toBeTruthy()

      const stored = await db.collection('widgets').findOne({_id: new ObjectId(res.body.insertedId)})
      expect(stored).toMatchObject({name: 'Gizmo', count: 1})
      expect(stored?.added).toBeInstanceOf(Date)
    })

    it('should reject a payload that fails schema validation', async () => {
      const res = await request(app).post('/widgets').send({name: 'Missing fields'})
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid payload')
    })

    it('should bulk insert an array of entries', async () => {
      const res = await request(app).post('/widgets').send([
        {name: 'A', count: 1},
        {name: 'B', count: 2},
      ])
      expect(res.status).toBe(200)
      expect(res.body.insertedIds).toBeTruthy()
      expect(await db.collection('widgets').countDocuments()).toBe(2)
    })
  })

  describe('GET /', () => {
    it('should list non-deleted entries with a count', async () => {
      await seedWidget({name: 'A'})
      await seedWidget({name: 'B'})
      const res = await request(app).get('/widgets')
      expect(res.status).toBe(200)
      expect(res.body.count).toBe(2)
      expect(res.body.widgets).toHaveLength(2)
    })

    it('should exclude soft-deleted entries', async () => {
      await seedWidget({name: 'A'})
      const deleted = await seedWidget({name: 'B'})
      await db.collection('widgets').updateOne({_id: deleted._id}, {$set: {deleted: new Date()}})

      const res = await request(app).get('/widgets')
      expect(res.body.count).toBe(1)
      expect(res.body.widgets[0].name).toBe('A')
    })
  })

  describe('GET /:id', () => {
    it('should return a matching entry', async () => {
      const widget = await seedWidget()
      const res = await request(app).get(`/widgets/${widget.id}`)
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({name: 'Sprocket', count: 3})
    })

    it('should 404 for an unknown id', async () => {
      const res = await request(app).get(`/widgets/${new ObjectId().toHexString()}`)
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /:id', () => {
    it('should replace an entry', async () => {
      const widget = await seedWidget()
      const res = await request(app).put(`/widgets/${widget.id}`).send({name: 'Replaced', count: 9})
      expect(res.status).toBe(200)
      expect(res.body.modifiedCount).toBe(1)

      const stored = await db.collection('widgets').findOne({_id: widget._id})
      expect(stored).toMatchObject({name: 'Replaced', count: 9})
      expect(stored?.lastModified).toBeInstanceOf(Date)
    })

    it('should 404 for an unknown id', async () => {
      const res = await request(app).put(`/widgets/${new ObjectId().toHexString()}`).send({name: 'X', count: 1})
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /:id', () => {
    it('should apply a JSON Patch to an entry', async () => {
      const widget = await seedWidget()
      const res = await request(app).patch(`/widgets/${widget.id}`).send([{op: 'replace', path: '/count', value: 42}])
      expect(res.status).toBe(200)
      expect(res.body.modifiedCount).toBe(1)

      const stored = await db.collection('widgets').findOne({_id: widget._id})
      expect(stored?.count).toBe(42)
      expect(stored?.name).toBe('Sprocket')
    })

    it('should reject a patch that attempts to change _id', async () => {
      const widget = await seedWidget()
      const res = await request(app).patch(`/widgets/${widget.id}`).send([{op: 'replace', path: '/_id', value: new ObjectId().toHexString()}])
      expect(res.status).toBe(400)

      const stored = await db.collection('widgets').findOne({_id: widget._id})
      expect(stored).toBeTruthy()
    })

    it('should 404 for an unknown id', async () => {
      const res = await request(app).patch(`/widgets/${new ObjectId().toHexString()}`).send([{op: 'replace', path: '/count', value: 1}])
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /:id', () => {
    it('should soft-delete an entry by setting the deleted field', async () => {
      const widget = await seedWidget()
      const res = await request(app).delete(`/widgets/${widget.id}`)
      expect(res.status).toBe(200)
      expect(res.body.deletedCount).toBe(1)

      const stored = await db.collection('widgets').findOne({_id: widget._id})
      expect(stored?.deleted).toBeInstanceOf(Date)
    })

    it('should be excluded from GET / after being deleted, but visible in the archive', async () => {
      const widget = await seedWidget()
      await request(app).delete(`/widgets/${widget.id}`)

      const list = await request(app).get('/widgets')
      expect(list.body.count).toBe(0)

      const archived = await request(app).get(`/widgets/archive/${widget.id}`)
      expect(archived.status).toBe(200)
      expect(archived.body.name).toBe('Sprocket')
    })
  })
})
