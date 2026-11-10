import { Request, Response, Router, json } from 'express'
import { withDb } from '../../../../lib/mongo-rest-route/with-db'
import { checkUser } from '../../check-user'
import { CopyObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { withS3 } from './with-s3'
import { FileTooLargeError, formatMB, getMaxUploadSize, sizeLimit } from '../../../../lib/max-upload-size'
import { applyPatchRequest } from '../../../../lib/mongo-rest-route/apply-patch-request'
import { ValidationError, handleValidateError } from '../../../../lib/mongo-rest-route/validation-error'
import { getValidate } from '../../../../lib/mongo-rest-route/get-validate'
import { fileSchema } from '../../../../model/files'

const router = Router()
export const uploadFilesRouter = router

const { validate } = getValidate(fileSchema)

router.use(withDb, withS3)

class ClientCancelledError extends Error {
  constructor() {
    super('The client cancelled the upload or disconnected')
    this.name = 'ClientCancelledError'
  }
}

const upload = async (s3:S3Client, Bucket:string, Key: string, req:Request, maxSize:number) => {
  // enforces the limit even when Content-Length is missing or wrong
  const limiter = sizeLimit(maxSize)
  let tooLarge:FileTooLargeError|undefined
  limiter.on('error', (e) => { if (e instanceof FileTooLargeError) tooLarge = e })
  // pipe() doesn't end the destination if the client cancels or disconnects; without this the
  // S3 upload would wait forever (and leave an incomplete multipart upload behind)
  let cancelled = false
  req.on('close', () => {
    if (req.complete) return
    cancelled = true
    limiter.destroy(new ClientCancelledError())
  })
  req.pipe(limiter)
  try {
    await new Upload({client:s3, params: {Bucket, Key, Body: limiter, ACL: "public-read", ContentType: req.headers['content-type']}}).done()
  } catch (e) {
    throw tooLarge || (cancelled ? new ClientCancelledError() : e)
  }
}

const getURL = (s3:S3Client, bucket:string, filepath:string) => {
  const endpoint = process.env.S3_ENDPOINT // if unset, assume aws, otherwise it's likely a local minio for dev environment
  if (s3.config.forcePathStyle && filepath.startsWith(bucket)) {
    filepath = filepath.slice(bucket.length+1)
  }
  return endpoint ? `${endpoint}/${bucket}/${filepath}` : `https://${bucket}.s3.amazonaws.com/${filepath}`
}

/** upload a file and update or insert an entry */
router.post('/:filepath*', checkUser('admin'), async (req:Request, res:Response) => {
  const filepath = req.params[0].slice(1) || req.params.filepath
  console.log('filepath', filepath)
  const files = req.db.collection('files')
  const {tag} = req.query

  const { s3, bucket } = req

  const maxSize = getMaxUploadSize()
  const tooLargeMessage = (size?:number) => size
    ? `${filepath} is ${formatMB(size)}, which is larger than the ${formatMB(maxSize)} upload limit.`
    : `${filepath} is larger than the ${formatMB(maxSize)} upload limit.`
  const contentLength = Number(req.headers['content-length'])
  if (contentLength > maxSize) {
    res.status(413).set('Connection', 'close').send({error: tooLargeMessage(contentLength)})
    return
  }

  try {
    await upload(s3, bucket, filepath, req, maxSize)
  } catch (e) {
    if (e instanceof ClientCancelledError) {
      console.log(`Upload of ${filepath} was cancelled`)
      return
    }
    if (e instanceof FileTooLargeError) {
      res.status(413).set('Connection', 'close').send({error: tooLargeMessage()})
      return
    }
    // Express 4 doesn't catch async rejections; an uncaught one here crashes the process
    console.error(`Upload of ${filepath} to S3 failed`, e)
    res.status(502).send({error: 'Failed to store the file.'})
    return
  }
  const url = getURL(s3, bucket, filepath)

  const found = await files.findOne({url})
  if (found) {
    if (tag) await files.updateOne(found, {tag})
    res.send({ _id: found._id, url, tag })
    return
  }

  const insertRes = await files.insertOne({url, tag, added: new Date()})
  res.send({ _id: insertRes.insertedId, url, tag })
})

/** delete an entry and the associated s3 file */
router.delete('/:filepath*', async (req: Request, res: Response) => {
  const filepath = req.params[0].slice(1) || req.params.filepath
  const { s3, bucket } = req
  const url = getURL(s3, bucket, filepath)

  const files = req.db.collection('files')
  const entry = await files.findOne({url})
  if (!entry) {
    console.log('url', url, 'filepath', filepath)
    res.status(404).send({error: `Not found. It's likely the File was already deleted.`})
    return
  }


  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: filepath }))
  await files.deleteOne({'_id': entry._id})
  res.send({message: 'The file has been removed.'})
})

const noManagedDates = false
const dateFields = {
  added: 'added',
  lastModified: 'lastModified',
  deleted: 'deleted'
}

router.patch('/:filepath*', json(), async (req:Request, res:Response)=>{
  const filepath = req.params[0].slice(1) || req.params.filepath
  const { s3, bucket } = req
  const url = getURL(s3, bucket, filepath)

  const c = req.db.collection('files')
  const criteria = {url}
  if (!noManagedDates) {
    (criteria as {[key:string]:any})[dateFields.deleted] = { "$exists" : false }
  }
  const origObject = await c.findOne(criteria)
  if (!origObject) {
    res.status(404).send({error: 'That file could not be found.'})
    return
  }

  try {
    const newObject = applyPatchRequest(origObject, req)
    if (newObject.url != origObject.url) {
      throw new ValidationError('The url field is read only. Try setting "rename" instead.', 'l/url')
    }
    const newFilepath:string = typeof newObject.rename === 'string' ? newObject.rename : ''
    delete newObject.rename
    validate(newObject, {isUpdate:true})

    const oldUrl = origObject.url
    const newUrl = getURL(s3, bucket, newFilepath)
    const isRename = !!newFilepath && newUrl != oldUrl
    let failedToCopy = false
    if (isRename) {
      try {
        await s3.send(new CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${filepath}`, Key: newFilepath}))
        newObject.url = newUrl
      } catch (e) {
        throw new Error(`Could not rename s3 file: ${filepath}`)
      }
    }

    if (!noManagedDates) {
      (newObject as {[key:string]:any})[dateFields.lastModified] = new Date()
    }
    console.log('newObject', newObject)
    const result = await c.updateOne({'_id': origObject._id}, {$set: newObject})

    if (isRename && !failedToCopy) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: filepath }))
      } catch (e) {
        console.warn(`Could not delete s3 file: ${filepath}`)
      }
    }

    res.send({modifiedCount: result.matchedCount, url: newUrl})
  } catch (e) {
    console.log('HERE !!!!!!',e)
    handleValidateError(e, res)
    return
  }
})