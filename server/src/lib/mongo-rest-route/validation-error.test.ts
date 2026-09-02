import { ValidationError, handleValidateError } from './validation-error'

describe('ValidationError', () => {
  it('should wrap a single message string as an ajv-style error', () => {
    const error = new ValidationError('name is required', '/name')
    expect(error.errors).toEqual([{
      keyword: 'errorMessage',
      message: 'name is required',
      instancePath: '/name',
      schemaPath: '',
      params: {},
    }])
  })

  it('should default the instancePath to root', () => {
    const error = new ValidationError('bad payload')
    expect(error.errors?.[0].instancePath).toBe('/')
  })

  it('should store ajv error arrays as-is', () => {
    const ajvErrors = [{keyword: 'required', message: 'missing', instancePath: '/email', schemaPath: '', params: {}}]
    const error = new ValidationError(ajvErrors)
    expect(error.errors).toBe(ajvErrors)
  })
})

describe('handleValidateError', () => {
  const mockRes = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }
    return res as unknown as import('express').Response & {status: jest.Mock, send: jest.Mock}
  }

  it('should respond 400 for a JSON syntax error', () => {
    const res = mockRes()
    handleValidateError(new SyntaxError('Unexpected token'), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.send).toHaveBeenCalledWith({error: 'Invalid JSON payload', jsonParseError: 'Unexpected token'})
  })

  it('should respond 400 with validation errors for a ValidationError', () => {
    const res = mockRes()
    const error = new ValidationError('name is required')
    handleValidateError(error, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.send).toHaveBeenCalledWith({error: 'Invalid payload', validationErrors: error.errors})
  })

  it('should rethrow any other error', () => {
    const res = mockRes()
    expect(() => handleValidateError(new Error('boom'), res)).toThrow('boom')
  })
})
