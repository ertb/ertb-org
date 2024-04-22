import { NextFunction, Request, Response } from "express"
import { MongoClient } from "mongodb"


// Note: typescript requires src/types/express/index.d.ts to add db entry to Request

/** middleware to add db instance to the Request */
export const withDb = (req: Request, _res: Response, next?: NextFunction) => {
  const mongoURL = process.env.MONGO_URL
  if (!mongoURL) throw new Error("MONGO_URL not set")
  const client = new MongoClient(mongoURL)
  const db = client.db()
  req.db = db
  if (next) next()
}