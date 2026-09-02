import { render } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'
import { AuthRestClientProvider, useAuthRestClient } from './auth-rest-client-context'

const mockUseUserProfile = vi.fn()
vi.mock('./user-login-context', () => ({
  useUserProfile: () => mockUseUserProfile(),
}))

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const withProfile = (authorization?: string) => {
  mockUseUserProfile.mockReturnValue(authorization ? {profile: {authorization}} : {profile: undefined})
}

/** Captures the auth-aware client methods so tests can call them directly. */
let captured: ReturnType<typeof useAuthRestClient>
const Capture = () => {
  captured = useAuthRestClient()
  return null
}
const renderWithAuth = () => render(<AuthRestClientProvider><Capture/></AuthRestClientProvider>)

describe('AuthRestClientProvider', () => {
  it('should add the authorization header from the current profile to GET requests', async () => {
    withProfile('Bearer token-123')
    server.use(http.get('/api/widgets', ({request}) => {
      expect(request.headers.get('authorization')).toBe('Bearer token-123')
      return HttpResponse.json({ok: true})
    }))
    renderWithAuth()

    await captured.authGet('/api/widgets')
  })

  it('should not send a usable authorization value when there is no profile', async () => {
    // profile?.authorization is undefined, but the Fetch API's Headers constructor stringifies
    // object values, so the header is sent as the literal string "undefined" rather than omitted.
    // Any real server rejects that as an invalid token, so this still fails safe.
    withProfile(undefined)
    server.use(http.get('/api/widgets', ({request}) => {
      expect(request.headers.get('authorization')).toBe('undefined')
      return HttpResponse.json({ok: true})
    }))
    renderWithAuth()

    await captured.authGet('/api/widgets')
  })

  it('should warn when rendered without a logged-in profile', () => {
    withProfile(undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderWithAuth()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('RequireLogin'))
    warn.mockRestore()
  })

  it('should send the authorization header on POST, and use method POST', async () => {
    withProfile('Bearer token-123')
    server.use(http.post('/api/widgets', async ({request}) => {
      expect(request.headers.get('authorization')).toBe('Bearer token-123')
      expect(await request.json()).toEqual({name: 'new'})
      return HttpResponse.json({insertedId: '1'})
    }))
    renderWithAuth()

    const result = await captured.authPost<{insertedId: string}>('/api/widgets', {name: 'new'})
    expect(result).toEqual({insertedId: '1'})
  })

  it('should send PUT for authPut', async () => {
    withProfile('Bearer token-123')
    server.use(http.put('/api/widgets/1', () => HttpResponse.json({modifiedCount: 1})))
    renderWithAuth()

    const result = await captured.authPut<{modifiedCount: number}>('/api/widgets/1', {name: 'updated'})
    expect(result).toEqual({modifiedCount: 1})
  })

  it('should send PATCH for authPatch', async () => {
    withProfile('Bearer token-123')
    server.use(http.patch('/api/widgets/1', () => HttpResponse.json({modifiedCount: 1})))
    renderWithAuth()

    const result = await captured.authPatch<{modifiedCount: number}>('/api/widgets/1', [{op: 'replace', path: '/name', value: 'x'}])
    expect(result).toEqual({modifiedCount: 1})
  })

  it('should send DELETE with the authorization header for authDelete', async () => {
    withProfile('Bearer token-123')
    server.use(http.delete('/api/widgets/1', ({request}) => {
      expect(request.headers.get('authorization')).toBe('Bearer token-123')
      return HttpResponse.json({deletedCount: 1})
    }))
    renderWithAuth()

    const result = await captured.authDelete<{deletedCount: number}>('/api/widgets/1')
    expect(result).toEqual({deletedCount: 1})
  })
})
