import { Request, Response } from 'express'
import { withDb } from '../../../lib/mongo-rest-route/with-db'
import { signToken } from '../auth-sign-verify'
import { Db, ObjectId } from 'mongodb'
import { fetchJSON } from '@/lib/fetch-json'

const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e=>e.trim().toLowerCase()) || []

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
  lastLogin: Date
}

const updateOrCreateUser = async (db:Db, userinfo:UserInfo, insertRole:string, isAdminEmail:true|undefined) => {
  const lastLogin = new Date()
  const found = await db.collection('users').findOneAndUpdate({'userinfo.email': userinfo.email}, {"$set":{userinfo, lastLogin}}, {returnDocument:'after'})
  if (found) return found as User
  const newUser = await db.collection('users').insertOne({role:insertRole, userinfo, isAdminEmail, lastLogin})
  return {role:insertRole, userinfo, _id: newUser.insertedId} as User
}

export const userprofile = async (req:Request, res:Response) => {
  if (!req.db) await new Promise((resolve)=>withDb(req, res, resolve))

  let isAdminEmail:true|undefined = undefined
  const {authorization} = req.headers
  if (!authorization) {
    res.status(401).send({error: 'Authorization not provided'})
    return
  }

  const headers = {
    Authorization: authorization,
  }

  const [scheme, access_token] = authorization.split(' ')
  if (scheme.toLowerCase() != 'bearer') {
    res.status(401).send({error: `Unknown authorization scheme: ${scheme}`})
    return
  }

  // validate access_token from google
  fetchJSON<UserInfo>(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`, {headers})
  .then(async (userinfo) => {
    let fallbackRole = 'user'
    if (adminEmails.indexOf(userinfo.email.toLowerCase()) >= 0) {
      // set role upon first sign-in (setting in db.users overrides this)
      fallbackRole = 'admin'
      isAdminEmail = true
    }
    const user = await updateOrCreateUser(req.db, userinfo, fallbackRole, isAdminEmail)
    if (!user) {
      console.error('Could not find or create user')
      res.status(500).send({error: 'Could not find or create user'})
      return
    }
    const {token, expires} = await signToken({userId: user?._id})
    res.send({...user, authorization: `Bearer ${token}`, expires})
  })
  .catch((e:unknown)=>{
    console.error('Could not authenticate user', e)
    res.status(401).send('Could not authenticate user')
  })
}