import { Request, Response } from 'express'
import { clientConfig } from './client-config'

describe('clientConfig', () => {
  const mockRes = () => {
    const res = {send: jest.fn().mockReturnThis()}
    return res as unknown as Response & {send: jest.Mock}
  }

  const originalEnv = process.env

  beforeEach(() => {
    process.env = {...originalEnv}
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should include the client id, commit, and package version from the environment', () => {
    process.env.GOOGLE_API_CLIENT_ID = 'client-123'
    process.env.SOURCE_VERSION = 'abc123'
    const res = mockRes()

    clientConfig({} as Request, res)

    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'client-123',
      commit: 'abc123',
    }))
    const sent = res.send.mock.calls[0][0]
    expect(typeof sent.version).toBe('string')
  })

  it('should default clientId and commit to empty strings when unset', () => {
    delete process.env.GOOGLE_API_CLIENT_ID
    delete process.env.SOURCE_VERSION
    const res = mockRes()

    clientConfig({} as Request, res)

    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      clientId: '',
      commit: '',
    }))
  })
})
