import { describe, expect, it } from 'vitest'
import { contentDisposition } from './upload-file'

describe('contentDisposition', () => {
  it('produces a Latin-1-safe header for non-ASCII filenames', () => {
    const name = 'Screenshot 2026-11-09 at 3.04.12 PM “final”.png'
    const header = contentDisposition(name)
    expect(header).toMatch(/^[\x20-\x7e]*$/)
    expect(() => new Headers({'Content-Disposition': header})).not.toThrow()
    const encoded = header.split("filename*=UTF-8''")[1]
    expect(decodeURIComponent(encoded)).toBe(name)
  })

  it('keeps plain filenames readable', () => {
    expect(contentDisposition('report.pdf')).toBe(`attachment; filename="report.pdf"; filename*=UTF-8''report.pdf`)
  })
})
