"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidate = void 0;
const ajv_with_formats_1 = __importDefault(require("./ajv-with-formats"));
const validation_error_1 = require("./validation-error");
const requiredIdSchema = { type: "string" };
const optionalDateSchema = { type: "string", format: "date-time", nullable: true };
const withId = (schema) => {
    const newSchema = { ...schema };
    newSchema.properties = { ...newSchema.properties, '_id': requiredIdSchema };
    newSchema.required = [...newSchema.required.filter((x) => x != '_id')];
    return newSchema;
};
const withManagedDates = (schema, dateFields = {}) => {
    const newSchema = { ...schema };
    newSchema.properties = { ...newSchema.properties };
    newSchema.properties[dateFields.added || 'added'] = optionalDateSchema;
    newSchema.properties[dateFields.lastModified || 'lastModified'] = optionalDateSchema;
    newSchema.properties[dateFields.deleted || 'deleted'] = optionalDateSchema;
    return newSchema;
};
const getValidate = (schema, options = {}) => {
    const ajv = new ajv_with_formats_1.default();
    const { dateFields: dateFieldOverrides } = options;
    const dateFields = { added: 'added', lastModified: 'lastModified', deleted: 'deleted', ...dateFieldOverrides };
    const idSchema = withId(schema);
    const dateSchema = withManagedDates(withId(schema), dateFields);
    const validate = (payload, options) => {
        const { isUpdate = false } = options || {};
        if (isUpdate) {
            delete payload._id;
            delete payload[dateFields.added];
            delete payload[dateFields.lastModified];
            delete payload[dateFields.deleted];
        }
        const valid = ajv.validate(schema, payload);
        if (!valid) {
            if (isUpdate)
                console.log('dateSchema:', JSON.stringify(dateSchema, null, 2));
            else
                console.log('idSchema:', JSON.stringify(idSchema, null, 2));
            console.log('payload', JSON.stringify(payload, null, 2));
            throw new validation_error_1.ValidationError(ajv.errors);
        }
        return payload;
    };
    const validateBulk = (payload) => {
        if (Array.isArray(payload)) {
            payload.forEach(x => !validate(x));
            return payload;
        }
        validate(payload);
        return [payload];
    };
    return { validate, validateBulk };
};
exports.getValidate = getValidate;
//# sourceMappingURL=get-validate.js.map