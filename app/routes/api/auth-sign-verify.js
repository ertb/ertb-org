"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = exports.getSigningKey = exports.signingKeyRotation = exports.NoSigningKeyError = void 0;
const secs_1 = require("../../lib/secs");
const jose_1 = require("jose");
class NoSigningKeyError extends Error {
}
exports.NoSigningKeyError = NoSigningKeyError;
const secret = {
    jwks: undefined,
    keyPair: undefined,
    lastKeyPair: undefined,
    rotateTime: 0,
    lastRotateTime: 0,
};
const signingKeyRotation = (interval) => {
    const ms = 1000 * Math.abs((0, secs_1.secs)(interval || '1 day'));
    return setInterval(() => (0, exports.getSigningKey)({ forceRotate: true }), ms);
};
exports.signingKeyRotation = signingKeyRotation;
const getSigningKey = async (options) => {
    const { forceRotate = false } = options || {};
    const now = Date.now();
    if (forceRotate || !secret.keyPair || secret.rotateTime <= now) {
        secret.lastRotateTime = secret.rotateTime;
        secret.lastKeyPair = secret.keyPair;
        secret.rotateTime = now + Math.abs((0, secs_1.secs)(process.env.JWK_ROTATION_TIME || '1 day')) * 1000;
        secret.keyPair = await (0, jose_1.generateKeyPair)('RS256');
        const keys = [];
        if (secret.lastKeyPair)
            keys.push(await (0, jose_1.exportJWK)(secret.lastKeyPair.publicKey));
        keys.unshift(await (0, jose_1.exportJWK)(secret.keyPair.publicKey));
        secret.jwks = (0, jose_1.createLocalJWKSet)({ keys });
    }
    return secret.keyPair.privateKey;
};
exports.getSigningKey = getSigningKey;
const signToken = async (payload) => {
    const signingKey = await (0, exports.getSigningKey)();
    const expiresIn = (0, secs_1.secs)(process.env.JWT_EXPIRATION_TIME || '1 day');
    const expiriationTime = Math.trunc(Date.now() / 1000) + expiresIn;
    const jwt = new jose_1.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime(expiriationTime);
    if (process.env.JWT_ISSUER)
        jwt.setIssuer(process.env.JWT_ISSUER);
    if (process.env.JWT_AUDIENCE)
        jwt.setIssuer(process.env.JWT_AUDIENCE);
    const token = await jwt.sign(signingKey);
    return { token, expires: expiriationTime };
};
exports.signToken = signToken;
const verifyToken = async (jwt) => {
    const options = {
        issuer: process.env.JWT_ISSUER || undefined,
        audience: process.env.JWT_AUDIENCE || undefined,
    };
    if (!secret.jwks) {
        throw new Error('No signing key. User needs to login in again.');
    }
    const result = await (0, jose_1.jwtVerify)(jwt, secret.jwks, options)
        .catch(async (e) => {
        if (e?.code === 'ERR_JWKS_MULTIPLE_MATCHING_KEYS') {
            for await (const publicKey of e) {
                try {
                    await (0, jose_1.jwtVerify)(jwt, publicKey, options);
                }
                catch (innerError) {
                    if (innerError?.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
                        continue;
                    }
                    throw innerError;
                }
            }
            throw new Error('JWS signature verification failed');
        }
        throw e;
    });
    return result.payload;
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth-sign-verify.js.map