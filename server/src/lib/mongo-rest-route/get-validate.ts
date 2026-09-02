import Ajv, { JSONSchemaType } from "ajv"
import addFormats from 'ajv-formats'
import { ValidationError } from "./validation-error"

const requiredIdSchema = { type: "string" }
const optionalDateSchema = { type: "string", format: "date-time", nullable: true }

export interface DateFields {
  added?: string
  lastModified?: string
  deleted?: string
}

/** ensure the id is not required */
const withId = <T extends object>(schema:JSONSchemaType<T>) => {
  const newSchema = {...schema} as JSONSchemaType<T>
  newSchema.properties = {...newSchema.properties, '_id': requiredIdSchema}
  newSchema.required = [...newSchema.required.filter((x:string)=>x!='_id')]
  return newSchema
}

/** allow existing object, for PUT and PATCH, to have managed date fields */
const withManagedDates = <T extends object>(schema:JSONSchemaType<T>, dateFields:DateFields={}) => {
  const newSchema = {...schema} as JSONSchemaType<T>
  newSchema.properties = {...newSchema.properties}
  newSchema.properties[dateFields.added || 'added'] = optionalDateSchema
  newSchema.properties[dateFields.lastModified || 'lastModified'] = optionalDateSchema
  newSchema.properties[dateFields.deleted || 'deleted'] = optionalDateSchema
  return newSchema
}

interface Options {
  dateFields?: DateFields
  noManagedDates?: boolean
}
export const getValidate = <T extends object>(schema:JSONSchemaType<T>, options:Options={}) => {
  const ajv = addFormats(new Ajv())
  const { dateFields:dateFieldOverrides } = options
  const dateFields = { added:'added', lastModified:'lastModified', deleted:'deleted', ...dateFieldOverrides}
  const idSchema = withId(schema)
  const dateSchema = withManagedDates(withId(schema), dateFields)

  /** Validate a payload against the schema provided to MongoRestRouter. Decodes the JSON payload if it is a string. */
  const validate = (payload:{[key:string]:any}, options?:{isUpdate:boolean}):T => {
    const { isUpdate=false } = options || {}
    if (isUpdate) {
      delete payload._id
      delete payload[dateFields.added]
      delete payload[dateFields.lastModified]
      delete payload[dateFields.deleted]
    }
    const valid = ajv.validate(isUpdate ? dateSchema : schema, payload)
    if (!valid) {
      if (isUpdate)
        console.log('dateSchema:', JSON.stringify(dateSchema, null, 2))
      else
        console.log('idSchema:', JSON.stringify(idSchema, null, 2))
      console.log('payload', JSON.stringify(payload,null,2))
      throw new ValidationError(ajv.errors)
    }
    return payload as T
  }

  /** Validate a single object or an array */
  const validateBulk = (payload:unknown):(T|T[]) => {
    if (Array.isArray(payload)) {
      payload.forEach(x=>!validate(x)) // throws error if any are invalid
      return payload as T[]
    }
    validate(payload as T)
    return payload as T
  }
  return {validate, validateBulk}
}