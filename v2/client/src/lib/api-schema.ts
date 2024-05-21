
export interface File {
  _id: string
  url: string
  added: string // timestamp
  tag: string
}
export interface FilesResponse {
  count: number
  files: File[]
}