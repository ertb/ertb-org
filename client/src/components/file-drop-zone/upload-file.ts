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
    throw new Error(`Failed to upload file. ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}