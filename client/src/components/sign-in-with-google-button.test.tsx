import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SignInWithGoogleButton } from './sign-in-with-google-button'

const mockUseUserProfile = vi.fn()
vi.mock('@/contexts/user-login-context', () => ({
  useUserProfile: () => mockUseUserProfile(),
}))

describe('SignInWithGoogleButton', () => {
  it('should call login when clicked', async () => {
    const login = vi.fn()
    mockUseUserProfile.mockReturnValue({login})
    const user = userEvent.setup()
    render(<SignInWithGoogleButton/>)

    await user.click(screen.getByRole('button', {name: /sign in with google/i}))

    expect(login).toHaveBeenCalledTimes(1)
  })
})
