import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { DEFAULT_MAX_UPLOAD_SIZE, FileTooLargeError, formatMB, getMaxUploadSize, sizeLimit } from './max-upload-size'

describe('getMaxUploadSize', () => {
  const originalEnv = process.env
  beforeEach(() => { process.env = {...originalEnv} })
  afterAll(() => { process.env = originalEnv })

  it('should default to 25 MB', () => {
    delete process.env.MAX_UPLOAD_SIZE
    expect(getMaxUploadSize()).toBe(25 * 1024 * 1024)
  })

  it.each([
    ['1000', 1000],
    ['50MB', 50 * 1024 * 1024],
    ['1.5 gb', 1.5 * 1024 * 1024 * 1024],
    ['512KB', 512 * 1024],
  ])('should parse %s', (value, expected) => {
    process.env.MAX_UPLOAD_SIZE = value
    expect(getMaxUploadSize()).toBe(expected)
  })

  it('should fall back to the default for invalid values', () => {
    process.env.MAX_UPLOAD_SIZE = 'lots'
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    expect(getMaxUploadSize()).toBe(DEFAULT_MAX_UPLOAD_SIZE)
  })
})

describe('formatMB', () => {
  it('should format bytes as MB', () => {
    expect(formatMB(25 * 1024 * 1024)).toBe('25 MB')
    expect(formatMB(6.1 * 1024 * 1024)).toBe('6.1 MB')
  })
})

describe('sizeLimit', () => {
  const drain = async (chunks:Buffer[], max:number) => {
    const out:Buffer[] = []
    await pipeline(Readable.from(chunks), sizeLimit(max), async function* (source) {
      for await (const chunk of source) out.push(chunk)
    })
    return Buffer.concat(out)
  }

  it('should pass through data within the limit', async () => {
    const result = await drain([Buffer.alloc(5), Buffer.alloc(5)], 10)
    expect(result.length).toBe(10)
  })

  it('should fail once the limit is exceeded', async () => {
    await expect(drain([Buffer.alloc(5), Buffer.alloc(6)], 10)).rejects.toBeInstanceOf(FileTooLargeError)
  })
})
