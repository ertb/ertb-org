import { randomUUID } from "crypto"
import { Db } from "mongodb"
import { JWK, JWTPayload, KeyLike, SignJWT, decodeProtectedHeader, exportJWK, generateKeyPair, importJWK, jwtVerify } from "jose"
import { secs } from "../../lib/secs"

/**
 * JWT signing keys are kept in the `signingKeys` collection so tokens survive server restarts
 * and verify on any dyno. A new key is generated each JWK_ROTATION_TIME (default 1 day); each
 * key stays valid for verification until the last token it could have signed has expired, after
 * which a TTL index removes it.
 */

const ALG = 'RS256'
const COLLECTION = 'signingKeys'

interface SigningKeyDoc {
  _id: string // the key id (kid)
  privateJwk: JWK
  publicJwk: JWK
  created: Date
  /** stop signing with this key after this time */
  signUntil: Date
  /** stop verifying with this key after this time (TTL index deletes the doc) */
  retireAt: Date
}

interface CachedKey {
  kid: string
  key: KeyLike | Uint8Array
  until: number // ms since epoch
}

// in-memory caches, keyed by database name so separate dbs (ie., tests) don't share keys
const signingCache = new Map<string, CachedKey>()
const verifyCache = new Map<string, CachedKey>()
const cacheKey = (db:Db, kid='') => `${db.databaseName}/${kid}`

const rotationMs = () => 1000 * Math.abs(secs(process.env.JWK_ROTATION_TIME || '1 day'))
const expirationSecs = () => Math.abs(secs(process.env.JWT_EXPIRATION_TIME || '1 day'))

/** for tests: simulate a server restart */
export const clearSigningKeyCache = () => {
  signingCache.clear()
  verifyCache.clear()
}

/** Generates a new signing key and stores it. Normally called by getSigningKey as keys expire. */
export const rotateSigningKey = async (db:Db) => {
  const collection = db.collection<SigningKeyDoc>(COLLECTION)
  await collection.createIndex({retireAt: 1}, {expireAfterSeconds: 0})

  const {privateKey, publicKey} = await generateKeyPair(ALG, {extractable: true})
  const now = Date.now()
  const signUntil = now + rotationMs()
  const doc:SigningKeyDoc = {
    _id: randomUUID(),
    privateJwk: await exportJWK(privateKey),
    publicJwk: await exportJWK(publicKey),
    created: new Date(now),
    signUntil: new Date(signUntil),
    // a token signed just before signUntil must still verify until it expires
    retireAt: new Date(signUntil + expirationSecs() * 1000),
  }
  await collection.insertOne(doc)

  // If two dynos rotate at the same moment, both keys are stored and both verify -- harmless.
  signingCache.set(cacheKey(db), {kid: doc._id, key: privateKey, until: signUntil})
  verifyCache.set(cacheKey(db, doc._id), {kid: doc._id, key: publicKey, until: doc.retireAt.getTime()})
  return doc._id
}

const getSigningKey = async (db:Db) => {
  const now = Date.now()
  const cached = signingCache.get(cacheKey(db))
  if (cached && cached.until > now) return cached

  const doc = await db.collection<SigningKeyDoc>(COLLECTION)
    .find({signUntil: {$gt: new Date(now)}})
    .sort({created: -1})
    .limit(1)
    .next()
  if (doc) {
    const entry = {kid: doc._id, key: await importJWK(doc.privateJwk, ALG), until: doc.signUntil.getTime()}
    signingCache.set(cacheKey(db), entry)
    return entry
  }

  await rotateSigningKey(db)
  return signingCache.get(cacheKey(db)) as CachedKey
}

const getVerifyKey = async (db:Db, kid:string) => {
  const now = Date.now()
  const cached = verifyCache.get(cacheKey(db, kid))
  if (cached && cached.until > now) return cached.key

  const doc = await db.collection<SigningKeyDoc>(COLLECTION).findOne({_id: kid, retireAt: {$gt: new Date(now)}})
  if (!doc) {
    verifyCache.delete(cacheKey(db, kid))
    throw new Error('Unknown or retired signing key. User needs to sign in again.')
  }
  const key = await importJWK(doc.publicJwk, ALG)
  verifyCache.set(cacheKey(db, kid), {kid, key, until: doc.retireAt.getTime()})
  return key
}

export const signToken = async (db:Db, payload:JWTPayload) => {
  const {kid, key} = await getSigningKey(db)
  const expires = Math.trunc(Date.now()/1000) + expirationSecs()
  const jwt = new SignJWT(payload)
  .setProtectedHeader({alg: ALG, kid})
  .setIssuedAt()
  .setExpirationTime(expires)

  if (process.env.JWT_ISSUER) jwt.setIssuer(process.env.JWT_ISSUER)
  if (process.env.JWT_AUDIENCE) jwt.setAudience(process.env.JWT_AUDIENCE)

  const token = await jwt.sign(key)
  return {token, expires}
}

export const verifyToken = async <T extends JWTPayload> (db:Db, jwt:string) => {
  const {kid} = decodeProtectedHeader(jwt)
  if (!kid) throw new Error('Token has no key id. User needs to sign in again.')

  const key = await getVerifyKey(db, kid)
  const {payload} = await jwtVerify(jwt, key, {
    algorithms: [ALG],
    issuer: process.env.JWT_ISSUER || undefined,
    audience: process.env.JWT_AUDIENCE || undefined,
  })
  return payload as T
}
