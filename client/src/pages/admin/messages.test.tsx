import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'
import { useGet } from '@/lib/rest-client/use-get'
import { Messages } from './messages'

const mockAuthDelete = vi.fn()
vi.mock('@/contexts/auth-rest-client-context', () => ({
  useAuthRestClient: () => ({
    authGet: vi.fn(),
    authPost: vi.fn(),
    authPut: vi.fn(),
    authPatch: vi.fn(),
    authDelete: mockAuthDelete,
    useAuthGet: useGet, // delegate to the real hook so msw-mocked fetches still work
  }),
}))

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => {
  server.resetHandlers()
  mockAuthDelete.mockReset()
})
afterAll(() => server.close())

const aMessage = (overrides: Partial<{_id: string, name: string, email: string, phone: string, message: string, date: string}> = {}) => ({
  _id: '1', name: 'Jane Doe', email: 'jane@example.com', phone: '555-1234', message: 'Hello there', date: '2024-03-01T00:00:00.000Z', ...overrides,
})

describe('Messages', () => {
  it('should render the fetched messages', async () => {
    server.use(http.get('/api/v1/messages', () => HttpResponse.json({count: 1, messages: [aMessage()]})))
    render(<Messages/>)

    expect(await screen.findByText('Hello there')).toBeInTheDocument()
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument()
  })

  it('should show an empty-state message when there are no messages', async () => {
    server.use(http.get('/api/v1/messages', () => HttpResponse.json({count: 0, messages: []})))
    render(<Messages/>)

    expect(await screen.findByText('No messages have been sent.')).toBeInTheDocument()
  })

  it('should delete a message when the delete button is confirmed, and remove it from the list', async () => {
    server.use(http.get('/api/v1/messages', () => HttpResponse.json({count: 1, messages: [aMessage()]})))
    mockAuthDelete.mockResolvedValue({deletedCount: 1})
    const user = userEvent.setup()
    render(<Messages/>)
    await screen.findByText('Hello there')

    await user.click(screen.getAllByRole('button')[0]) // the X icon reveals the confirm button
    await user.click(screen.getByRole('button', {name: 'Delete'}))

    expect(mockAuthDelete).toHaveBeenCalledWith('/api/v1/messages/1')
    expect(screen.queryByText('Hello there')).not.toBeInTheDocument()
  })
})
