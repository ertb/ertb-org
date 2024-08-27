import { JSONSchemaType } from 'ajv'

export interface File {
  url: string
  tag?: string
}

export const fileSchema:JSONSchemaType<File> = {
  type: 'object',
  properties: {
    url: { type: "string", /*format: "uri"*/ },
    tag: { type: 'string', nullable: true },
  },
  required: [ 'url' ],
  additionalProperties: false,
}