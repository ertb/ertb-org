import { Request, Response, Router } from 'express'
import { ObjectId } from 'mongodb'
import { withDb } from '../with-db'
import { checkUser } from '../check-user'
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const router = Router()
router.use(withDb)

const getS3Client = () => {
  const credentials = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  }
  if (!credentials.accessKeyId || credentials.secretAccessKey) {
    throw new Error('Unexpected error. Either S3_ACCESS_KEY_ID or S3_SECRET_ACCESS_KEY is unset.')
  }
  const region = process.env.S3_REGION
  if (!region) {
    throw new Error('Unexpected error. S3_REGION is unset.')
  }
  const endpoint = process.env.S3_ENDPOINT
  return new S3Client({region, credentials, endpoint})
}
const getBucket = () => {
  const bucket = process.env.S3_BUCKET
  if (!bucket) {
    throw new Error('Unexpected error. S3_BUCKET is unset.')
  }
  return bucket
}

/** list all files in the collection */
router.get('/', async (req: Request, res: Response) => {
  const defaultLimit = 25
  const {tag, limitStr=defaultLimit.toString()} = req.query

  let limit = parseInt(limitStr.toString())
  if (isNaN(limit) || limit < 0) limit = defaultLimit

  const files = req.db.collection('files')
  const query = tag ? {tag} : {}
  res.send(await files.find(query).sort({added:-1}).limit(limit).toArray())
})

/** list of available tags */
router.get('/tags', async (req: Request, res: Response) => {
  const files = req.db.collection('files')
  const tags = await files.distinct('tag')
  res.send(tags)
})

/** stream a video from S3 */
router.get('/:filepath(*.mp4)', async (req: Request, res: Response) => {
  const filepath = req.params.filepath || req.params[0]
  const range = req.headers.range;
  if (!range) {
    res.status(416).send({err: 'Range not provided'})
    return
  }

  const client = getS3Client()
  const bucket = getBucket()

  const headRes = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: filepath }))
  const contentLength = headRes.ContentLength
  if (!contentLength) {
    res.status(404).send({err: 'Not found'})
    return
  }
  const lastModified = headRes.LastModified?.toUTCString()
  const etag = headRes.ETag

  const [starts, ends] = range.replace(/bytes=/, '').split('-')
  const start = parseInt(starts, 10)
  const end = ends ? parseInt(ends, 10) : contentLength - 1

  const getRes = await client.send(new GetObjectCommand({ Bucket: bucket, Key: filepath, Range: range }))
  res.status(206)

  Object.entries({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Length': (end-start)+1,
    'Content-Range': `bytes ${start}-${end}/${contentLength}`,
    'Content-Type': 'video/mp4',
    'ETag': etag,
    'Keep-Alive': 'timeout=5',
    'Last-Modified': lastModified,
  }).forEach(([k,v])=>v && res.setHeader(k,v))
    
  if (!getRes.Body) {
    res.status(502).send({err: 'Failed to get content from S3.'})
    return
  }

  // casting since pipe is unexpectedly undefined for GetObjectCommandOutput.Body
  interface HasPipe { pipe: (x:Response)=>void }
  (getRes.Body as HasPipe).pipe(res)
})

/** get an entry using it's ID */
router.get('/:id', async (req: Request, res: Response) => {
  const files = req.db.collection('files')
  const {id} = req.params
  const entry = await files.findOne({'_id': new ObjectId(id)})
  res.send(entry)
})

/** delete an entry using it's ID */
router.delete('/:id', checkUser('admin'), async (req: Request, res: Response) => {
  const files = req.db.collection('files')
  const {id} = req.params
  const entry = await files.findOne({'_id': new ObjectId(id)})
  if (!entry) {
    res.status(404).send({error: `Not found. It's likely the File was already deleted.`})
    return
  }
  const filepath = new URL(entry.url).pathname.slice(1)

  const client = getS3Client()
  const bucket = getBucket()

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: filepath }))
  await files.deleteOne({'_id': new ObjectId(id)})
  res.send({message: 'The file has been removed.'})
})

/** change the tag on an image */
router.post(':id/tag/:tag', checkUser('admin'), async (req, res) => {
  const files = req.db.collection('files')
  const {id, tag} = req.params
  const updateRes = await files.updateOne({_id: new ObjectId(id)}, {tag})
  if (updateRes.matchedCount < 1) {
    res.status(404).send({error: 'That file was not found.'})
    return
  }
  res.send({message: 'The file tag has been updated.'})
})

/** upload a file and update or insert an entry */
router.post(':filepath(.*)', checkUser('admin'), async (req:Request, res:Response) => {
  const files = req.db.collection('files')
  const {filepath} = req.params
  const {tag} = req.query

  const client = getS3Client()
  const bucket = getBucket()

  // TODO: server-side file size limit (there is a client-side maxSize in file-drop-zone.tsx)
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: filepath, Body: req.body }))
  const url = `https://${bucket}.s3.amazonaws.com/${filepath}`

  const found = await files.findOne({url})
  if (found) {
    if (tag) await files.updateOne(found, {tag})
    res.send({ _id: found._id, url, tag })
    return
  }

  const insertRes = await files.insertOne({url, tag, added: new Date()})
  res.send({ _id: insertRes.insertedId, url, tag })
})

export const files = router