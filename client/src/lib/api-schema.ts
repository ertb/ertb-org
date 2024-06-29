
export interface FilesEntry {
  _id: string
  url: string
  tag: string
}
export interface FilesResponse {
  count: number
  files: FilesEntry[]
}

export interface MembersEntry {
  _id: string
  name: string
  title: string
  details: string
  tag: string
}
export interface MembersResponse {
  count: number
  members: MembersEntry[]
}

export interface MessagesEntry {
  _id: string
  date: string // timestamp
  clientAddress: string // ipaddress
  name: string
  email: string // email address
  phone: string // phone
  message: string
}
export interface MessagesResponse {
  count: number
  messages: MessagesEntry[]
}

export interface UsersEntry {
  _id: string
  role: string
  userinfo: {
    id: string
    email: string
    name: string
  }
  lastLogin: string
}
export interface UsersResponse {
  count: number
  users: UsersEntry[]
}

export interface ConfigResponse {
  version: string
  commit: string
  clientId: string
}