"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDb = void 0;
const mongodb_1 = require("mongodb");
const mongoURL = process.env.MONGO_URL;
const withDb = (req, res, next) => {
    console.log('env', process.env);
    console.log('MONGO_URL', process.env.MONGO_URL);
    if (!mongoURL) {
        res.status(500).send({ err: 'MONGO_URL not set' });
        return;
    }
    const client = new mongodb_1.MongoClient(mongoURL);
    const db = client.db();
    req.db = db;
    next();
};
exports.withDb = withDb;
//# sourceMappingURL=with-db.js.map