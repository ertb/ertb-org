import { describe, expect, it } from 'vitest'
import { ErrorCode, FileRejection } from 'react-dropzone'
import { rejectionMessage } from './rejection-message'

const MB = 1024 * 1024
const rejection = (size:number, code:string, name='report.pdf'):FileRejection => ({
  file: Object.defineProperty(new File([''], name), 'size', {value: size}),
  errors: [{code, message: 'dropzone message'}],
})

describe('rejectionMessage', () => {
  it('explains a file that is too large, including the limit', () => {
    expect(rejectionMessage(rejection(31.2 * MB, ErrorCode.FileTooLarge), 25 * MB))
      .toBe('report.pdf is 31.2 MB, which is too large to upload. The limit is 25 MB.')
  })

  it('explains an unsupported type', () => {
    expect(rejectionMessage(rejection(10, ErrorCode.FileInvalidType, 'x.exe'))).toBe('x.exe is not a supported file type.')
  })

  it('falls back to the dropzone message', () => {
    expect(rejectionMessage(rejection(10, 'other'))).toBe('report.pdf: dropzone message')
  })
})
