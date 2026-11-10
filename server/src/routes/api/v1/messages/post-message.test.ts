import express from 'express'
import request from 'supertest'
import { sendEmail } from '../../../../lib/email'
import { postMessage } from './post-message'

jest.mock('../../../../lib/email', () => ({sendEmail: jest.fn()}))
const mockSendEmail = sendEmail as jest.Mock

describe('postMessage', () => {
  const insertOne = jest.fn()
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.db = {collection: () => ({insertOne})} as unknown as express.Request['db']
    next()
  })
  app.post('/messages', postMessage)

  const originalEnv = process.env
  const message = {name: 'Pat', email: 'pat@example.com', phone: '5555555555', message: 'Hello'}

  beforeEach(() => {
    process.env = {...originalEnv, CONTACT_EMAIL: 'contact@example.com'}
    insertOne.mockReset().mockResolvedValue({})
    mockSendEmail.mockReset().mockResolvedValue({})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())
  afterAll(() => { process.env = originalEnv })

  it('should store and email the message', async () => {
    const res = await request(app).post('/messages').send(message)
    expect(res.status).toBe(202)
    expect(insertOne).toHaveBeenCalledWith(expect.objectContaining({name: 'Pat'}))
    expect(mockSendEmail).toHaveBeenCalledWith('no-reply@ertb.org', 'contact@example.com', expect.stringContaining('Pat'), expect.stringContaining('Hello'))
  })

  it('should still succeed, without an unhandled rejection, when the email fails', async () => {
    mockSendEmail.mockRejectedValue(new Error('SMTP down'))
    const res = await request(app).post('/messages').send(message)
    expect(res.status).toBe(202)
    expect(console.error).toHaveBeenCalledWith('Error sending message email.', expect.any(Error))
  })

  it('should succeed when the email is sent even if storing fails', async () => {
    insertOne.mockRejectedValue(new Error('db down'))
    const res = await request(app).post('/messages').send(message)
    expect(res.status).toBe(202)
  })

  it('should fail when the message is neither stored nor sent', async () => {
    insertOne.mockRejectedValue(new Error('db down'))
    mockSendEmail.mockRejectedValue(new Error('SMTP down'))
    const res = await request(app).post('/messages').send(message)
    expect(res.status).toBe(500)
  })

  it('should reject an invalid message', async () => {
    const res = await request(app).post('/messages').send({name: 'Pat'})
    expect(res.status).toBe(400)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})
