import { formatFileSize, parseFileSize } from './file-size'

describe('parseFileSize', () => {
  it('should pass numbers through unchanged', () => {
    expect(parseFileSize(500)).toBe(500)
  })

  it('should pass undefined through unchanged', () => {
    expect(parseFileSize(undefined)).toBeUndefined()
  })

  it('should parse a plain byte count', () => {
    expect(parseFileSize('1024')).toBe(1024)
  })

  it('should parse a value with a unit suffix', () => {
    expect(parseFileSize('10 MB')).toBe(10 * 1024 * 1024)
  })

  it('should parse a value with no space before the unit', () => {
    expect(parseFileSize('5KB')).toBe(5 * 1024)
  })

  it('should be case-insensitive for units', () => {
    expect(parseFileSize('1gb')).toBe(1024 * 1024 * 1024)
  })

  it('should return undefined for an unparseable string', () => {
    expect(parseFileSize('not a size')).toBeUndefined()
  })

  it('should return undefined for an empty string', () => {
    expect(parseFileSize('')).toBeUndefined()
  })

  it('should return undefined for an unreasonably long string', () => {
    expect(parseFileSize('1'.repeat(101))).toBeUndefined()
  })
})

describe('formatFileSize', () => {
  it('should format zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
  })

  it('should format an exact unit boundary', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
  })

  it('should round to the given number of decimal points', () => {
    expect(formatFileSize(1500)).toBe('1.46 KB')
  })

  it('should accept a parseable string input', () => {
    expect(formatFileSize('1024')).toBe('1 KB')
  })

  it('should return undefined when the value cannot be parsed', () => {
    expect(formatFileSize('not a size')).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(formatFileSize(undefined)).toBeUndefined()
  })
})
