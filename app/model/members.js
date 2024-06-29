"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberSchema = void 0;
exports.memberSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        title: { type: 'string' },
        details: { type: 'string' },
        tag: { type: 'string', nullable: true },
        order: { type: 'number', nullable: true },
    },
    required: ['name', 'title', 'details'],
    additionalProperties: false,
};
//# sourceMappingURL=members.js.map