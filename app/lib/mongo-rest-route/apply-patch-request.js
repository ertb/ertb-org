"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPatchRequest = void 0;
const validation_error_1 = require("./validation-error");
const json_patch_schema_json_1 = __importDefault(require("./json-patch-schema.json"));
const ajv_with_formats_1 = __importDefault(require("./ajv-with-formats"));
const mongodb_1 = require("mongodb");
const fast_json_patch_1 = require("fast-json-patch");
const ajv = new ajv_with_formats_1.default();
const validatePatchSchema = ajv.compile(json_patch_schema_json_1.default);
const getPatchTarget = (o, keys) => {
    if (o === undefined)
        return undefined;
    if (!Array.isArray(keys)) {
        keys = keys.split('/').filter(x => !!x).map(x => x.replace('~0', '/').replace('~1', '~'));
    }
    if (keys.length > 1) {
        if (Array.isArray(o)) {
            const index = parseInt(keys[0]);
            return getPatchTarget(o[index], keys.slice(1));
        }
        return getPatchTarget(o[keys[0]], keys.slice(1));
    }
    if (['number', 'bigint', 'string', 'boolean'].includes(typeof o))
        return undefined;
    return o;
};
const applyPatchRequest = (origObject, req) => {
    let newObject = { _id: new mongodb_1.ObjectId() };
    const isBodyEmpty = !Object.keys(req.body).length;
    if (isBodyEmpty) {
        newObject = { ...origObject };
        Object.keys(req.query).filter(x => !!x).forEach((key) => {
            const target = getPatchTarget(newObject, key);
            const value = req.query[key]?.toString();
            if (target === undefined || value === undefined)
                return;
            const literals = [
                ['undefined', undefined],
                ['null', null],
                ['true', true],
                ['false', false],
            ];
            const l = literals.find(([x]) => value == x);
            if (l != undefined) {
                target[key] = l[1];
                return;
            }
            if (value[0] == '"' && value[0] == value[value.length - 1]) {
                target[key] = value.slice(1, value.length - 2);
                return;
            }
            const n = parseFloat(value);
            if (n < Infinity && n > -Infinity) {
                target[key] = n;
                return;
            }
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                target[key] = d;
            }
            target[key] = value;
        });
    }
    else {
        const patch = JSON.parse(req.body);
        if (!validatePatchSchema(req.body)) {
            throw new validation_error_1.ValidationError(ajv.errors);
        }
        newObject = (0, fast_json_patch_1.applyPatch)(origObject, patch).newDocument;
    }
    if (origObject._id.toHexString() != newObject._id.toHexString()) {
        throw new validation_error_1.ValidationError('The _id field is read only.', '/_id');
    }
    return newObject;
};
exports.applyPatchRequest = applyPatchRequest;
//# sourceMappingURL=apply-patch-request.js.map