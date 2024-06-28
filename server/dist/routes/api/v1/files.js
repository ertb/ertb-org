"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = void 0;
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const with_db_1 = require("./with-db");
const router = (0, express_1.Router)();
router.use(with_db_1.withDb);
router.get('/', async (req, res) => {
    const files = req.db.collection('files');
    res.send(await files.find().toArray());
});
router.get('/tag', async (req, res) => {
    const files = req.db.collection('files');
    res.send(await files.distinct('tag'));
});
router.get('/tag/:tag', async (req, res) => {
    const { tag } = req.params;
    const files = req.db.collection('files');
    res.send(await files.find({ tag }).toArray());
});
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const files = req.db.collection('files');
    const entry = await files.findOne({ '_id': new mongodb_1.ObjectId(id) });
    if (!entry)
        res.status(404).send({ err: 'No matching entry found' });
    res.send(entry);
});
exports.files = router;
//# sourceMappingURL=files.js.map