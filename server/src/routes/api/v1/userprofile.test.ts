import express from 'express'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'
import { userprofile } from './userprofile'
import { verifyToken } from '../auth-sign-verify'
import { fetchJSON } from '../../../lib/fetch-json'

jest.mock('../../../lib/fetch-json')
const mockFetchJSON = fetchJSON as jest.Mock

describe('userprofile', () => {
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
    app.get('/userprofile', userprofile)
    mockFetchJSON.mockReset()
    delete process.env.ADMIN_EMAILS
  })

  afterEach(async () => {
    await db.dropDatabase()
  })

  const userInfo = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'google-1', email: 'person@example.com', verified_email: true,
    name: 'Person', given_name: 'Person', family_name: '', picture: '', locale: 'en',
    ...overrides,
  })

  it('should reject when no authorization header is provided', async () => {
    const res = await request(app).get('/userprofile')
    expect(res.status).toBe(401)
  })

  it('should reject an unknown auth scheme', async () => {
    const res = await request(app).get('/userprofile').set('Authorization', 'Basic abc123')
    expect(res.status).toBe(401)
  })

  it('should reject when the google token cannot be verified', async () => {
    mockFetchJSON.mockRejectedValue(new Error('401 Unauthorized'))
    const res = await request(app).get('/userprofile').set('Authorization', 'Bearer google-token')
    expect(res.status).toBe(401)
  })

  it('should create a new user with the default role and return a signed token', async () => {
    mockFetchJSON.mockResolvedValue(userInfo())
    const res = await request(app).get('/userprofile').set('Authorization', 'Bearer google-token')

    expect(res.status).toBe(200)
    expect(res.body.role).toBe('user')
    expect(res.body.userinfo.email).toBe('person@example.com')
    expect(res.body.authorization).toMatch(/^Bearer /)

    const payload = await verifyToken<{userId: string}>(res.body.authorization.split(' ')[1])
    expect(payload?.userId).toBe(res.body._id)
  })

  it('should assign the admin role on first sign-in for an ADMIN_EMAILS address', async () => {
    // adminEmails is read from the env once at module load, so re-import the module fresh
    // with the env var already set, rather than mutating it after userprofile.ts has loaded.
    process.env.ADMIN_EMAILS = 'person@example.com, other@example.com'
    let freshApp!: express.Express
    let freshFetchJSON!: jest.Mock
    jest.isolateModules(() => {
      /* eslint-disable @typescript-eslint/no-var-requires */
      const {userprofile: freshUserprofile} = require('./userprofile')
      freshFetchJSON = require('../../../lib/fetch-json').fetchJSON
      /* eslint-enable @typescript-eslint/no-var-requires */
      freshApp = express()
      freshApp.use((req, _res, next) => { req.db = db; next() })
      freshApp.get('/userprofile', freshUserprofile)
    })
    freshFetchJSON.mockResolvedValue(userInfo())

    const res = await request(freshApp).get('/userprofile').set('Authorization', 'Bearer google-token')
    expect(res.body.role).toBe('admin')
  })

  it('should not downgrade an existing user whose role was set in the db', async () => {
    await db.collection('users').insertOne({role: 'admin', userinfo: userInfo(), lastLogin: new Date()})
    mockFetchJSON.mockResolvedValue(userInfo())
    const res = await request(app).get('/userprofile').set('Authorization', 'Bearer google-token')
    expect(res.body.role).toBe('admin')
    expect(await db.collection('users').countDocuments()).toBe(1)
  })
})
