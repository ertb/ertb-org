import { Request, Response, Router } from 'express'
import { withDb } from '../../../../lib/mongo-rest-route/with-db'
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { withS3 } from './with-s3'

const router = Router()
export const streamFilesRouter = router

router.use(withDb, withS3)

/** stream a video from S3 */
router.get('/:filepath(*.mp4)', async (req: Request, res: Response) => {
  const filepath = req.params.filepath || req.params[0]
  const range = req.headers.range;
  if (!range) {
    res.status(416).send({error: 'Range not provided'})
    return
  }

  const { s3, bucket } = req

  const headRes = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: filepath }))
  const contentLength = headRes.ContentLength
  if (!contentLength) {
    res.status(404).send({error: 'Not found'})
    return
  }
  const lastModified = headRes.LastModified?.toUTCString()
  const etag = headRes.ETag

  const [starts, ends] = range.replace(/bytes=/, '').split('-')
  const start = parseInt(starts, 10)
  const end = ends ? parseInt(ends, 10) : contentLength - 1

  const getRes = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: filepath, Range: range }))
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
    res.status(502).send({error: 'Failed to get content from S3.'})
    return
  }

  // casting since pipe is unexpectedly undefined for GetObjectCommandOutput.Body
  interface HasPipe { pipe: (x:Response)=>void }
  (getRes.Body as HasPipe).pipe(res)
})

/** stream a file from S3 */
router.get('/:filepath', async (req: Request, res: Response) => {
  const filepath = req.params.filepath || req.params[0]
  const { s3, bucket } = req

  const headRes = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: filepath }))
  const contentLength = headRes.ContentLength
  if (!contentLength) {
    res.status(404).send({error: 'Not found'})
    return
  }

  const getRes = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: filepath }))
  if (!getRes.Body) {
    res.status(502).send({error: 'Failed to get content from S3.'})
    return
  }

  // casting since pipe is unexpectedly undefined for GetObjectCommandOutput.Body
  interface HasPipe { pipe: (x:Response)=>void }
  (getRes.Body as HasPipe).pipe(res)
})