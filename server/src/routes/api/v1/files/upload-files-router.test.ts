import express from 'express'
import http from 'http'
import { AddressInfo } from 'net'
import request from 'supertest'
import { uploadFilesRouter } from './upload-files-router'

// S3 upload that consumes the Body stream, as the real one does
const uploaded: {key: string, body: Buffer}[] = []
const uploadSettled = jest.fn()
jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(({params}) => ({
    done: async () => {
      try {
        const chunks: Buffer[] = []
        for await (const chunk of params.Body) chunks.push(chunk)
        uploaded.push({key: params.Key, body: Buffer.concat(chunks)})
        uploadSettled('resolved')
      } catch (e) {
        uploadSettled('rejected')
        throw e
      }
    },
  })),
}))

const files = {
  findOne: jest.fn(async () => null),
  insertOne: jest.fn(async () => ({insertedId: 'new-id'})),
}
jest.mock('../../../../lib/mongo-rest-route/with-db', () => ({
  withDb: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.db = {collection: () => files} as unknown as express.Request['db']
    next()
  },
}))
jest.mock('./with-s3', () => ({
  withS3: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.s3 = {config: {forcePathStyle: false}} as unknown as express.Request['s3']
    req.bucket = 'bucket'
    next()
  },
}))
jest.mock('../../check-user', () => ({
  checkUser: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}))

describe('upload files router', () => {
  const app = express()
  app.use('/files', uploadFilesRouter)
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {...originalEnv, MAX_UPLOAD_SIZE: '1KB'}
    uploaded.length = 0
    uploadSettled.mockReset()
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())
  afterAll(() => { process.env = originalEnv })

  it('should store the file and record it', async () => {
    const res = await request(app).post('/files/report.pdf').set('Content-Type', 'application/pdf').send(Buffer.from('hello'))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({_id: 'new-id', url: 'https://bucket.s3.amazonaws.com/report.pdf'})
    expect(uploaded).toEqual([{key: 'report.pdf', body: Buffer.from('hello')}])
  })

  it('should reject a file whose Content-Length is over the limit without uploading', async () => {
    const res = await request(app).post('/files/big.pdf').set('Content-Type', 'application/pdf').send(Buffer.alloc(2048))
    expect(res.status).toBe(413)
    expect(res.body.error).toMatch(/^big\.pdf is .+, which is larger than the .+ upload limit\.$/)
    expect(uploaded).toEqual([])
  })

  it('should reject a file that is over the limit even without a Content-Length', async () => {
    const res = await new Promise<{status: number, body: string}>((resolve, reject) => {
      const server = app.listen(0, () => {
        const {port} = server.address() as AddressInfo
        const req = http.request({port, path: '/files/big.pdf', method: 'POST', headers: {'Transfer-Encoding': 'chunked'}}, (res) => {
          let body = ''
          res.on('data', (c) => body += c)
          res.on('end', () => { server.close(); resolve({status: res.statusCode || 0, body}) })
        })
        req.on('error', (e) => { server.close(); reject(e) })
        req.end(Buffer.alloc(2048))
      })
    })
    expect(res.status).toBe(413)
    expect(JSON.parse(res.body).error).toMatch(/^big\.pdf is larger than the .+ upload limit\.$/)
    expect(uploaded).toEqual([])
  })

  it('should stop the S3 upload when the client disconnects partway through', async () => {
    const server = app.listen(0)
    try {
      const {port} = server.address() as AddressInfo
      const req = http.request({port, path: '/files/partial.pdf', method: 'POST', headers: {'Content-Length': '800'}})
      req.on('error', () => {}) // expected: we destroy the socket
      req.write(Buffer.alloc(100))
      await new Promise((resolve) => setTimeout(resolve, 50))
      req.destroy()

      await waitFor(() => expect(uploadSettled).toHaveBeenCalledWith('rejected'))
      await waitFor(() => expect(console.log).toHaveBeenCalledWith('Upload of partial.pdf was cancelled'))
      expect(uploaded).toEqual([])
    } finally {
      server.close()
    }
  })
})

const waitFor = async (assertion: () => void, timeout = 2000) => {
  const start = Date.now()
  for (;;) {
    try {
      assertion()
      return
    } catch (e) {
      if (Date.now() - start > timeout) throw e
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
}
