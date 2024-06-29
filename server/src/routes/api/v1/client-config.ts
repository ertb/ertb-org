import { Request, Response } from "express"
import pkg from '../../../../../package.json'

export const clientConfig = (_req:Request, res:Response) => {
  res.send({
    clientId: process.env.GOOGLE_API_CLIENT_ID || '',
    commit: process.env.SOURCE_VERSION || '',
    version: pkg.version,
  })
}