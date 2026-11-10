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
  return `The server could not save the file (${status}).`
}

export const uploadFile = async <T>(file:File, authorization:string='none') => {
  const res = await fetch(`/api/v1/files/${encodeURIComponent(file.name)}`, {
    method: 'POST',
    body: file,
    headers: {
      'Authorization': authorization,
      'Content-Type': file.type,
      'Content-Disposition': contentDisposition(file.name),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => undefined) as {error?:string}|undefined
    throw new Error(body?.error || uploadErrorMessage(res.status))
  }
  return (await res.json()) as T
}
