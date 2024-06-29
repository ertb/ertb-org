"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileSchema = void 0;
exports.fileSchema = {
    type: 'object',
    properties: {
        url: { type: "string", format: "uri" },
        tag: { type: 'string', nullable: true },
    },
    required: ['url'],
    additionalProperties: false,
};
//# sourceMappingURL=files.js.map