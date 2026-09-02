import { JSONSchemaType } from 'ajv'
import { getValidate } from './get-validate'
import { ValidationError } from './validation-error'

interface Widget {
  _id: string
  name: string
}

const schema: JSONSchemaType<Widget> = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    name: {type: 'string'},
  },
  required: ['_id', 'name'],
  additionalProperties: false,
}

describe('getValidate', () => {
  describe('validate', () => {
    it('should accept a payload matching the schema', () => {
      const {validate} = getValidate(schema)
      expect(validate({_id: '1', name: 'Widget'})).toEqual({_id: '1', name: 'Widget'})
    })

    it('should throw a ValidationError for a payload missing required fields', () => {
      const {validate} = getValidate(schema)
      expect(() => validate({_id: '1'})).toThrow(ValidationError)
    })

    it('should not require _id (or managed date fields) when validating an update', () => {
      const {validate} = getValidate(schema)
      // simulates what mongo-rest-route does before calling validate: _id/date fields are stripped
      const payload: {[key: string]: any} = {name: 'Widget'}
      expect(validate(payload, {isUpdate: true})).toEqual({name: 'Widget'})
    })

    it('should strip _id and managed date fields before validating an update', () => {
      const {validate} = getValidate(schema)
      const payload = {_id: 'should-be-removed', name: 'Widget', added: '2024-01-01T00:00:00.000Z'}
      const result = validate(payload, {isUpdate: true}) as {[key: string]: any}
      expect(result._id).toBeUndefined()
      expect(result.added).toBeUndefined()
      expect(result.name).toBe('Widget')
    })

    it('should still enforce other required fields on update', () => {
      const {validate} = getValidate(schema)
      expect(() => validate({}, {isUpdate: true})).toThrow(ValidationError)
    })
  })

  describe('validateBulk', () => {
    it('should validate every item in an array', () => {
      const {validateBulk} = getValidate(schema)
      const payload = [{_id: '1', name: 'A'}, {_id: '2', name: 'B'}]
      expect(validateBulk(payload)).toEqual(payload)
    })

    it('should throw if any item in the array is invalid', () => {
      const {validateBulk} = getValidate(schema)
      expect(() => validateBulk([{_id: '1', name: 'A'}, {_id: '2'}])).toThrow(ValidationError)
    })

    it('should validate a single object', () => {
      const {validateBulk} = getValidate(schema)
      const payload = {_id: '1', name: 'A'}
      expect(validateBulk(payload)).toEqual(payload)
    })
  })
})
