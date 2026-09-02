import { act, renderHook } from '@testing-library/react'
import { useOnScreen } from './use-on-screen'

const setScrollY = (value: number) => {
  Object.defineProperty(window, 'scrollY', {value, writable: true, configurable: true})
}

/** Adds a <section id> to the document with mocked layout geometry (jsdom does no real layout). */
const addSection = (id: string, offsetTop: number, clientHeight = 100) => {
  const el = document.createElement('section')
  el.id = id
  Object.defineProperty(el, 'offsetTop', {value: offsetTop, configurable: true})
  Object.defineProperty(el, 'clientHeight', {value: clientHeight, configurable: true})
  document.body.appendChild(el)
  return el
}

describe('useOnScreen', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    setScrollY(0)
  })

  it('should pick the last matching section whose scroll threshold has been reached', () => {
    addSection('a', 0, 300)
    addSection('b', 300, 300)
    addSection('c', 600, 300)
    setScrollY(350)

    const {result} = renderHook(() => useOnScreen())

    // a: threshold = 0 - 100 = -100 (met); b: threshold = 300 - 100 = 200 (met); c: threshold = 600-100=500 (not met)
    // handleScroll iterates in document order and keeps overwriting `current`, so the last section whose
    // threshold is met (in document order) wins - here that's 'b'.
    expect(result.current).toBe('b')
  })

  it('should update when a scroll event fires', () => {
    addSection('a', 0, 300)
    addSection('b', 900, 300)

    const {result} = renderHook(() => useOnScreen())
    expect(result.current).toBe('a')

    act(() => {
      setScrollY(1000)
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current).toBe('b')
  })

  it('should only match elements selected by a custom selector', () => {
    addSection('default', 0, 300)
    // testing-library's renderHook injects its own wrapper <div> into document.body, so use a
    // class selector rather than a bare 'div' tag to avoid matching it too.
    const div = document.createElement('div')
    div.id = 'custom'
    div.className = 'custom-target'
    Object.defineProperty(div, 'offsetTop', {value: 0, configurable: true})
    Object.defineProperty(div, 'clientHeight', {value: 300, configurable: true})
    document.body.appendChild(div)

    const {result} = renderHook(() => useOnScreen('div.custom-target'))
    expect(result.current).toBe('custom')
  })

  it('should shift the threshold by the given offset', () => {
    // section at offsetTop=500, clientHeight=300 (height/3=100):
    //   offset=0:   threshold = 500 - 100 = 400, so scrollY=350 does not meet it
    //   offset=200: threshold = (500-200) - 100 = 200, so scrollY=350 does meet it
    addSection('a', 500, 300)
    setScrollY(350)

    const withoutOffset = renderHook(() => useOnScreen('section', 0))
    expect(withoutOffset.result.current).toBe('')
    withoutOffset.unmount()

    const withOffset = renderHook(() => useOnScreen('section', 200))
    expect(withOffset.result.current).toBe('a')
    withOffset.unmount()
  })

  it('should stop updating after unmount', () => {
    addSection('a', 0, 300)
    addSection('b', 900, 300)
    const {result, unmount} = renderHook(() => useOnScreen())
    expect(result.current).toBe('a')

    unmount()

    act(() => {
      setScrollY(1000)
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current).toBe('a')
  })
})
