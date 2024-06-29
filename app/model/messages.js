"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postedMessageSchema = exports.messageSchema = void 0;
exports.messageSchema = {
    type: 'object',
    properties: {
        date: { type: 'string' },
        clientAddress: { oneOf: [
                { type: 'string', format: 'ipv4' },
                { type: 'string', format: 'ipv6' },
            ] },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        message: { type: 'string' },
    },
    required: ['date', 'clientAddress', 'name', 'email', 'phone', 'message'],
    additionalProperties: false,
};
exports.postedMessageSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        message: { type: 'string' },
    },
    required: ['name', 'email', 'phone', 'message'],
    additionalProperties: false,
};
//# sourceMappingURL=messages.js.map