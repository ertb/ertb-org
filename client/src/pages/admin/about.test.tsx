import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'
import { About } from './about'

interface StubEditorProps {
  initialMarkdown: string
  onChange: (markdown: string) => void
  onSave: () => void
  dirty: boolean
  saving: boolean
}
vi.mock('./about-editor', () => ({
  AboutEditor: ({initialMarkdown, onChange, onSave, dirty, saving}: StubEditorProps) => (
    <div>
      <div>{initialMarkdown}</div>
      <button onClick={() => onChange('## Edited heading')}>Simulate edit</button>
      <button onClick={onSave} disabled={saving || !dirty}>Save</button>
    </div>
  ),
}))

const mockAuthPut = vi.fn()
vi.mock('@/contexts/auth-rest-client-context', () => ({
  useAuthRestClient: () => ({
    authGet: vi.fn(),
    authPost: vi.fn(),
    authPut: mockAuthPut,
    authPatch: vi.fn(),
    authDelete: vi.fn(),
    useAuthGet: vi.fn(),
  }),
}))

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => {
  server.resetHandlers()
  mockAuthPut.mockReset()
})
afterAll(() => server.close())

describe('About', () => {
  it('should pass the saved markdown to the editor', async () => {
    server.use(http.get('/api/v1/about', () => HttpResponse.json({markdown: '## Custom Heading'})))
    render(<About/>)

    expect(await screen.findByText('## Custom Heading')).toBeInTheDocument()
  })

  it('should fall back to the bundled markdown when no About content has been saved', async () => {
    server.use(http.get('/api/v1/about', () => HttpResponse.json({error: 'not found'}, {status: 404})))
    render(<About/>)

    expect(await screen.findByText(/## About/)).toBeInTheDocument()
  })

  it('should disable Save until a change is made', async () => {
    server.use(http.get('/api/v1/about', () => HttpResponse.json({markdown: '## Heading'})))
    render(<About/>)
    await screen.findByText('## Heading')

    expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled()
  })

  it('should save the edited markdown', async () => {
    server.use(http.get('/api/v1/about', () => HttpResponse.json({markdown: '## Heading'})))
    mockAuthPut.mockResolvedValue({markdown: ''})
    const user = userEvent.setup()
    render(<About/>)
    await screen.findByText('## Heading')

    await user.click(screen.getByRole('button', {name: 'Simulate edit'}))
    const saveButton = screen.getByRole('button', {name: 'Save'})
    expect(saveButton).toBeEnabled()
    await user.click(saveButton)

    expect(mockAuthPut).toHaveBeenCalledWith('/api/v1/about', {markdown: '## Edited heading'})
  })
})
