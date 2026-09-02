import { JSONSchemaType } from 'ajv'

export interface About {
  markdown: string
}

export const aboutSchema:JSONSchemaType<About> = {
  type: 'object',
  properties: {
    markdown: { type: 'string' },
  },
  required: [ 'markdown' ],
  additionalProperties: false,
}
