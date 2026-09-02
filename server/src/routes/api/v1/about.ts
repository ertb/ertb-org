import { Request, Response } from 'express'
import { getValidate } from '../../../lib/mongo-rest-route/get-validate'
import { handleValidateError } from '../../../lib/mongo-rest-route/validation-error'
import { aboutSchema } from '../../../model/about'

const ABOUT_ID = 'about'

interface ContentDoc { _id: string, markdown: string }
const contentCollection = (req:Request) => req.db.collection<ContentDoc>('content')

const { validate } = getValidate(aboutSchema, { noManagedDates: true })

/** GET /api/v1/about - retrieve the About section markdown */
export const getAbout = async (req:Request, res:Response) => {
  // the admin editor re-fetches this right after saving, so it must never be served from cache
  res.set('Cache-Control', 'no-store')
  const found = await contentCollection(req).findOne({ _id: ABOUT_ID })
  if (!found) {
    res.status(404).send({ error: 'No About content has been saved yet.' })
    return
  }
  res.send({ markdown: found.markdown })
}

/** PUT /api/v1/about - replace the About section markdown */
export const putAbout = async (req:Request, res:Response) => {
  try {
    const { markdown } = validate(req.body)
    await contentCollection(req).updateOne(
      { _id: ABOUT_ID },
      { $set: { markdown } },
      { upsert: true }
    )
    res.send({ markdown })
  } catch (e) {
    handleValidateError(e as Error, res)
  }
}
