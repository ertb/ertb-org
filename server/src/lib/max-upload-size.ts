import { Transform, TransformCallback } from 'stream'

const MB = 1024 * 1024
export const DEFAULT_MAX_UPLOAD_SIZE = 25 * MB

/**
 * The largest file (in bytes) that may be uploaded. Set MAX_UPLOAD_SIZE as bytes or with a
 * KB/MB/GB unit (ie., '50MB'); defaults to 25 MB.
 */
export const getMaxUploadSize = () => {
  const value = process.env.MAX_UPLOAD_SIZE?.trim()
  if (!value) return DEFAULT_MAX_UPLOAD_SIZE
  const match = /^(\d+(?:\.\d+)?) *(B|KB|MB|GB)?$/i.exec(value)
  if (!match) {
    console.warn(`Ignoring invalid MAX_UPLOAD_SIZE '${value}'`)
    return DEFAULT_MAX_UPLOAD_SIZE
  }
  const unit = (match[2] || 'B').toUpperCase()
  const multiplier = {B: 1, KB: 1024, MB: MB, GB: 1024 * MB}[unit] as number
  return Math.floor(parseFloat(match[1]) * multiplier)
}

export const formatMB = (bytes:number) => `${parseFloat((bytes / MB).toFixed(1))} MB`

export class FileTooLargeError extends Error {
  constructor(public maxSize:number) {
    super(`The file is larger than the ${formatMB(maxSize)} limit.`)
    this.name = 'FileTooLargeError'
  }
}

/** A pass-through stream that fails with FileTooLargeError once more than maxSize bytes go through */
export const sizeLimit = (maxSize:number) => {
  let total = 0
  return new Transform({
    transform(chunk:Buffer, _encoding, callback:TransformCallback) {
      total += chunk.length
      if (total > maxSize) callback(new FileTooLargeError(maxSize))
      else callback(null, chunk)
    },
  })
}
