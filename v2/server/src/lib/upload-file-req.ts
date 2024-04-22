import { Request } from 'express'
import { Readable } from 'stream'
import { Upload } from '@aws-sdk/lib-storage'
import { S3Client } from '@aws-sdk/client-s3'
import busboy from 'busboy'

const MB = 1024*1024

export class FileTooLargeError extends Error {
  constructor() {
    super('File too large')
    this.name = 'FileTooLargeError'
  }
}

interface Options {
  fileSizeLimit?: number
}
export const uploadFileReq = async (req:Request, options:Options) => {
  const {fileSizeLimit=100*MB} = options || {}

  if (!process.env.AWS_S3_ACCESS_KEY_ID) throw new Error('AWS_S3_ACCESS_KEY_ID is not set')
  if (!process.env.AWS_S3_SECRET_KEY) throw new Error('AWS_S3_SECRET_KEY is not set')
  if (!process.env.AWS_S3_BUCKET) throw new Error('AWS_S3_BUCKET is not set')
  if (!process.env.AWS_S3_REGION) throw new Error('AWS_S3_REGION is not set')

  const s3Client = new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_KEY as string,
    }
  })

  return new Promise((resolve, reject)=>{
    const bb = busboy({
      headers: req.headers,
      limits: { fileSize : fileSizeLimit }
    })
    bb.on('file', (_fieldname:string, file:Readable, info) => {
      const {filename, mimeType } = info
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          ContentType: mimeType || undefined,
          ACL: 'public-read',
          Body: file,
        },
      })
      upload.done().then(x=>resolve(x.Location))
      .catch(reject)
    })
    bb.on('limit', ()=>{
      reject(new FileTooLargeError())
    })
  })
}