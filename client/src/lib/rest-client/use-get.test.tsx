import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import { http, HttpResponse, delay } from 'msw'
import { setupServer } from 'msw/node'
import { useGet } from './use-get'

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

type Widget = {name: string}
type State = ReturnType<typeof useGet<Widget>>

const Probe = ({onRender}: {onRender: (state: State) => void}) => {
  const state = useGet<Widget>('/api/widgets/1')
  onRender(state)
  return null
}

describe('useGet', () => {
  it('should not surface an error from a request the effect cleanup aborted (React StrictMode double-invoke)', async () => {
    server.use(http.get('/api/widgets/1', async () => {
      await delay(20)
      return HttpResponse.json({name: 'Sprocket'})
    }))

    let last: State | undefined
    render(
      <StrictMode>
        <Probe onRender={(state) => { last = state }} />
      </StrictMode>
    )

    // wait for the (superseded first + real second) fetches to settle
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(last?.data).toEqual({name: 'Sprocket'})
    expect(last?.error).toBeUndefined()
  })
})
