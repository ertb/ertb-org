import express from 'express'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient, ObjectId } from 'mongodb'
import { checkUser } from './check-user'
import { signToken } from './auth-sign-verify'

describe('checkUser', () => {
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
  })

  afterEach(async () => {
    await db.dropDatabase()
  })

  const seedUser = async (role: string) => {
    const {insertedId} = await db.collection('users').insertOne({role})
    return insertedId
  }

  const authHeader = async (userId: ObjectId | string) => {
    const {token} = await signToken({userId: userId.toString()})
    return `Bearer ${token}`
  }

  it('should reject when no authorization header is provided', async () => {
    app.get('/protected', checkUser('admin'), (_req, res) => res.send({ok: true}))
    const res = await request(app).get('/protected')
    expect(res.status).toBe(401)
  })

  it('should reject an unknown auth scheme', async () => {
    app.get('/protected', checkUser('admin'), (_req, res) => res.send({ok: true}))
    const res = await request(app).get('/protected').set('Authorization', 'Basic abc123')
    expect(res.status).toBe(401)
  })

  it('should reject an invalid/unsigned token', async () => {
    app.get('/protected', checkUser('admin'), (_req, res) => res.send({ok: true}))
    const res = await request(app).get('/protected').set('Authorization', 'Bearer not-a-real-token')
    expect(res.status).toBe(401)
  })

  it('should reject a token for a user that no longer exists', async () => {
    app.get('/protected', checkUser('admin'), (_req, res) => res.send({ok: true}))
    const res = await request(app).get('/protected').set('Authorization', await authHeader(new ObjectId()))
    expect(res.status).toBe(401)
  })

  it('should reject when the user does not have the required role', async () => {
    const userId = await seedUser('user')
    app.get('/protected', checkUser('admin'), (_req, res) => res.send({ok: true}))
    const res = await request(app).get('/protected').set('Authorization', await authHeader(userId))
    expect(res.status).toBe(403)
  })

  it('should allow access when the token identifies a user with the required role', async () => {
    const userId = await seedUser('admin')
    app.get('/protected', checkUser('admin'), (_req, res) => res.send({ok: true}))
    const res = await request(app).get('/protected').set('Authorization', await authHeader(userId))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ok: true})
  })

  it('should only authorize the specific user the token identifies, not just any user', async () => {
    // a second, unrelated admin user exists in the collection
    await seedUser('admin')
    const nonAdminId = await seedUser('user')
    app.get('/protected', checkUser('admin'), (_req, res) => res.send({ok: true}))
    const res = await request(app).get('/protected').set('Authorization', await authHeader(nonAdminId))
    expect(res.status).toBe(403)
  })
})
