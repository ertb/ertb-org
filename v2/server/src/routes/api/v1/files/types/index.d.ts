// src/types/express/index.d.ts

import { S3Client } from "@aws-sdk/client-s3"
import { Db } from "mongodb"

// to make the file a module and avoid the TypeScript error
export {}

declare global {
  namespace Express {
    export interface Request {
      db: Db
      s3: S3Client
      bucket: string
    }
  }
}