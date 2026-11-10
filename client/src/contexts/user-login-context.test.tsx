import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'
import { UserLoginProvider, useUserProfile } from './user-login-context'

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({children}: {children: React.ReactNode}) => children,
  useGoogleLogin: () => vi.fn(),
  googleLogout: vi.fn(),
}))

const mockUseClientConfig = vi.fn()
vi.mock('./client-config-context', () => ({
  useClientConfig: () => mockUseClientConfig(),
}))

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => {
  server.resetHandlers()
  sessionStorage.clear()
})
afterAll(() => server.close())

const Consumer = () => {
  const {profile, loading} = useUserProfile()
  return <div data-testid="state">{JSON.stringify({loading, email: profile?.userinfo.email})}</div>
}

const userInfo = {
  id: '1', email: 'person@example.com', verified_email: true,
  name: 'Person', given_name: 'Person', family_name: '', picture: '', locale: 'en',
}

describe('UserLoginProvider', () => {
  it('should render a loading skeleton until the client config provides a clientId', () => {
    mockUseClientConfig.mockReturnValue({clientId: '', version: '', commit: ''})
    const {container} = render(<UserLoginProvider><Consumer/></UserLoginProvider>)
    expect(screen.queryByTestId('state')).not.toBeInTheDocument()
    expect(container.firstChild).not.toBeNull()
  })

  it('should render children once a clientId is available, with no profile when there are no stored credentials', () => {
    mockUseClientConfig.mockReturnValue({clientId: 'client-1', version: '', commit: ''})
    render(<UserLoginProvider><Consumer/></UserLoginProvider>)
    expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify({loading: false}))
  })

  it('should fetch and provide the profile when valid credentials are already in session storage', async () => {
    mockUseClientConfig.mockReturnValue({clientId: 'client-1', version: '', commit: ''})
    sessionStorage.setItem('creds', JSON.stringify({access_token: 'tok-123', expires: Date.now() + 60_000}))
    server.use(http.get('/api/v1/userprofile', ({request}) => {
      expect(request.headers.get('authorization')).toBe('Bearer tok-123')
      return HttpResponse.json({role: 'user', userinfo: userInfo, authorization: 'Bearer new-token', expires: (Date.now() + 60_000) / 1000})
    }))

    render(<UserLoginProvider><Consumer/></UserLoginProvider>)

    expect(await screen.findByText(/person@example.com/)).toBeInTheDocument()
  })

  it('should discard expired credentials without fetching a profile', () => {
    mockUseClientConfig.mockReturnValue({clientId: 'client-1', version: '', commit: ''})
    sessionStorage.setItem('creds', JSON.stringify({access_token: 'tok-123', expires: Date.now() - 1000}))
    // onUnhandledRequest: 'error' means an unexpected fetch to /api/v1/userprofile fails the test

    render(<UserLoginProvider><Consumer/></UserLoginProvider>)

    expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify({loading: false}))
    expect(sessionStorage.getItem('creds')).toBeNull()
  })

  it('should refresh the profile on request, sharing concurrent calls and throttling repeats', async () => {
    mockUseClientConfig.mockReturnValue({clientId: 'client-1', version: '', commit: ''})
    sessionStorage.setItem('creds', JSON.stringify({access_token: 'tok-123', expires: Date.now() + 60_000}))
    let requests = 0
    server.use(http.get('/api/v1/userprofile', () => {
      requests++
      return HttpResponse.json({role: 'user', userinfo: userInfo, authorization: `Bearer token-${requests}`, expires: (Date.now() + 60_000) / 1000})
    }))
    let refreshProfile: ReturnType<typeof useUserProfile>['refreshProfile'] = async () => undefined
    const Capture = () => {
      refreshProfile = useUserProfile().refreshProfile
      return <Consumer/>
    }

    render(<UserLoginProvider><Capture/></UserLoginProvider>)
    expect(await screen.findByText(/person@example.com/)).toBeInTheDocument()
    // the provider may load the profile more than once on mount; let that settle first
    await new Promise((resolve) => setTimeout(resolve, 50))
    const initial = requests

    const [a, b] = await Promise.all([refreshProfile(), refreshProfile()])
    expect(requests).toBe(initial + 1)
    expect(a?.authorization).toBe(`Bearer token-${initial + 1}`)
    expect(b).toBe(a)

    // within the throttle window: no request, returns the current profile
    const c = await refreshProfile()
    expect(requests).toBe(initial + 1)
    expect(c?.authorization).toBe(a?.authorization)
  })

  it('should not refresh without credentials', async () => {
    mockUseClientConfig.mockReturnValue({clientId: 'client-1', version: '', commit: ''})
    let refreshProfile: ReturnType<typeof useUserProfile>['refreshProfile'] = async () => ({} as never)
    const Capture = () => {
      refreshProfile = useUserProfile().refreshProfile
      return null
    }
    render(<UserLoginProvider><Capture/></UserLoginProvider>)
    await expect(refreshProfile()).resolves.toBeUndefined()
  })
})
