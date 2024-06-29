"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userprofile = void 0;
const with_db_1 = require("../../../lib/mongo-rest-route/with-db");
const auth_sign_verify_1 = require("../auth-sign-verify");
const fetch_json_1 = require("../../../lib/fetch-json");
const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
const updateOrCreateUser = async (db, userinfo, insertRole, isAdminEmail) => {
    const lastLogin = new Date();
    const found = await db.collection('users').findOneAndUpdate({ 'userinfo.email': userinfo.email }, { "$set": { userinfo, lastLogin } }, { returnDocument: 'after' });
    if (found)
        return found;
    const newUser = await db.collection('users').insertOne({ role: insertRole, userinfo, isAdminEmail, lastLogin });
    return { role: insertRole, userinfo, _id: newUser.insertedId };
};
const userprofile = async (req, res) => {
    if (!req.db)
        await new Promise((resolve) => (0, with_db_1.withDb)(req, res, resolve));
    let isAdminEmail = undefined;
    const { authorization } = req.headers;
    if (!authorization) {
        res.status(401).send({ error: 'Authorization not provided' });
        return;
    }
    const headers = {
        Authorization: authorization,
    };
    const [scheme, access_token] = authorization.split(' ');
    if (scheme.toLowerCase() != 'bearer') {
        res.status(401).send({ error: `Unknown authorization scheme: ${scheme}` });
        return;
    }
    (0, fetch_json_1.fetchJSON)(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`, { headers })
        .then(async (userinfo) => {
        let fallbackRole = 'user';
        if (adminEmails.indexOf(userinfo.email.toLowerCase()) >= 0) {
            fallbackRole = 'admin';
            isAdminEmail = true;
        }
        const user = await updateOrCreateUser(req.db, userinfo, fallbackRole, isAdminEmail);
        if (!user) {
            console.error('Could not find or create user');
            res.status(500).send({ error: 'Could not find or create user' });
            return;
        }
        const { token, expires } = await (0, auth_sign_verify_1.signToken)({ userId: user?._id });
        res.send({ ...user, authorization: `Bearer ${token}`, expires });
    })
        .catch((e) => {
        console.error('Could not authenticate user', e);
        res.status(401).send('Could not authenticate user');
    });
};
exports.userprofile = userprofile;
//# sourceMappingURL=userprofile.js.map