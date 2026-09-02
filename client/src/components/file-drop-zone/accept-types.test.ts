import { acceptMessage } from './accept-types'

describe('acceptMessage', () => {
  it('should return undefined when no accept type is given', () => {
    expect(acceptMessage(undefined)).toBeUndefined()
  })

  it('should describe a named accept type, singular by default', () => {
    expect(acceptMessage('image')).toBe('PNG, JPEG, GIF, or SVG file')
  })

  it('should pluralize "file" when maxFiles is greater than 1', () => {
    expect(acceptMessage('image', 3)).toBe('PNG, JPEG, GIF, or SVG files')
  })

  it('should describe every named accept type', () => {
    expect(acceptMessage('doc')).toBe('PDF, Microsoft Office doc, or OpenOffice doc file')
    expect(acceptMessage('video')).toBe('MP4 or MPEG file')
    expect(acceptMessage('audio')).toBe('MP3 or WAV file')
  })

  it('should list extensions from an explicit Accept map', () => {
    expect(acceptMessage({'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg']}))
      .toBe('.png, .jpg or .jpeg file')
  })

  it('should not use "or" when there is a single extension', () => {
    expect(acceptMessage({'application/pdf': ['.pdf']})).toBe('.pdf file')
  })

  it('should return undefined for an accept map with no extensions', () => {
    expect(acceptMessage({})).toBeUndefined()
  })
})
