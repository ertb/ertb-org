import { secs } from "@/lib/secs"
import { FlattenedJWSInput, GenerateKeyPairResult, JWK, JWSHeaderParameters, JWTPayload, KeyLike, SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, jwtVerify } from "jose"

type JWKSFunction = (protectedHeader?: JWSHeaderParameters | undefined, token?: FlattenedJWSInput | undefined) => Promise<KeyLike>

export class NoSigningKeyError extends Error {
}

interface Secret {
  jwks?:JWKSFunction
  keyPair?: GenerateKeyPairResult<KeyLike>
  lastKeyPair?: GenerateKeyPairResult<KeyLike>
  rotateTime: number
  lastRotateTime: number
}
const secret:Secret = {
  jwks: undefined,
  keyPair: undefined,
  lastKeyPair: undefined,
  rotateTime: 0,
  lastRotateTime: 0,
}

/** Schedules repeated execution of signing key rotation */
export const signingKeyRotation = (interval?:string) => {
  const ms = 1000 * Math.abs(secs(interval || '1 day'))
  return setInterval(()=>getSigningKey({forceRotate:true}), ms)
}

interface GetSigningKeyOptions {
  forceRotate?: boolean
}
export const getSigningKey = async (options?:GetSigningKeyOptions) => {
  const {forceRotate=false} = options || {}
  const now = Date.now()

  if (forceRotate || !secret.keyPair || secret.rotateTime <= now) {
    secret.lastRotateTime = secret.rotateTime
    secret.lastKeyPair = secret.keyPair

    secret.rotateTime = now + Math.abs(secs(process.env.JWK_ROTATION_TIME || '1 day')) * 1000
    secret.keyPair = await generateKeyPair('RS256')

    const keys:JWK[] = []
    if (secret.lastKeyPair) keys.push(await exportJWK(secret.lastKeyPair.publicKey))
    keys.unshift(await exportJWK(secret.keyPair.publicKey))
    secret.jwks = createLocalJWKSet({keys})
  }
  return secret.keyPair.privateKey
}

export const signToken = async (payload:JWTPayload) => {
  const signingKey = await getSigningKey()
  const expiresIn = secs(process.env.JWT_EXPIRATION_TIME || '1 day')
  const expiriationTime = Math.trunc(Date.now()/1000) + expiresIn
  const jwt = new SignJWT(payload)
  .setProtectedHeader({alg: 'RS256'})
  .setIssuedAt()
  .setExpirationTime(expiriationTime)

  if (process.env.JWT_ISSUER) jwt.setIssuer(process.env.JWT_ISSUER)
  if (process.env.JWT_AUDIENCE) jwt.setIssuer(process.env.JWT_AUDIENCE)

  const token = await jwt.sign(signingKey)
  return {token, expires: expiriationTime}
}

export const verifyToken = async <T extends JWTPayload> (jwt:string) => {
  const options = {
    issuer: process.env.JWT_ISSUER || undefined,
    audience: process.env.JWT_AUDIENCE || undefined,
  }
  if (!secret.jwks) {
    throw new Error('No signing key. User needs to login in again.')
  }

  const result = await jwtVerify(jwt, secret.jwks, options)
  .catch(async (e) => {
    if (e?.code === 'ERR_JWKS_MULTIPLE_MATCHING_KEYS') {
      // multiple matches -- go through the list
      for await (const publicKey of e) {
        try {
          await jwtVerify(jwt, publicKey, options)
        } catch (innerError) {
          if (innerError?.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            continue // continue to the next key
          }
          throw innerError
        }
      }
      throw new Error('JWS signature verification failed')
    }
    throw e
  })
  return result.payload as T
}
