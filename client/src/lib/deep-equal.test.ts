import { deepEqual } from './deep-equal'

describe('deepEqual', () => {
  it('should treat equal primitives as equal', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual('a', 'a')).toBe(true)
  })

  it('should treat different primitives as not equal', () => {
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual('a', 'b')).toBe(false)
  })

  it('should compare nested objects by value', () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true)
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } })).toBe(false)
  })

  it('should compare arrays by value', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false)
  })
})
