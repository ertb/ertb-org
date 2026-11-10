import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { UploadCancelledError, contentDisposition, uploadFile } from './upload-file'

describe('contentDisposition', () => {
  it('produces a Latin-1-safe header for non-ASCII filenames', () => {
    const name = 'Screenshot 2026-11-09 at 3.04.12 PM “final”.png'
    const header = contentDisposition(name)
    expect(header).toMatch(/^[\x20-\x7e]*$/)
    expect(() => new Headers({'Content-Disposition': header})).not.toThrow()
    const encoded = header.split("filename*=UTF-8''")[1]
    expect(decodeURIComponent(encoded)).toBe(name)
  })

  it('keeps plain filenames readable', () => {
    expect(contentDisposition('report.pdf')).toBe(`attachment; filename="report.pdf"; filename*=UTF-8''report.pdf`)
  })
})

describe('uploadFile', () => {
  const server = setupServer()
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  const file = () => new File(['hello world'], 'report 1.pdf', {type: 'application/pdf'})

  it('posts the file with auth and filename headers and resolves with the JSON response', async () => {
    server.use(http.post('/api/v1/files/:name', async ({request, params}) => {
      expect(params.name).toBe('report 1.pdf')
      expect(request.headers.get('authorization')).toBe('Bearer t')
      expect(request.headers.get('content-type')).toBe('application/pdf')
      expect(request.headers.get('content-disposition')).toContain("filename*=UTF-8''report%201.pdf")
      expect(await request.text()).toBe('hello world')
      return HttpResponse.json({_id: '1'})
    }))
    await expect(uploadFile(file(), 'Bearer t')).resolves.toEqual({_id: '1'})
  })

  it('rejects with the server error message and status', async () => {
    server.use(http.post('/api/v1/files/:name', () =>
      HttpResponse.json({error: 'report 1.pdf is larger than the 25 MB upload limit.'}, {status: 413})))
    await expect(uploadFile(file())).rejects.toMatchObject({
      message: 'report 1.pdf is larger than the 25 MB upload limit.',
      status: 413,
    })
  })

  it('falls back to a message for the status when the server sends none', async () => {
    server.use(http.post('/api/v1/files/:name', () => new HttpResponse('<html>', {status: 401})))
    await expect(uploadFile(file())).rejects.toMatchObject({status: 401, message: expect.stringMatching(/sign-in/)})
  })

  it('rejects with UploadCancelledError when already cancelled', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(uploadFile(file(), 'x', {signal: controller.signal})).rejects.toBeInstanceOf(UploadCancelledError)
  })

  it('rejects with UploadCancelledError when cancelled mid-upload', async () => {
    server.use(http.post('/api/v1/files/:name', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return HttpResponse.json({})
    }))
    const controller = new AbortController()
    const promise = uploadFile(file(), 'x', {signal: controller.signal})
    setTimeout(() => controller.abort(), 10)
    await expect(promise).rejects.toBeInstanceOf(UploadCancelledError)
  })
})
