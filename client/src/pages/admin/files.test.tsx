import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'
import { Files } from './files'

const mockAuthPatch = vi.fn()
const mockAuthDelete = vi.fn()
vi.mock('@/contexts/auth-rest-client-context', () => ({
  useAuthRestClient: () => ({
    authGet: vi.fn(),
    authPost: vi.fn(),
    authPut: vi.fn(),
    authPatch: mockAuthPatch,
    authDelete: mockAuthDelete,
    useAuthGet: vi.fn(),
  }),
}))
vi.mock('@/contexts/user-login-context', () => ({
  useUserProfile: () => ({profile: {authorization: 'Bearer test-token'}}),
}))

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => {
  server.resetHandlers()
  mockAuthPatch.mockReset()
  mockAuthDelete.mockReset()
})
afterAll(() => server.close())

const aFile = (overrides: Partial<{_id: string, url: string, tag: string}> = {}) => ({
  _id: '1', url: 'https://example.com/uploads/report.pdf', tag: 'reports', ...overrides,
})

describe('Files', () => {
  it('should render the fetched files', async () => {
    server.use(http.get('/api/v1/files', () => HttpResponse.json({count: 1, files: [aFile()]})))
    render(<Files/>)

    expect(await screen.findByDisplayValue('report.pdf')).toBeInTheDocument()
  })

  it('should upload a dropped file and add it to the list', async () => {
    server.use(
      http.get('/api/v1/files', () => HttpResponse.json({count: 0, files: []})),
      http.post('/api/v1/files/new.pdf', async ({request}) => {
        expect(request.headers.get('authorization')).toBe('Bearer test-token')
        return HttpResponse.json(aFile({_id: '2', url: 'https://example.com/uploads/new.pdf'}))
      }),
    )
    const user = userEvent.setup()
    const {container} = render(<Files/>)
    await screen.findByText('Files') // wait for initial fetch to settle

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'new.pdf', {type: 'application/pdf'})
    await user.upload(input, file)

    expect(await screen.findByDisplayValue('new.pdf')).toBeInTheDocument()
  })

  it('should debounce a filename edit into a single rename PATCH request', async () => {
    server.use(http.get('/api/v1/files', () => HttpResponse.json({count: 1, files: [aFile()]})))
    mockAuthPatch.mockResolvedValue({modifiedCount: 1, url: 'https://example.com/uploads/renamed.pdf'})
    render(<Files/>)
    const input = await screen.findByDisplayValue('report.pdf')

    vi.useFakeTimers()
    try {
      fireEvent.change(input, {target: {value: 'renamed.pdf'}})
      expect(mockAuthPatch).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(750)
    } finally {
      vi.useRealTimers()
    }

    expect(mockAuthPatch).toHaveBeenCalledTimes(1)
    expect(mockAuthPatch.mock.calls[0][0]).toBe('/api/v1/files/report.pdf?rename=renamed.pdf')
  })

  it('should delete a file when the delete button is confirmed, and remove it from the list', async () => {
    server.use(http.get('/api/v1/files', () => HttpResponse.json({count: 1, files: [aFile()]})))
    mockAuthDelete.mockResolvedValue({deletedCount: 1})
    const user = userEvent.setup()
    render(<Files/>)
    await screen.findByDisplayValue('report.pdf')

    await user.click(screen.getAllByRole('button')[0]) // the X icon reveals the confirm button
    await user.click(screen.getByRole('button', {name: 'Delete'}))

    expect(mockAuthDelete).toHaveBeenCalledWith('/api/v1/files/report.pdf')
    expect(screen.queryByDisplayValue('report.pdf')).not.toBeInTheDocument()
  })
})
