import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { RestClientResponseError, restClient } from './rest-client'

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('restClient.get', () => {
  it('should return the parsed JSON body', async () => {
    server.use(http.get('/api/widgets/1', () => HttpResponse.json({name: 'Sprocket'})))
    const result = await restClient.get<{name: string}>('/api/widgets/1')
    expect(result).toEqual({name: 'Sprocket'})
  })

  it('should request JSON via the accept header', async () => {
    server.use(http.get('/api/widgets/1', ({request}) => {
      expect(request.headers.get('accept')).toBe('application/json')
      return HttpResponse.json({})
    }))
    await restClient.get('/api/widgets/1')
  })

  it('should throw a RestClientResponseError for a non-ok response', async () => {
    server.use(http.get('/api/widgets/1', () => new HttpResponse(null, {status: 404, statusText: 'Not Found'})))
    await expect(restClient.get('/api/widgets/1')).rejects.toThrow(RestClientResponseError)
  })
})

describe('RestClientResponseError', () => {
  const errorFor = (status: number) => new RestClientResponseError(new Response(null, {status}))

  it('should classify 401 and 403 as auth errors', () => {
    expect(errorFor(401).isAuthError()).toBe(true)
    expect(errorFor(403).isAuthError()).toBe(true)
    expect(errorFor(404).isAuthError()).toBe(false)
  })

  it('should classify other 4xx as client errors', () => {
    expect(errorFor(400).isClientError()).toBe(true)
    expect(errorFor(404).isClientError()).toBe(true)
    expect(errorFor(500).isClientError()).toBe(false)
  })

  it('should classify 5xx as server errors', () => {
    expect(errorFor(500).isServerError()).toBe(true)
    expect(errorFor(503).isServerError()).toBe(true)
    expect(errorFor(404).isServerError()).toBe(false)
  })
})

describe('restClient.post', () => {
  it('should send a JSON body with method POST and return the response', async () => {
    server.use(http.post('/api/widgets', async ({request}) => {
      expect(request.headers.get('content-type')).toBe('application/json')
      expect(await request.json()).toEqual({name: 'New'})
      return HttpResponse.json({insertedId: '1'})
    }))
    const result = await restClient.post<{insertedId: string}>('/api/widgets', {name: 'New'})
    expect(result).toEqual({insertedId: '1'})
  })
})

describe('restClient.put', () => {
  it('should send the payload with method PUT', async () => {
    server.use(http.put('/api/widgets/1', async ({request}) => {
      expect(await request.json()).toEqual({name: 'Updated'})
      return HttpResponse.json({modifiedCount: 1})
    }))
    const result = await restClient.put<{modifiedCount: number}>('/api/widgets/1', {name: 'Updated'})
    expect(result).toEqual({modifiedCount: 1})
  })
})

describe('restClient.patch', () => {
  it('should send a JSON Patch document with method PATCH', async () => {
    server.use(http.patch('/api/widgets/1', async ({request}) => {
      expect(await request.json()).toEqual([{op: 'replace', path: '/name', value: 'Patched'}])
      return HttpResponse.json({modifiedCount: 1})
    }))
    const result = await restClient.patch<{modifiedCount: number}>('/api/widgets/1', [{op: 'replace', path: '/name', value: 'Patched'}])
    expect(result).toEqual({modifiedCount: 1})
  })
})

describe('restClient.delete', () => {
  it('should send no body when no payload is given', async () => {
    server.use(http.delete('/api/widgets/1', async ({request}) => {
      expect(request.headers.get('content-type')).toBeNull()
      expect(await request.text()).toBe('')
      return HttpResponse.json({deletedCount: 1})
    }))
    const result = await restClient.delete<{deletedCount: number}>('/api/widgets/1')
    expect(result).toEqual({deletedCount: 1})
  })

  it('should send a JSON body with method DELETE when a payload is given', async () => {
    server.use(http.delete('/api/widgets/1', async ({request}) => {
      expect(await request.json()).toEqual({reason: 'cleanup'})
      return HttpResponse.json({deletedCount: 1})
    }))
    const result = await restClient.delete<{deletedCount: number}>('/api/widgets/1', {reason: 'cleanup'})
    expect(result).toEqual({deletedCount: 1})
  })
})
