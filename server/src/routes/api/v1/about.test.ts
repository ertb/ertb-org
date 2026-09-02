import express, { json } from 'express'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'
import { getAbout, putAbout } from './about'

describe('about', () => {
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
    app.use((req, _res, next) => { req.db = db; next() })
    app.get('/about', getAbout)
    app.put('/about', json(), putAbout)
  })

  afterEach(async () => {
    await db.dropDatabase()
  })

  describe('GET /about', () => {
    it('should return 404 when no content has been saved', async () => {
      const res = await request(app).get('/about')
      expect(res.status).toBe(404)
    })

    it('should tell the browser never to cache the response', async () => {
      const res = await request(app).get('/about')
      expect(res.headers['cache-control']).toBe('no-store')
    })

    it('should return the saved markdown', async () => {
      await db.collection<{_id:string, markdown:string}>('content').insertOne({ _id: 'about', markdown: '## Hello' })
      const res = await request(app).get('/about')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ markdown: '## Hello' })
    })
  })

  describe('PUT /about', () => {
    it('should reject a payload that fails schema validation', async () => {
      const res = await request(app).put('/about').send({})
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid payload')
    })

    it('should insert content when none exists yet', async () => {
      const res = await request(app).put('/about').send({ markdown: '## About' })
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ markdown: '## About' })

      const stored = await db.collection<{_id:string, markdown:string}>('content').findOne({ _id: 'about' })
      expect(stored?.markdown).toBe('## About')
    })

    it('should replace existing content', async () => {
      await db.collection<{_id:string, markdown:string}>('content').insertOne({ _id: 'about', markdown: 'old' })
      const res = await request(app).put('/about').send({ markdown: 'new' })
      expect(res.status).toBe(200)

      const stored = await db.collection<{_id:string, markdown:string}>('content').findOne({ _id: 'about' })
      expect(stored?.markdown).toBe('new')
    })
  })
})
