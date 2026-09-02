import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ClientConfigProvider, useClientConfig } from './client-config-context'

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const ConfigConsumer = () => {
  const config = useClientConfig()
  return <div data-testid="config">{JSON.stringify(config)}</div>
}

describe('ClientConfigProvider', () => {
  it('should provide the unset default config before the fetch resolves', () => {
    server.use(http.get('/api/v1/config', () => new Promise(() => {}))) // never resolves
    render(<ClientConfigProvider><ConfigConsumer/></ClientConfigProvider>)

    expect(screen.getByTestId('config')).toHaveTextContent(JSON.stringify({version: '', commit: '', clientId: ''}))
  })

  it('should provide the fetched config once it resolves', async () => {
    server.use(http.get('/api/v1/config', () => HttpResponse.json({version: '1.2.3', commit: 'abc123', clientId: 'client-1'})))
    render(<ClientConfigProvider><ConfigConsumer/></ClientConfigProvider>)

    expect(await screen.findByText(/client-1/)).toBeInTheDocument()
    expect(screen.getByTestId('config')).toHaveTextContent(JSON.stringify({version: '1.2.3', commit: 'abc123', clientId: 'client-1'}))
  })
})
