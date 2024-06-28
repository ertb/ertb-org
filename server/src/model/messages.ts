import { JSONSchemaType } from 'ajv'

export interface Message {
  date: string // date-time
  clientAddress: string // ip-address
  name: string
  email: string // email-address
  phone: string
  message: string
}
export const messageSchema:JSONSchemaType<Message> = {
  type: 'object',
  properties: {
    date: { type: 'string' },
    clientAddress: {oneOf: [
      {type: 'string', format: 'ipv4' },
      {type: 'string', format: 'ipv6' },
    ]},
    name: { type: 'string'} ,
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['date', 'clientAddress', 'name', 'email', 'phone', 'message'],
  additionalProperties: false,
}

export interface PostedMessage {
  name: string
  email: string // email-address
  phone: string
  message: string
}

export const postedMessageSchema:JSONSchemaType<PostedMessage> = {
  type: 'object',
  properties: {
    name: { type: 'string'} ,
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['name', 'email', 'phone', 'message' ],
  additionalProperties: false,
}