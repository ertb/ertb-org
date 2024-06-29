import { Request, Response, Router, json } from 'express'
import { withDb } from '../../../../lib/mongo-rest-route/with-db'
import { checkUser } from '../../check-user'
import { CopyObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { withS3 } from './with-s3'
import { Stream } from 'stream'
import { applyPatchRequest } from '../../../../lib/mongo-rest-route/apply-patch-request'
import { ValidationError, handleValidateError } from '../../../../lib/mongo-rest-route/validation-error'
import { getValidate } from '../../../../lib/mongo-rest-route/get-validate'
import { fileSchema } from '../../../../model/files'

const router = Router()
export const uploadFilesRouter = router

const { validate } = getValidate(fileSchema)

router.use(withDb, withS3)

const upload = async (s3:S3Client, Bucket:string, Key: string, req:Request) => {
  var pass = new Stream.PassThrough()
  const promise = new Upload({client:s3, params: {Bucket, Key, Body: pass}}).done()
  req.pipe(pass)
  await promise
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

  // TODO: server-side file size limit (there is a client-side maxSize in file-drop-zone.tsx)
  await upload(s3, bucket, filepath, req)
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