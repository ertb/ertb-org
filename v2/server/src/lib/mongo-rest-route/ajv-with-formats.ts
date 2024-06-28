import { default as AjvNoFormats, Options } from "ajv"
import addFormats from "ajv-formats"

export class Ajv extends AjvNoFormats {
  constructor (opts?: Options) {
    super(opts)
    addFormats(this)
  }
}
export default Ajv

// all the things that ajv exports
export {
  Format, FormatDefinition, AsyncFormatDefinition, KeywordDefinition, KeywordErrorDefinition, CodeKeywordDefinition, MacroKeywordDefinition, FuncKeywordDefinition, Vocabulary, Schema, SchemaObject, AnySchemaObject, AsyncSchema, AnySchema, ValidateFunction, AsyncValidateFunction, SchemaValidateFunction, ErrorObject, ErrorNoParams,
  Plugin, Options, CodeOptions, InstanceOptions, Logger, ErrorsTextOptions,
  SchemaCxt, SchemaObjCxt,
  KeywordCxt,
  DefinedError,
  JSONType,
  JSONSchemaType,
  _, str, stringify, nil, Name, Code, CodeGen, CodeGenOptions,
  default as ValidationError,
  default as MissingRefError
} from "ajv"