import { NextFunction, Request, Response } from "express"
import { MongoClient, MongoError, MongoServerError } from "mongodb"

const clients:{[key:string]:MongoClient|undefined} = {}

// Note: typescript requires ./types/index.d.ts to exist so db shows up on express.Request

/**
 * Middleware to add db instance to the Request. Uses env var MONGO_URL to define connection.
 * 
 * @example
 * app.get('/api/v1/users', async (req:Request, res:Response) => {
 *   res.send(await req.db.collection('users').find({}).toArray())
 * })
 */
export const withDb = (req: Request, res: Response, next?: NextFunction) => {
  const mongoURL = process.env.MONGO_URL
  if (!mongoURL) throw new Error("MONGO_URL not set")

  try {
    console.log('Connecting to', mongoURL, '...')
    const start = Date.now()
    const client = clients[mongoURL] || new MongoClient(mongoURL)
    clients[mongoURL] = client
    const db = client.db()
    console.log('Connected to', mongoURL, 'in', `${(Date.now()-start)/1000} seconds`)

    req.db = db
  } catch (e) {
    console.log('Unexpected error.', e)
    if (e instanceof MongoError) {
      clients[mongoURL]?.close()
      clients[mongoURL] = undefined
    }
    if (e instanceof MongoServerError) {
      res.status(503).send({error: 'Mongo server is overloaded.'})
      return
    }
    if (e instanceof MongoError) {
      res.status(500).send({error: 'Unexpected Mongo error.'})
      return
    }
    res.status(500).send({error: 'Unexpected error.'})
  }
  if (next) next()
}