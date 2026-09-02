import { secs } from './secs'

describe('secs', () => {
  it('should parse whole units', () => {
    expect(secs('1 day')).toBe(86400)
    expect(secs('4hrs')).toBe(14400)
    expect(secs('15m')).toBe(900)
  })

  it('should parse fractional values', () => {
    expect(secs('1.5 hours')).toBe(5400)
  })

  it('should support explicit sign and "ago"/"from now" suffixes', () => {
    expect(secs('-1 day')).toBe(-86400)
    expect(secs('1 day ago')).toBe(-86400)
    expect(secs('1 day from now')).toBe(86400)
  })

  it('should reject an explicit sign combined with a suffix', () => {
    expect(() => secs('-1 day ago')).toThrow(TypeError)
  })

  it('should reject an unrecognized format', () => {
    expect(() => secs('banana')).toThrow(TypeError)
  })
})
