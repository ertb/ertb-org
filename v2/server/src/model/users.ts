import { JSONSchemaType } from "ajv"

export interface User {
  role: 'admin'|'user'
  userInfo: {
    email: string
  }
}
export const userSchema:JSONSchemaType<User> = {
  type: "object",
  properties: {
    role: {type: "string", enum: ['admin','user']},
    userInfo: {
      type: "object",
      properties: {
        "email" : { type: "string" }
      },
      required: ["email"],
      additionalProperties: true,
    },
  },
  required: ["role", "userInfo"],
  additionalProperties: false,
}