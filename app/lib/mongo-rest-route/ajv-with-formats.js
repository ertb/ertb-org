"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
class Ajv extends ajv_1.default {
    constructor(opts) {
        super(opts);
        (0, ajv_formats_1.default)(this);
    }
}
exports.Ajv = Ajv;
exports.default = Ajv;
var ajv_2 = require("ajv");
Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function () { return ajv_2.KeywordCxt; } });
Object.defineProperty(exports, "_", { enumerable: true, get: function () { return ajv_2._; } });
Object.defineProperty(exports, "str", { enumerable: true, get: function () { return ajv_2.str; } });
Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return ajv_2.stringify; } });
Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return ajv_2.nil; } });
Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return ajv_2.Name; } });
Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function () { return ajv_2.CodeGen; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return __importDefault(ajv_2).default; } });
Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function () { return __importDefault(ajv_2).default; } });
//# sourceMappingURL=ajv-with-formats.js.map