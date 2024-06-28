import { NextFunction, Request, Response } from "express"
import { withDb } from "../../lib/mongo-rest-route/with-db"
import { verifyToken } from "./auth-sign-verify"
import { JWTPayload } from "jose"
import { ObjectId } from "mongodb"

// Note: typescript requires src/types/express/index.d.ts to add db entry to Request

interface HasUserId extends JWTPayload {
  userId: string
}

/** middleware to ensure a valid authorization token (from /api/v1/userinfo) is provided */
export const checkUser = (role?:string) => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.db) withDb(req, res)

  if (!req.headers.authorization) {
    res.status(401).send({error: 'Authorization not provided'})
    return
  }

  const [authScheme, jwt] = req.headers.authorization.split(' ')
  if (authScheme.toLowerCase() != 'bearer') {
    console.warn(`Unknown authorization scheme: ${authScheme}`)
    res.status(401).send({error: `Unknown authorization scheme: ${authScheme}`})
    return
  }
  let payload:HasUserId
  try {
    payload = await verifyToken<HasUserId>(jwt)
  } catch (e) {
    console.debug(e)
    res.status(401).send({error: 'Could not verify bearer token. User should sign in again.'})
    return
  }

  const user = await req.db.collection('users').findOne(new ObjectId(payload.userId))
  if (!user) {
    console.warn('Could not verify user')
    res.status(401).send({error: 'Could not verify user'})
    return
  }

  if (user.role != role) {
    console.warn('User is not authorized')
    res.status(403).send({error: 'User is not authorized'})
  }
  next()
}