"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidateError = exports.ValidationError = void 0;
class ValidationError extends Error {
    errors;
    constructor(errors, instancePath = '/') {
        super('Schema validation error');
        if (typeof errors == 'string') {
            errors = [{
                    keyword: "errorMessage",
                    message: errors,
                    instancePath,
                    schemaPath: '',
                    params: {},
                }];
        }
        this.errors = errors;
        this.name = "SchemaValidationError";
    }
}
exports.ValidationError = ValidationError;
const handleValidateError = (e, res) => {
    if (e instanceof SyntaxError) {
        return res.status(400).send({ error: 'Invalid JSON payload', jsonParseError: e.message });
    }
    if (e instanceof ValidationError) {
        return res.status(400).send({ error: 'Invalid payload', validationErrors: e.errors });
    }
    throw (e);
};
exports.handleValidateError = handleValidateError;
//# sourceMappingURL=validation-error.js.map