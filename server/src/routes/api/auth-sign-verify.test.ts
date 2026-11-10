import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'
import { SignJWT, generateKeyPair } from 'jose'
import { clearSigningKeyCache, rotateSigningKey, signToken, verifyToken } from './auth-sign-verify'

describe('auth-sign-verify', () => {
  let mongoServer: MongoMemoryServer
  let client: MongoClient
  let db: Db

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    client = new MongoClient(mongoServer.getUri())
    await client.connect()
  }, 30000)

  afterAll(async () => {
    await client.close()
    await mongoServer.stop()
  })

  beforeEach(() => {
    db = client.db(`test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    clearSigningKeyCache()
  })

  afterEach(async () => {
    await db.dropDatabase()
  })

  it('should sign and verify', async () => {
    const {token, expires} = await signToken(db, {id: 1234})
    const result = await verifyToken(db, token)
    expect(result.id).toBe(1234)
    expect(expires).toBeGreaterThan(Date.now()/1000)
  })

  it('should verify after a server restart', async () => {
    const {token} = await signToken(db, {id: 1234})
    clearSigningKeyCache()
    await expect(verifyToken(db, token)).resolves.toMatchObject({id: 1234})
  })

  it('should keep signing with the stored key after a restart', async () => {
    await signToken(db, {id: 1})
    clearSigningKeyCache()
    await signToken(db, {id: 2})
    expect(await db.collection('signingKeys').countDocuments()).toBe(1)
  })

  it('should verify a token signed with the previous key after rotation', async () => {
    const {token} = await signToken(db, {id: 1234})
    await rotateSigningKey(db)
    const {token: newToken} = await signToken(db, {id: 5678})
    await expect(verifyToken(db, token)).resolves.toMatchObject({id: 1234})
    await expect(verifyToken(db, newToken)).resolves.toMatchObject({id: 5678})
    expect(await db.collection('signingKeys').countDocuments()).toBe(2)
  })

  it('should rotate once the current key is past its signing period', async () => {
    const {token} = await signToken(db, {id: 1234})
    await db.collection('signingKeys').updateMany({}, {$set: {signUntil: new Date(Date.now() - 1000)}})
    clearSigningKeyCache()
    const {token: newToken} = await signToken(db, {id: 5678})
    expect(await db.collection('signingKeys').countDocuments()).toBe(2)
    await expect(verifyToken(db, token)).resolves.toBeDefined()
    await expect(verifyToken(db, newToken)).resolves.toBeDefined()
  })

  it('should not verify with a retired key', async () => {
    const {token} = await signToken(db, {id: 1234})
    await db.collection('signingKeys').updateMany({}, {$set: {retireAt: new Date(Date.now() - 1000)}})
    clearSigningKeyCache()
    await expect(verifyToken(db, token)).rejects.toThrow(/retired/)
  })

  it('should not verify a token from a key it does not know', async () => {
    const {privateKey} = await generateKeyPair('RS256')
    const token = await new SignJWT({id: 1234}).setProtectedHeader({alg: 'RS256', kid: 'forged'}).setExpirationTime('1h').sign(privateKey)
    await expect(verifyToken(db, token)).rejects.toThrow(/Unknown/)
  })

  it('should not verify a token without a key id', async () => {
    const {privateKey} = await generateKeyPair('RS256')
    const token = await new SignJWT({id: 1234}).setProtectedHeader({alg: 'RS256'}).setExpirationTime('1h').sign(privateKey)
    await expect(verifyToken(db, token)).rejects.toThrow(/key id/)
  })

  it('should not verify a token whose signature does not match the key', async () => {
    const {token} = await signToken(db, {id: 1234})
    const [header, payload] = token.split('.')
    const {privateKey} = await generateKeyPair('RS256')
    const forged = await new SignJWT({id: 1234}).setProtectedHeader({alg: 'RS256'}).sign(privateKey)
    await expect(verifyToken(db, `${header}.${payload}.${forged.split('.')[2]}`)).rejects.toThrow()
  })
})
