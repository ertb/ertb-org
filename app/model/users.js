"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
exports.userSchema = {
    type: "object",
    properties: {
        role: { type: "string", enum: ['admin', 'user'] },
        userInfo: {
            type: "object",
            properties: {
                "email": { type: "string" }
            },
            required: ["email"],
            additionalProperties: true,
        },
    },
    required: ["role", "userInfo"],
    additionalProperties: false,
};
//# sourceMappingURL=users.js.map