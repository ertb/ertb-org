import HTTPError, { BadRequestError, ErrorHandler, ForbiddenError, NotFoundError, Redirect, UnauthorizedError, toName } from './http-error'

describe('toName', () => {
  it('should append Error to 4xx/5xx status names', () => {
    expect(toName(404)).toBe('NotFoundError')
    expect(toName(500)).toBe('InternalServerError')
  })

  it('should not append Error to non-error status names', () => {
    expect(toName(302)).toBe('Found')
  })

  it('should handle unknown codes', () => {
    expect(toName(499)).toBe('UndefinedError')
  })
})

describe('HTTPError constructors', () => {
  it('should build errors with the expected status code and name', () => {
    expect(BadRequestError('bad')).toMatchObject({statusCode: 400, name: 'BadRequestError', message: 'bad'})
    expect(UnauthorizedError('nope')).toMatchObject({statusCode: 401, name: 'UnauthorizedError'})
    expect(ForbiddenError('nope')).toMatchObject({statusCode: 403, name: 'ForbiddenError'})
    expect(NotFoundError('missing')).toMatchObject({statusCode: 404, name: 'NotFoundError'})
  })

  it('should default the message to the status text when omitted', () => {
    expect(new HTTPError(404, '')).toMatchObject({message: 'Not Found'})
  })

  it('should assign extras onto the error', () => {
    const error = BadRequestError('bad', {field: 'email'})
    expect((error as unknown as {field:string}).field).toBe('email')
  })
})

describe('Redirect', () => {
  const headers = (error: HTTPError) => (error as unknown as {headers: {Location?: string}}).headers

  it('should build a 3xx error with a Location header', () => {
    const error = Redirect('/somewhere')
    expect(error.statusCode).toBe(302)
    expect(headers(error).Location).toBe('/somewhere')
  })

  it('should format a URL object into a location string', () => {
    const error = Redirect(new URL('https://example.com/path'))
    expect(headers(error).Location).toBe('https://example.com/path')
  })

  it('should reject non-3xx codes', () => {
    expect(() => Redirect('/somewhere', 404)).toThrow(TypeError)
  })

  it('should reject a non-string, non-object location', () => {
    expect(() => Redirect(123 as unknown as string)).toThrow(TypeError)
  })
})

describe('ErrorHandler', () => {
  const mockRes = () => {
    const res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }
    return res as unknown as import('express').Response & {status: jest.Mock, send: jest.Mock}
  }

  it('should respond with the HTTPError status code and message, and stop', () => {
    const res = mockRes()
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    ErrorHandler(NotFoundError('missing'), {} as import('express').Request, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.status).toHaveBeenCalledTimes(1)
    expect(res.send).toHaveBeenCalledWith({error: 'missing'})
    consoleError.mockRestore()
  })

  it('should respond with a generic 500 for non-HTTPErrors', () => {
    const res = mockRes()
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    ErrorHandler(new Error('boom'), {} as import('express').Request, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(500)
    consoleError.mockRestore()
  })

  it('should delegate to next() when headers were already sent', () => {
    const res = mockRes()
    res.headersSent = true
    const next = jest.fn()
    const error = new Error('boom')
    ErrorHandler(error, {} as import('express').Request, res, next)
    expect(next).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })
})
