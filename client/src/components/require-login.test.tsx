import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { RequireLogin } from './require-login'

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({children}: {children: React.ReactNode}) => children,
}))

const mockUseClientConfig = vi.fn()
vi.mock('@/contexts/client-config-context', () => ({
  useClientConfig: () => mockUseClientConfig(),
}))

const mockUseUserProfile = vi.fn()
vi.mock('@/contexts/user-login-context', () => ({
  useUserProfile: () => mockUseUserProfile(),
}))

describe('RequireLogin', () => {
  beforeEach(() => {
    mockUseClientConfig.mockReturnValue({clientId: 'client-1', version: '', commit: ''})
  })

  it('should show a loading skeleton while the client config is not yet available', () => {
    mockUseClientConfig.mockReturnValue({clientId: '', version: '', commit: ''})
    mockUseUserProfile.mockReturnValue({profile: undefined, loading: false, logout: vi.fn()})
    render(<RequireLogin><div>Protected</div></RequireLogin>)

    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('should show a sign-in button when there is no profile and nothing is loading', () => {
    mockUseUserProfile.mockReturnValue({profile: undefined, loading: false, logout: vi.fn()})
    render(<RequireLogin><div>Protected</div></RequireLogin>)

    expect(screen.getByRole('button', {name: /sign in with google/i})).toBeInTheDocument()
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('should show a loading skeleton (not the sign-in button) while a profile fetch is in flight', () => {
    mockUseUserProfile.mockReturnValue({profile: undefined, loading: true, logout: vi.fn()})
    render(<RequireLogin><div>Protected</div></RequireLogin>)

    expect(screen.queryByRole('button', {name: /sign in with google/i})).not.toBeInTheDocument()
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('should render the children when the profile has the required role', () => {
    mockUseUserProfile.mockReturnValue({profile: {role: 'admin'}, loading: false, logout: vi.fn()})
    render(<RequireLogin withRole="admin"><div>Protected</div></RequireLogin>)

    expect(screen.getByText('Protected')).toBeInTheDocument()
  })

  it('should render the children when no specific role is required, for any logged-in profile', () => {
    mockUseUserProfile.mockReturnValue({profile: {role: 'user'}, loading: false, logout: vi.fn()})
    render(<RequireLogin><div>Protected</div></RequireLogin>)

    expect(screen.getByText('Protected')).toBeInTheDocument()
  })

  it('should show an access-denied message with a logout button when the profile lacks the required role', async () => {
    const logout = vi.fn()
    mockUseUserProfile.mockReturnValue({profile: {role: 'user'}, loading: false, logout})
    const user = userEvent.setup()
    render(<RequireLogin withRole="admin"><div>Protected</div></RequireLogin>)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Logout'}))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
