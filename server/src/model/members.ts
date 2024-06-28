import { JSONSchemaType } from 'ajv'

export interface Member {
  name: string
  title: string
  details: string
  tag?: string
  order?: number
}

export const memberSchema:JSONSchemaType<Member> = {
  type: 'object',
  properties: {
    name: {type: 'string'},
    title: {type: 'string'},
    details: {type: 'string'},
    tag: {type: 'string', nullable: true},
    order: {type: 'number', nullable: true},
  },
  required: ['name', 'title', 'details'],
  additionalProperties: false,
}