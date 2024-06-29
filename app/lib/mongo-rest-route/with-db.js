"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDb = void 0;
const mongodb_1 = require("mongodb");
const clients = {};
const withDb = (req, res, next) => {
    const mongoURL = process.env.MONGO_URL;
    if (!mongoURL)
        throw new Error("MONGO_URL not set");
    try {
        console.log('Connecting to', mongoURL, '...');
        const start = Date.now();
        const client = clients[mongoURL] || new mongodb_1.MongoClient(mongoURL);
        clients[mongoURL] = client;
        const db = client.db();
        console.log('Connected to', mongoURL, 'in', `${(Date.now() - start) / 1000} seconds`);
        req.db = db;
    }
    catch (e) {
        console.log('Unexpected error.', e);
        if (e instanceof mongodb_1.MongoError) {
            clients[mongoURL]?.close();
            clients[mongoURL] = undefined;
        }
        if (e instanceof mongodb_1.MongoServerError) {
            res.status(503).send({ error: 'Mongo server is overloaded.' });
            return;
        }
        if (e instanceof mongodb_1.MongoError) {
            res.status(500).send({ error: 'Unexpected Mongo error.' });
            return;
        }
        res.status(500).send({ error: 'Unexpected error.' });
    }
    if (next)
        next();
};
exports.withDb = withDb;
//# sourceMappingURL=with-db.js.map