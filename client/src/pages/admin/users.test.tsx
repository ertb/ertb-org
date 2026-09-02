import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'
import { useGet } from '@/lib/rest-client/use-get'
import { Users } from './users'

const mockAuthDelete = vi.fn()
const mockAuthPatch = vi.fn()
vi.mock('@/contexts/auth-rest-client-context', () => ({
  useAuthRestClient: () => ({
    authGet: vi.fn(),
    authPost: vi.fn(),
    authPut: vi.fn(),
    authPatch: mockAuthPatch,
    authDelete: mockAuthDelete,
    useAuthGet: useGet, // delegate to the real hook so msw-mocked fetches still work
  }),
}))

const mockUseUserProfile = vi.fn()
vi.mock('@/contexts/user-login-context', () => ({
  useUserProfile: () => mockUseUserProfile(),
}))

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => {
  server.resetHandlers()
  mockAuthDelete.mockReset()
  mockAuthPatch.mockReset()
})
afterAll(() => server.close())

const aUser = (overrides: Partial<{_id: string, role: string, userinfo: {id: string, email: string, name: string}, lastLogin: string}> = {}) => ({
  _id: '1', role: 'user', userinfo: {id: 'google-1', email: 'jane@example.com', name: 'Jane Doe'}, lastLogin: '2024-03-01T00:00:00.000Z', ...overrides,
})

describe('Users', () => {
  it('should render the fetched users', async () => {
    mockUseUserProfile.mockReturnValue({profile: {userinfo: {id: 'someone-else'}}})
    server.use(http.get('/api/v1/users', () => HttpResponse.json({count: 1, users: [aUser()]})))
    render(<Users/>)

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('should show the current user as read-only, with no delete button, for their own row', async () => {
    mockUseUserProfile.mockReturnValue({profile: {userinfo: {id: 'google-1'}}})
    server.use(http.get('/api/v1/users', () => HttpResponse.json({count: 1, users: [aUser()]})))
    render(<Users/>)

    await screen.findByText('Jane Doe')
    // the pencil-off button is disabled and there's no confirm-delete button for self
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should delete a non-self user when confirmed, and remove it from the list', async () => {
    mockUseUserProfile.mockReturnValue({profile: {userinfo: {id: 'someone-else'}}})
    server.use(http.get('/api/v1/users', () => HttpResponse.json({count: 1, users: [aUser()]})))
    mockAuthDelete.mockResolvedValue({deletedCount: 1})
    const user = userEvent.setup()
    render(<Users/>)
    await screen.findByText('Jane Doe')

    await user.click(screen.getAllByRole('button')[0]) // the X icon reveals the confirm button
    await user.click(screen.getByRole('button', {name: 'Delete'}))

    expect(mockAuthDelete).toHaveBeenCalledWith('/api/v1/users/1')
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })
})
