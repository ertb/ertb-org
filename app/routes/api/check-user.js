"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUser = void 0;
const with_db_1 = require("../../lib/mongo-rest-route/with-db");
const auth_sign_verify_1 = require("./auth-sign-verify");
const mongodb_1 = require("mongodb");
const checkUser = (role) => async (req, res, next) => {
    if (!req.db)
        (0, with_db_1.withDb)(req, res);
    if (!req.headers.authorization) {
        res.status(401).send({ error: 'Authorization not provided' });
        return;
    }
    const [authScheme, jwt] = req.headers.authorization.split(' ');
    if (authScheme.toLowerCase() != 'bearer') {
        console.warn(`Unknown authorization scheme: ${authScheme}`);
        res.status(401).send({ error: `Unknown authorization scheme: ${authScheme}` });
        return;
    }
    let payload;
    try {
        payload = await (0, auth_sign_verify_1.verifyToken)(jwt);
    }
    catch (e) {
        console.debug(e);
        res.status(401).send({ error: 'Could not verify bearer token. User should sign in again.' });
        return;
    }
    const user = await req.db.collection('users').findOne(new mongodb_1.ObjectId(payload.userId));
    if (!user) {
        console.warn('Could not verify user');
        res.status(401).send({ error: 'Could not verify user' });
        return;
    }
    if (user.role != role) {
        console.warn('User is not authorized');
        res.status(403).send({ error: 'User is not authorized' });
    }
    next();
};
exports.checkUser = checkUser;
//# sourceMappingURL=check-user.js.map