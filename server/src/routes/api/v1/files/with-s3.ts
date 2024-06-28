import { NextFunction, Request, Response } from 'express'
import { S3Client } from '@aws-sdk/client-s3'

const getS3Client = () => {
  const credentials = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  }
  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    throw new Error('Unexpected error. Either S3_ACCESS_KEY_ID or S3_SECRET_ACCESS_KEY is unset.')
  }
  const region = process.env.S3_REGION // minio's default is 'us-east-1'
  if (!region) {
    throw new Error('Unexpected error. S3_REGION is unset.')
  }
  const endpoint = process.env.S3_ENDPOINT // ok to be unset for aws
  return new S3Client({region, credentials, endpoint, forcePathStyle: !!endpoint})
}
const getBucket = () => {
  const bucket = process.env.S3_BUCKET
  if (!bucket) {
    throw new Error('Unexpected error. S3_BUCKET is unset.')
  }
  return bucket
}

/** Middleware to attach an S3Client and a bucket name to the request context */
export const withS3 = (req:Request, _res:Response, next:NextFunction) => {
  req.s3 = getS3Client()
  req.bucket = getBucket()
  next()
}