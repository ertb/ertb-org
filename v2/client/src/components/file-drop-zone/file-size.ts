const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const k = 1024
const bytesToIndex = (bytes:number) => Math.floor(Math.log(bytes) / Math.log(k))
const indexToBytes = (i:number) => Math.pow(k,i)

export const formatFileSize = (value:number|string|undefined, decimalPoint=2) => {
  const bytes = parseFileSize(value)
  if (bytes === undefined) return undefined

  if (bytes == 0) return '0 Bytes'

  const i = bytesToIndex(bytes)
  const n = parseFloat((bytes / Math.pow(k, i)).toFixed(decimalPoint))
  return `${n} ${sizes[i]}`
}

export const parseFileSize = (value:string|number|undefined) => {
  if (typeof(value) == 'number' || value === undefined) return value
  if (value.length > 100 || !value.length) return undefined

  const match = /^(-?(?:\d+)?\.?\d+) *(Bytes|KB|MB|GB|TB|PB|EB|ZB|YB)?$/i.exec(value)
  if (!match) return undefined

  const n = parseFloat(match[1])
  const type = (match[2] || 'bytes').toLowerCase()
  const i = sizes.findIndex((x)=>x.toLowerCase() == type)
  if (i == -1) return undefined

  return n * indexToBytes(i)
}