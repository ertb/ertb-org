"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_sign_verify_1 = require("./auth-sign-verify");
describe('auth-sign-verify', () => {
    it('should sign and verify', async () => {
        const { token, expires } = await (0, auth_sign_verify_1.signToken)({ id: 1234 });
        const result = await (0, auth_sign_verify_1.verifyToken)(token);
        expect(result).not.toBeUndefined();
        expect(expires).toBeGreaterThan(Date.now() / 1000);
    });
    it('should verify using previous key', async () => {
        const { token } = await (0, auth_sign_verify_1.signToken)({ id: 1234 });
        (0, auth_sign_verify_1.getSigningKey)({ forceRotate: true });
        const result = await (0, auth_sign_verify_1.verifyToken)(token);
        expect(result).not.toBeUndefined();
    });
    it('should not verify using an old key', async () => {
        const { token } = await (0, auth_sign_verify_1.signToken)({ id: 1234 });
        await (0, auth_sign_verify_1.getSigningKey)({ forceRotate: true });
        await (0, auth_sign_verify_1.getSigningKey)({ forceRotate: true });
        hideConsoleError(async () => {
            const result = await (0, auth_sign_verify_1.verifyToken)(token);
            expect(result).toBeUndefined();
        });
    });
});
const hideConsoleError = (fn) => {
    const resetConsole = () => global.console = { ...console };
    global.console = { ...console, error: jest.fn() };
    try {
        fn();
    }
    finally {
        resetConsole;
    }
};
//# sourceMappingURL=auth-sign-verify.test.js.map