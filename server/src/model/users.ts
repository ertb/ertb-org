import { JSONSchemaType } from "ajv"

export interface User {
  role: "admin"|"user"
  userinfo: {
    email: string
    name: string
  },
  lastLogin?: Date
  isAdminEmail?: boolean
}
export const userSchema:JSONSchemaType<User> = {
  type: "object",
  properties: {
    role: {type: "string", enum: ["admin","user"]},
    userinfo: {
      type: "object",
      properties: {
        "email" : { type: "string" },
        "name" : { type: "string" },
      },
      required: ["email", "name"],
      additionalProperties: true,
    },
    lastLogin: {type: "object", format: "date-time", required: [], nullable:true},
    isAdminEmail: {type: "boolean", nullable: true},
  },
  required: ["role", "userinfo"],
  additionalProperties: false,
}