import { ErrorObject } from "ajv"
import { Response } from "express"

export class ValidationError extends Error {
  errors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined

  constructor(errors?:ErrorObject<string, Record<string, any>, unknown>[] | null)
  constructor(error:string, instancePath?:string)
  constructor(errors:string|ErrorObject<string, Record<string, any>, unknown>[] | null | undefined, instancePath='/') {
    super('Schema validation error')
    if (typeof errors == 'string')  {
      errors = [{
        keyword: "errorMessage",
        message: errors,
        instancePath,
        schemaPath: '',
        params: {},
      }]
    }
    this.errors = errors
    this.name = "SchemaValidationError"
  }
}

/** Handles sending a 400 Bad Request response when catching a validation error. */
export const handleValidateError = (e:Error, res:Response) => {
  if (e instanceof SyntaxError) {
    // probably a JSON.parse error
    return res.status(400).send({error: 'Invalid JSON payload', jsonParseError: e.message})
  }
  if (e instanceof ValidationError) {
    // at least one schema validation error encountered
    return res.status(400).send({error: 'Invalid payload', validationErrors: e.errors})
  }
  throw (e)
}

  