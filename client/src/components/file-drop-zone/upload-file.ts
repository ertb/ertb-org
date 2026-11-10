/**
 * Header values must be ISO-8859-1, so non-ASCII filenames (e.g. macOS screenshots, which
 * contain a U+202F narrow no-break space before AM/PM) are sent using RFC 5987 encoding with
 * an ASCII fallback.
 */
export const contentDisposition = (filename:string) => {
  const fallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`
}

const uploadErrorMessage = (status:number) => {
  if (status == 401) return 'Your sign-in has expired. Reload the page and try again.'
  if (status == 403) return 'You are not allowed to upload files.'
  if (status == 413) return 'The file is too large.'
  if (status == 0) return 'The upload was interrupted. Check your connection and try again.'
  return `The server could not save the file (${status}).`
}

export class UploadCancelledError extends Error {
  constructor() {
    super('The upload was cancelled.')
    this.name = 'UploadCancelledError'
  }
}

export interface UploadOptions {
  /** called as the file is sent; `loaded` reaches `total` before the server has finished saving */
  onProgress?: (loaded:number, total:number) => void
  signal?: AbortSignal
}

/**
 * Uploads a file. Uses XMLHttpRequest rather than fetch because fetch can't report upload progress.
 * Failures reject with an Error carrying the HTTP `status`, using the server's message when given.
 */
export const uploadFile = <T>(file:File, authorization:string='none', {onProgress, signal}:UploadOptions = {}) =>
  new Promise<T>((resolve, reject) => {
    if (signal?.aborted) return reject(new UploadCancelledError())

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/v1/files/${encodeURIComponent(file.name)}`)
    xhr.setRequestHeader('Authorization', authorization)
    if (file.type) xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('Content-Disposition', contentDisposition(file.name))

    // settle once; after a cancel, ignore anything the request reports
    let settled = false
    const settle = (fn:() => void) => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', onAbort)
      fn()
    }
    const onAbort = () => {
      settle(() => reject(new UploadCancelledError()))
      xhr.abort()
    }
    signal?.addEventListener('abort', onAbort)

    xhr.upload.onprogress = (e) => {
      if (!settled) onProgress?.(e.loaded, e.lengthComputable ? e.total : file.size)
    }
    xhr.onload = () => settle(() => {
      let body:unknown
      try { body = JSON.parse(xhr.responseText) } catch { body = undefined }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body as T)
      const message = (body as {error?:string}|undefined)?.error || uploadErrorMessage(xhr.status)
      reject(Object.assign(new Error(message), {status: xhr.status}))
    })
    xhr.onerror = () => settle(() => reject(Object.assign(new Error(uploadErrorMessage(0)), {status: 0})))
    xhr.onabort = () => settle(() => reject(new UploadCancelledError()))
    xhr.send(file)
  })
