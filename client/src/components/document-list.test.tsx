import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { DocumentList } from './document-list'

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const aFile = (name: string) => ({_id: name, url: `https://example.com/uploads/${name}`, tag: 'reports'})

describe('DocumentList', () => {
  it('should render the fetched documents for the given tag', async () => {
    server.use(http.get('/api/v1/files', ({request}) => {
      const url = new URL(request.url)
      expect(url.searchParams.get('tag')).toBe('reports')
      return HttpResponse.json({count: 1, files: [aFile('report.pdf')]})
    }))
    render(<DocumentList tag="reports"/>)

    expect(await screen.findByText('report.pdf')).toBeInTheDocument()
  })

  it('should link to the downloads page for the remainder when not showing all', async () => {
    server.use(http.get('/api/v1/files', () => HttpResponse.json({
      count: 5, files: [aFile('a.pdf'), aFile('b.pdf')],
    })))
    render(<DocumentList tag="reports" limit={2}/>)

    await screen.findByText('a.pdf')
    const link = screen.getByRole('link', {name: 'Downloads'})
    expect(link).toHaveAttribute('href', '/downloads#reports')
    expect(screen.getByText(/3 more in/)).toBeInTheDocument()
  })

  it('should expand to show every document when `all` is set and "show more" is clicked', async () => {
    const user = userEvent.setup()
    server.use(http.get('/api/v1/files', ({request}) => {
      const url = new URL(request.url)
      const limit = url.searchParams.get('limit')
      if (limit === '0') return HttpResponse.json({count: 3, files: [aFile('a.pdf'), aFile('b.pdf'), aFile('c.pdf')]})
      return HttpResponse.json({count: 3, files: [aFile('a.pdf'), aFile('b.pdf')]})
    }))
    render(<DocumentList tag="reports" limit={2} all/>)

    const showMore = await screen.findByRole('button', {name: 'Show 1 more'})
    await user.click(showMore)

    expect(await screen.findByText('c.pdf')).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /show/i})).not.toBeInTheDocument()
  })

  it('should not show a "more" affordance when everything already fits within the limit', async () => {
    server.use(http.get('/api/v1/files', () => HttpResponse.json({count: 1, files: [aFile('a.pdf')]})))
    render(<DocumentList tag="reports" limit={12}/>)

    await screen.findByText('a.pdf')
    expect(screen.queryByRole('link', {name: 'Downloads'})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /show/i})).not.toBeInTheDocument()
  })
})
