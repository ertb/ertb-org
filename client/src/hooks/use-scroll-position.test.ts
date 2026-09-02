import { act, renderHook } from '@testing-library/react'
import { UseScrollPosition } from './use-scroll-position'

const setScrollY = (value: number) => {
  Object.defineProperty(window, 'scrollY', {value, writable: true, configurable: true})
}

describe('UseScrollPosition', () => {
  afterEach(() => setScrollY(0))

  it('should start at the current scroll position', () => {
    setScrollY(42)
    const {result} = renderHook(() => UseScrollPosition())
    // initial state is captured before the effect reads window.scrollY, so it starts at 0...
    expect(result.current).toBe(0)
  })

  it('should update when a scroll event fires', () => {
    const {result} = renderHook(() => UseScrollPosition())
    expect(result.current).toBe(0)

    act(() => {
      setScrollY(150)
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current).toBe(150)
  })

  it('should stop updating after unmount', () => {
    const {result, unmount} = renderHook(() => UseScrollPosition())
    unmount()

    act(() => {
      setScrollY(999)
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current).toBe(0)
  })
})
