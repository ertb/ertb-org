import { Request, Response, Router, json } from "express"
import { withDb } from "../with-db"
import { checkUser } from "../check-user"
import { sendEmail } from "@/lib/email"

const router = Router()
export const messages = router

router.use(withDb)

router.post('/', json(), async (req: Request, res: Response) => {
  console.log('req.body', req.body)
  let {name, email, phone, message} = req.body
  if (!name || !email || !phone || !message) {
    res.status(400).send({error: 'Missing required fields'})
  }

  const date = new Date()
  const clientAddress = req.socket.remoteAddress

  name = name.slice(0, 256).trim()
  email = email.slice(0, 256).trim()
  phone = phone.slice(0, 64).trim()
  message = message.slice(0, 2048).trim()

  const contactEmail = process.env.CONTACT_EMAIL
  const from = 'no-reply@ertb.org'
  if (contactEmail) {
    await sendEmail(from, contactEmail, '[ertb.org] Contact Us Form',
      `<p>From: ${name}<br/>Email: ${email}<br/>Phone: ${name}</p>\n<pre>${message}</pre>`)
  }

  const messages = req.db.collection('messages')
  await messages.insertOne({date, clientAddress, name, email, phone, message})

  res.send({message: 'Message sent'})
})

router.get('/', checkUser('admin'), async (req: Request, res: Response) => {
  const defaultLimit = 25
  const {tag, limit:limitStr=defaultLimit.toString()} = req.query

  let limit = parseInt(limitStr.toString())
  if (isNaN(limit) || limit < 0) limit = defaultLimit

  const messages = req.db.collection('messages')
  const query = tag ? {tag} : {}
  let find = messages.find(query).sort({added:-1})
  if (limit) find = find.limit(limit)

  res.send({
    count: await messages.countDocuments(query),
    messages: await find.toArray()
  })
})