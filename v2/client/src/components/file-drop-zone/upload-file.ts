export const uploadFile = async <T>(file:File, authorization:string='none') => {
  const res = await fetch(`/api/v1/files/${file.name}`, {
    method: 'POST',
    body: file,
    headers: {
      'Authorization': authorization,
      'Content-Type': file.type,
      'Content-Disposition': `attachment; filename="${file.name}"`,
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to upload file. ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}