import { Request, Response, Router } from 'express'
import { withDb } from '../with-db'
import { signToken } from '../auth-sign-verify'
import { Db, ObjectId } from 'mongodb'
import { fetchJSON } from '@/lib/fetch-json'

const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e=>e.trim().toLowerCase()) || []

const router = Router()
export const userprofile = router

// expected response from googleapis.com/oauth2/v1/userinfo
interface UserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string // url
  locale: string
}
interface User {
  _id: ObjectId
  role: string
  userinfo: UserInfo
}

const updateOrCreateUser = async (db:Db, userinfo:UserInfo, insertRole:string, isAdminEmail:true|undefined) => {
  const found = await db.collection('users').findOneAndUpdate({userinfo:{email: userinfo.email}}, {"$set":{userinfo}}, {returnDocument:'after'})
  if (found) return found as User
  const newUser = await db.collection('users').insertOne({role:insertRole, userinfo, isAdminEmail})
  return {role:insertRole, userinfo, _id: newUser.insertedId} as User
}

router.get('/', withDb, async (req:Request, res:Response) => {
  let isAdminEmail:true|undefined = undefined
  const {authorization} = req.headers
  if (!authorization) {
    res.status(401).send({err: 'authorization not provided'})
    return
  }
  console.log('authorization', authorization)

  const headers = {
    Authorization: authorization,
  }

  const [scheme, access_token] = authorization.split(' ')
  if (scheme.toLowerCase() != 'bearer') {
    res.status(401).send({err: `Unknown authorization scheme: ${scheme}`})
    return
  }

  // validate access_token from google
  console.log('access_token', access_token)
  fetchJSON<UserInfo>(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`, {headers})
  .then(async (userinfo) => {
    console.log('google userinfo', userinfo)
    let fallbackRole = 'user'
    if (adminEmails.indexOf(userinfo.email.toLowerCase()) >= 0) {
      // set role upon first sign-in (setting in db.users overrides this)
      fallbackRole = 'admin'
      isAdminEmail = true
    }
    const user = await updateOrCreateUser(req.db, userinfo, fallbackRole, isAdminEmail)
    if (!user) {
      console.error('Could not find or create user')
      res.status(500).send({err: 'Could not find or create user'})
      return
    }
    const {token, expires} = await signToken({userId: user?._id})
    res.send({...user, authorization: `Bearer ${token}`, expires})
  })
  .catch((err:unknown)=>{
    console.log('err', err)
    console.error('Could not authenticate user')
    res.status(401).send('Could not authenticate user')
  })
})