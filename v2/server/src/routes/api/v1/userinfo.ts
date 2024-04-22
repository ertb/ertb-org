import { Request, Response, Router } from 'express'
import { withDb } from '../with-db'
import { signToken } from '../auth-sign-verify'
import { Db, ObjectId } from 'mongodb'

const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e=>e.trim().toLowerCase()) || []

const router = Router()

interface Profile {
  email: string
}
interface User {
  _id: ObjectId
  role: string
  profile: Profile
}

const updateOrCreateUser = async (db:Db, profile:Profile, insertRole:string, isAdminEmail:true|undefined) => {
  const found = await db.collection('users').findOneAndUpdate({profile:{email: profile.email}}, {...profile}, {returnDocument:'after'})
  if (found) return found as User
  const newUser = await db.collection('users').insertOne({role:insertRole, profile, isAdminEmail})
  return {role:insertRole, profile, _id: newUser.insertedId} as User
}

router.get('/', withDb, async (req: Request, res: Response) => {
  let isAdminEmail:true|undefined = undefined
  const {authorization} = req.headers
  if (!authorization) {
    res.status(401).send({err: 'authorization not provided'})
    return
  }

  const headers = {
    Authorization: authorization,
    Accept: 'application/json'
  }

  const [scheme, access_token] = authorization.split(' ')
  if (scheme.toLowerCase() != 'bearer') {
    res.status(401).send({err: `Unknown authorization scheme: ${scheme}`})
    return
  }

  // validate access_token from google
  fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`, {headers})
  .then(res => {
    if (!res.ok) {
      console.error(`failed to sign-in with google: ${res.status} ${res.statusText}`)
      throw new Error('failed to sign-in with google')
    }
    return res.json()
  })
  .then(async (profile) => {
    let fallbackRole = 'user'
    if (adminEmails.indexOf(profile.email.toLowerCase()) >= 0) {
      // set role upon first sign-in (setting in db.users overrides this)
      fallbackRole = 'admin'
      isAdminEmail = true
    }
    const user = await updateOrCreateUser(req.db, profile, fallbackRole, isAdminEmail)
    if (!user) {
      console.error('Could not find or create user')
      res.status(500).send({err: 'Could not find or create user'})
      return
    }
    const token = await signToken({userId: user?._id})
    res.send({user, authorization: `Bearer ${token}`})
  })
})

export const userinfo = router