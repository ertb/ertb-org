import { Message, PostedMessage, postedMessageSchema } from "../../../../model/messages"
import { Request, Response, json } from "express"
import { ValidationError, handleValidateError } from "../../../../lib/mongo-rest-route/validation-error"
import { sendEmail } from "../../../../lib/email"
import Ajv from "../../../../lib/mongo-rest-route/ajv-with-formats"
import { withDb } from "../../../../lib/mongo-rest-route"

const ajv = new Ajv()
const validator = ajv.compile(postedMessageSchema)

const validateMessage = (data:object) => {
  const valid = validator(data)
  if (!valid) {
    throw new ValidationError(ajv.errors)
  }
  return data as PostedMessage
}

export const postMessage = async (req:Request, res:Response) => {
  if (!req.body) await new Promise((resolve) => json()(req, res, resolve))
  if (!req.db) await new Promise((resolve) => withDb(req, res, resolve))

  try {
    const clientAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const data = validateMessage(req.body) as Message

    data.clientAddress = clientAddress?.toString() || 'unknown'
    data.date = new Date().toISOString()
    const c = req.db.collection('messages')
    let isSaved = false, isSent = false
    try {
      await c.insertOne(data) // no real way to handle insert error 🤞 the send works
      isSaved = true
    } catch (e) {
      console.error('Error storing message.', e)
    }

    const sendTo = process.env.CONTACT_EMAIL
    if (sendTo) {
      const sendFrom = 'no-reply@ertb.org'
      const subject = `ertb.org Contact Form - Message from ${data.name}`

      const message = "Name: " + data.name + "\n"
      + "Phone: " + data.phone + "\n"
      + "Email: " + data.email + "\n\n\n"
      + data.message + "\n\n\n"
      + "clientAddress: " + clientAddress

      sendEmail(sendFrom, sendTo, subject, message)
    }
    if (!isSaved && !isSent) {
      res.status(500).send({error: 'Message was not recorded.'})
      return
    }
    res.status(202).send({message: 'Message recorded.'})

  } catch (e) {
    handleValidateError(e, res)
  }
}

