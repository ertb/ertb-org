export const uploadFile = (file:File, token:string) => {
  return fetch(`/api/v1/files/${file.name}`, { 
    method: 'POST', 
    body: file, 
    headers: {
      'Authentication': `bearer ${token}`,
      'Content-Type': file.type,
      'Content-Disposition': `attachment; filename="${file.name}"`,
    },
  })
}