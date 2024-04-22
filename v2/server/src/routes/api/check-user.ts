import { NextFunction, Request, Response } from "express"
import { withDb } from "./with-db"
import { verifyToken } from "./auth-sign-verify"
import { JWTPayload } from "jose"
import { ObjectId } from "mongodb"

// Note: typescript requires src/types/express/index.d.ts to add db entry to Request

interface HasUserId extends JWTPayload {
  userId: string
}

/** middleware to ensure a valid authentication token (from /api/v1/userinfo) is provided */
export const checkUser = (role?:string) => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.db) withDb(req, res)

  if (!req.headers.authorization) {
    res.status(401).send({err: 'Authentication not provided'})
    return
  }

  const [authScheme, jwt] = req.headers.authorization.split(' ')
  if (authScheme.toLowerCase() != 'bearer') {
    res.status(401).send({err: `Unknown authentication scheme: ${authScheme}`})
    return
  }
  const payload = await verifyToken<HasUserId>(jwt)
  if (!payload) {
    res.status(401).send({err: 'Could not verify bearer token'})
    return
  }

  const user = await req.db.collection('auth').findOne(new ObjectId(payload.userId))
  if (!user) {
    res.status(401).send({err: 'Could not verify user'})
    return
  }

  if (user.role != role) {
    res.status(403).send({err: 'User is not authorized'})
  }
  next()
}