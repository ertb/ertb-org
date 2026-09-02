import { ObjectId } from 'mongodb'
import { Request } from 'express'
import { applyPatchRequest } from './apply-patch-request'
import { ValidationError } from './validation-error'

const fakeRequest = (body: any, query: any = {}): Request =>
  ({body, query}) as unknown as Request

describe('applyPatchRequest', () => {
  describe('JSON Patch (request body)', () => {
    it('should apply a replace operation', () => {
      const id = new ObjectId()
      const orig = {_id: id, name: 'Old', count: 1}
      const req = fakeRequest([{op: 'replace', path: '/name', value: 'New'}])
      const result = applyPatchRequest(orig, req)
      expect(result).toMatchObject({name: 'New', count: 1})
    })

    it('should apply an add operation', () => {
      const id = new ObjectId()
      const orig = {_id: id, name: 'Old'}
      const req = fakeRequest([{op: 'add', path: '/email', value: 'a@b.com'}])
      const result = applyPatchRequest(orig, req)
      expect(result).toMatchObject({name: 'Old', email: 'a@b.com'})
    })

    it('should apply a remove operation', () => {
      const id = new ObjectId()
      const orig = {_id: id, name: 'Old', extra: 'gone'}
      const req = fakeRequest([{op: 'remove', path: '/extra'}])
      const result = applyPatchRequest(orig, req)
      expect(result).not.toHaveProperty('extra')
    })

    it('should reject a patch that changes the _id', () => {
      const id = new ObjectId()
      const orig = {_id: id, name: 'Old'}
      const req = fakeRequest([{op: 'replace', path: '/_id', value: new ObjectId().toHexString()}])
      expect(() => applyPatchRequest(orig, req)).toThrow(ValidationError)
    })

    it('should reject a malformed patch document', () => {
      const id = new ObjectId()
      const orig = {_id: id, name: 'Old'}
      const req = fakeRequest([{op: 'not-a-real-op', path: '/name', value: 'New'}])
      expect(() => applyPatchRequest(orig, req)).toThrow(ValidationError)
    })
  })

  describe('query-param patch (empty body)', () => {
    it('should set a string field from a query param', () => {
      const id = new ObjectId()
      const orig = {_id: id, name: 'Old'}
      const req = fakeRequest({}, {name: 'New'})
      const result = applyPatchRequest(orig, req)
      expect(result.name).toBe('New')
    })

    it('should parse a numeric query param as a number', () => {
      const id = new ObjectId()
      const orig = {_id: id, count: 1}
      const req = fakeRequest({}, {count: '42'})
      const result = applyPatchRequest(orig, req)
      expect(result.count).toBe(42)
    })

    it('should parse the "true"/"false" literals as booleans', () => {
      const id = new ObjectId()
      const orig = {_id: id, active: false}
      const req = fakeRequest({}, {active: 'true'})
      const result = applyPatchRequest(orig, req)
      expect(result.active).toBe(true)
    })

    it('should leave unrelated fields untouched', () => {
      const id = new ObjectId()
      const orig = {_id: id, name: 'Old', untouched: 'kept'}
      const req = fakeRequest({}, {name: 'New'})
      const result = applyPatchRequest(orig, req)
      expect(result.untouched).toBe('kept')
    })
  })
})
