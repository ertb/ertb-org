import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'
import { Members } from './members'

const mockAuthPatch = vi.fn()
const mockAuthDelete = vi.fn()
const mockAuthPost = vi.fn()
vi.mock('@/contexts/auth-rest-client-context', () => ({
  useAuthRestClient: () => ({
    authGet: vi.fn(),
    authPost: mockAuthPost,
    authPut: vi.fn(),
    authPatch: mockAuthPatch,
    authDelete: mockAuthDelete,
    useAuthGet: vi.fn(),
  }),
}))

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => {
  server.resetHandlers()
  mockAuthPatch.mockReset()
  mockAuthDelete.mockReset()
  mockAuthPost.mockReset()
})
afterAll(() => server.close())

const aMember = (overrides: Partial<{_id: string, name: string, title: string, details: string, tag: string}> = {}) => ({
  _id: '1', name: 'Jane Doe', title: 'President', details: 'Bio', tag: 'board', ...overrides,
})

describe('Members', () => {
  it('should render the fetched members', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({count: 1, members: [aMember()]})))
    render(<Members/>)

    expect(await screen.findByDisplayValue('Jane Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('President')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bio')).toBeInTheDocument()
  })

  it('should debounce a name edit into a single PATCH request', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({count: 1, members: [aMember()]})))
    mockAuthPatch.mockResolvedValue({modifiedCount: 1})
    render(<Members/>)
    const input = await screen.findByDisplayValue('Jane Doe')

    vi.useFakeTimers()
    try {
      fireEvent.change(input, {target: {value: 'Jane Smith'}})
      expect(mockAuthPatch).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(750)
    } finally {
      vi.useRealTimers()
    }

    expect(mockAuthPatch).toHaveBeenCalledTimes(1)
    expect(mockAuthPatch.mock.calls[0][0]).toBe('/api/v1/members/1?name=Jane%20Smith')
  })

  it('should not send a PATCH when the debounced value matches the original', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({count: 1, members: [aMember()]})))
    render(<Members/>)
    const input = await screen.findByDisplayValue('Jane Doe')

    vi.useFakeTimers()
    try {
      // change then change back before the debounce fires
      fireEvent.change(input, {target: {value: 'Jane Smith'}})
      fireEvent.change(input, {target: {value: 'Jane Doe'}})
      await vi.advanceTimersByTimeAsync(750)
    } finally {
      vi.useRealTimers()
    }

    expect(mockAuthPatch).not.toHaveBeenCalled()
  })

  it('should delete a member when the delete button is confirmed, and remove it from the list', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({count: 1, members: [aMember()]})))
    mockAuthDelete.mockResolvedValue({deletedCount: 1})
    const user = userEvent.setup()
    render(<Members/>)
    await screen.findByDisplayValue('Jane Doe')

    await user.click(screen.getAllByRole('button')[0]) // the X icon reveals the confirm button
    await user.click(screen.getByRole('button', {name: 'Delete'}))

    expect(mockAuthDelete).toHaveBeenCalledWith('/api/v1/members/1')
    expect(screen.queryByDisplayValue('Jane Doe')).not.toBeInTheDocument()
  })

  it('should add a new member from the add-member form', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({count: 0, members: []})))
    mockAuthPost.mockResolvedValue({insertedId: 'new-1'})
    const user = userEvent.setup()
    render(<Members/>)
    await screen.findByText('Members')

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'New Member')
    await user.type(inputs[1], 'Treasurer')

    const addButton = screen.getAllByRole('button').find(b => b.querySelector('svg'))
    await user.click(addButton!)

    expect(mockAuthPost).toHaveBeenCalledWith('/api/v1/members', expect.objectContaining({name: 'New Member', title: 'Treasurer'}))
    expect(await screen.findByDisplayValue('New Member')).toBeInTheDocument()
  })
})
