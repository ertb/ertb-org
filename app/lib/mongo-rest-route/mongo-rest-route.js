"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoRestRouter = void 0;
const express_1 = require("express");
const query_to_mongo_1 = __importDefault(require("query-to-mongo"));
const mongodb_1 = require("mongodb");
const validation_error_1 = require("./validation-error");
const with_db_1 = require("./with-db");
const apply_patch_request_1 = require("./apply-patch-request");
const get_validate_1 = require("./get-validate");
const NotFoundMessage = 'An entry with that id could not be found.';
const idPath = '/:id([0-9a-fA-F]{24})';
const getPatchTarget = (o, keys) => {
    if (o === undefined)
        return undefined;
    if (!Array.isArray(keys)) {
        keys = keys.split('/').filter(x => !!x).map(x => x.replace('~0', '/').replace('~1', '~'));
    }
    if (keys.length > 1) {
        if (Array.isArray(o)) {
            const index = parseInt(keys[0]);
            return getPatchTarget(o[index], keys.slice(1));
        }
        return getPatchTarget(o[keys[0]], keys.slice(1));
    }
    if (['number', 'bigint', 'string', 'boolean'].includes(typeof o))
        return undefined;
    return o;
};
const MongoRestRouter = (collection, schema, options = {}) => {
    const { db, methods, sort, noGetSearch: noSearch, noPostBulk, resultsField, noArchive, noManagedDates, dateFields: dateFieldOverrides } = options;
    const dateFields = { added: 'added', lastModified: 'lastModified', deleted: 'deleted', ...dateFieldOverrides };
    const router = (0, express_1.Router)(options);
    router.use((0, express_1.json)());
    if (db) {
        router.use((req, _res, next) => {
            req.db = typeof db == 'function' ? db() : db;
            next();
        });
    }
    else {
        router.use(with_db_1.withDb);
    }
    const { validate, validateBulk } = (0, get_validate_1.getValidate)(schema, { dateFields, noManagedDates });
    if (!methods || methods.includes('GET')) {
        if (!noSearch) {
            router.get('/', async (req, res) => {
                const c = req.db.collection(collection);
                const { criteria, options } = (0, query_to_mongo_1.default)(req.query);
                options.sort = options.sort || sort;
                if (!noManagedDates) {
                    criteria[dateFields.deleted] = { "$exists": false };
                }
                const result = {};
                result.count = await c.countDocuments(criteria);
                result[resultsField || collection] = await c.find(criteria, options).toArray();
                return res.send(result);
            });
        }
        router.get(idPath, async (req, res) => {
            const c = req.db.collection(collection);
            const criteria = { '_id': new mongodb_1.ObjectId(req.params.id) };
            if (!noManagedDates) {
                criteria[dateFields.deleted] = { "$exists": false };
            }
            const found = await c.findOne(criteria);
            if (!found) {
                res.status(404).send({ error: NotFoundMessage });
                return;
            }
            res.send(found);
        });
        if (!noArchive || noManagedDates) {
            router.get(`/archive`, async (req, res) => {
                const c = req.db.collection(collection);
                const { criteria, options } = (0, query_to_mongo_1.default)(req.query);
                criteria[dateFields.deleted] = { "$exists": true };
                const result = {};
                result.count = await c.countDocuments(criteria);
                result[resultsField || collection] = await c.find(criteria, options).toArray();
                return res.send(result);
            });
            router.get(`/archive/${idPath}`, async (req, res) => {
                const c = req.db.collection(collection);
                const criteria = { '_id': new mongodb_1.ObjectId(req.params.id) };
                criteria[dateFields.deleted] = { "$exists": true };
                const found = await c.findOne(criteria);
                if (!found) {
                    res.status(404).send({ error: NotFoundMessage });
                    return;
                }
                res.send(found);
            });
        }
    }
    if (!methods || methods.includes('POST')) {
        router.post('/', async (req, res) => {
            try {
                const payload = validateBulk(req.body);
                const c = req.db.collection(collection);
                if (Array.isArray(payload)) {
                    if (!noManagedDates) {
                        const now = new Date();
                        payload.forEach((x) => {
                            x[dateFields.added] = now;
                        });
                    }
                    if (noPostBulk) {
                        throw new validation_error_1.ValidationError('should be an object');
                    }
                    const result = await c.insertMany(payload);
                    res.send({ insertedIds: result.insertedIds });
                    return;
                }
                if (!noManagedDates) {
                    payload[dateFields.added] = new Date();
                }
                const result = await c.insertOne(payload);
                res.send({ insertedId: result.insertedId });
            }
            catch (e) {
                (0, validation_error_1.handleValidateError)(e, res);
            }
        });
    }
    if (!methods || methods.includes('PUT')) {
        router.put(idPath, async (req, res) => {
            try {
                const payload = validate(req.body, { isUpdate: true });
                payload._id = new mongodb_1.ObjectId(req.params.id);
                if (!noManagedDates) {
                    const p = payload;
                    p[dateFields.added] = undefined;
                    p[dateFields.lastModified] = new Date();
                }
                const c = req.db.collection(collection);
                const criteria = { '_id': payload._id };
                if (!noManagedDates) {
                    criteria[dateFields.deleted] = { "$exists": false };
                }
                const result = await c.updateOne(criteria, payload);
                if (result.modifiedCount == 0) {
                    res.status(404).send({ error: NotFoundMessage });
                    return;
                }
                res.send({ modifiedCount: result.modifiedCount });
            }
            catch (e) {
                (0, validation_error_1.handleValidateError)(e, res);
            }
        });
    }
    if (!methods || methods.includes('PATCH')) {
        router.patch(idPath, async (req, res) => {
            const c = req.db.collection(collection);
            const criteria = { '_id': new mongodb_1.ObjectId(req.params.id) };
            if (!noManagedDates) {
                criteria[dateFields.deleted] = { "$exists": false };
            }
            const origObject = await c.findOne(criteria);
            if (!origObject) {
                res.status(404).send({ error: NotFoundMessage });
                return;
            }
            try {
                const newObject = (0, apply_patch_request_1.applyPatchRequest)(origObject, req);
                validate(newObject, { isUpdate: true });
                if (!noManagedDates) {
                    newObject[dateFields.lastModified] = new Date();
                }
                const result = await c.updateOne({ '_id': origObject._id }, { $set: newObject });
                res.send({ modifiedCount: result.matchedCount });
            }
            catch (e) {
                (0, validation_error_1.handleValidateError)(e, res);
                return;
            }
        });
    }
    if (!methods || methods.includes('DELETE')) {
        router.delete(idPath, async (req, res) => {
            const c = req.db.collection(collection);
            if (noArchive || noManagedDates) {
                const result = await c.deleteOne({ "_id": new mongodb_1.ObjectId(req.params.id) });
                res.status(200).send({ deletedCount: result.deletedCount });
                return;
            }
            const criteria = { '_id': new mongodb_1.ObjectId(req.params.id) };
            if (!noManagedDates) {
                criteria[dateFields.deleted] = { "$exists": false };
            }
            const updates = {};
            updates[dateFields.deleted] = new Date();
            const result = await c.updateOne(criteria, { "$set": updates });
            res.status(200).send({ deletedCount: result.modifiedCount });
        });
        if (!noArchive || noManagedDates) {
            router.delete(`/archive/${idPath}`, async (_req, res) => {
                res.status(501).send({ error: 'Archive not yet implemented' });
            });
        }
    }
    return router;
};
exports.MongoRestRouter = MongoRestRouter;
//# sourceMappingURL=mongo-rest-route.js.map