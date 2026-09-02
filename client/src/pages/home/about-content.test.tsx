import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AboutContent } from './about-content'

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AboutContent', () => {
  it('should render markdown returned from the API', async () => {
    server.use(http.get('/api/v1/about', () => HttpResponse.json({markdown: '## Custom Heading\n\nSome custom text.'})))
    render(<AboutContent/>)

    expect(await screen.findByRole('heading', {level: 2, name: 'Custom Heading'})).toBeInTheDocument()
    expect(screen.getByText('Some custom text.')).toBeInTheDocument()
  })

  it('should fall back to the bundled markdown when no About content has been saved', async () => {
    server.use(http.get('/api/v1/about', () => HttpResponse.json({error: 'not found'}, {status: 404})))
    render(<AboutContent/>)

    expect(await screen.findByRole('heading', {level: 2, name: 'About'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 3, name: 'Our Background'})).toBeInTheDocument()
  })

  it('should render links using ConfirmDocumentLink instead of a plain anchor', async () => {
    server.use(http.get('/api/v1/about', () => HttpResponse.json({
      markdown: '[Test Doc](https://ertb-org.s3.amazonaws.com/test.pdf)',
    })))
    render(<AboutContent/>)

    const link = await screen.findByRole('button', {name: /Test Doc/})
    expect(link).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('should strip elements outside the supported grammar, keeping their text', async () => {
    server.use(http.get('/api/v1/about', () => HttpResponse.json({markdown: '# Top Level Heading\n\nkept paragraph'})))
    render(<AboutContent/>)

    await screen.findByText('kept paragraph')
    expect(screen.queryByRole('heading', {level: 1})).not.toBeInTheDocument()
    expect(screen.getByText('Top Level Heading')).toBeInTheDocument()
  })
})
