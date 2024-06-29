"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFilesRouter = void 0;
const express_1 = require("express");
const with_db_1 = require("../../../../lib/mongo-rest-route/with-db");
const check_user_1 = require("../../check-user");
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const with_s3_1 = require("./with-s3");
const stream_1 = require("stream");
const apply_patch_request_1 = require("../../../../lib/mongo-rest-route/apply-patch-request");
const validation_error_1 = require("../../../../lib/mongo-rest-route/validation-error");
const get_validate_1 = require("../../../../lib/mongo-rest-route/get-validate");
const files_1 = require("../../../../model/files");
const router = (0, express_1.Router)();
exports.uploadFilesRouter = router;
const { validate } = (0, get_validate_1.getValidate)(files_1.fileSchema);
router.use(with_db_1.withDb, with_s3_1.withS3);
const upload = async (s3, Bucket, Key, req) => {
    var pass = new stream_1.Stream.PassThrough();
    const promise = new lib_storage_1.Upload({ client: s3, params: { Bucket, Key, Body: pass } }).done();
    req.pipe(pass);
    await promise;
};
const getURL = (s3, bucket, filepath) => {
    const endpoint = process.env.S3_ENDPOINT;
    if (s3.config.forcePathStyle && filepath.startsWith(bucket)) {
        filepath = filepath.slice(bucket.length + 1);
    }
    return endpoint ? `${endpoint}/${bucket}/${filepath}` : `https://${bucket}.s3.amazonaws.com/${filepath}`;
};
router.post('/:filepath*', (0, check_user_1.checkUser)('admin'), async (req, res) => {
    const filepath = req.params[0].slice(1) || req.params.filepath;
    console.log('filepath', filepath);
    const files = req.db.collection('files');
    const { tag } = req.query;
    const { s3, bucket } = req;
    await upload(s3, bucket, filepath, req);
    const url = getURL(s3, bucket, filepath);
    const found = await files.findOne({ url });
    if (found) {
        if (tag)
            await files.updateOne(found, { tag });
        res.send({ _id: found._id, url, tag });
        return;
    }
    const insertRes = await files.insertOne({ url, tag, added: new Date() });
    res.send({ _id: insertRes.insertedId, url, tag });
});
router.delete('/:filepath*', async (req, res) => {
    const filepath = req.params[0].slice(1) || req.params.filepath;
    const { s3, bucket } = req;
    const url = getURL(s3, bucket, filepath);
    const files = req.db.collection('files');
    const entry = await files.findOne({ url });
    if (!entry) {
        console.log('url', url, 'filepath', filepath);
        res.status(404).send({ error: `Not found. It's likely the File was already deleted.` });
        return;
    }
    await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: filepath }));
    await files.deleteOne({ '_id': entry._id });
    res.send({ message: 'The file has been removed.' });
});
const noManagedDates = false;
const dateFields = {
    added: 'added',
    lastModified: 'lastModified',
    deleted: 'deleted'
};
router.patch('/:filepath*', (0, express_1.json)(), async (req, res) => {
    const filepath = req.params[0].slice(1) || req.params.filepath;
    const { s3, bucket } = req;
    const url = getURL(s3, bucket, filepath);
    const c = req.db.collection('files');
    const criteria = { url };
    if (!noManagedDates) {
        criteria[dateFields.deleted] = { "$exists": false };
    }
    const origObject = await c.findOne(criteria);
    if (!origObject) {
        res.status(404).send({ error: 'That file could not be found.' });
        return;
    }
    try {
        const newObject = (0, apply_patch_request_1.applyPatchRequest)(origObject, req);
        if (newObject.url != origObject.url) {
            throw new validation_error_1.ValidationError('The url field is read only. Try setting "rename" instead.', 'l/url');
        }
        const newFilepath = typeof newObject.rename === 'string' ? newObject.rename : '';
        delete newObject.rename;
        validate(newObject, { isUpdate: true });
        const oldUrl = origObject.url;
        const newUrl = getURL(s3, bucket, newFilepath);
        const isRename = !!newFilepath && newUrl != oldUrl;
        let failedToCopy = false;
        if (isRename) {
            try {
                await s3.send(new client_s3_1.CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${filepath}`, Key: newFilepath }));
                newObject.url = newUrl;
            }
            catch (e) {
                throw new Error(`Could not rename s3 file: ${filepath}`);
            }
        }
        if (!noManagedDates) {
            newObject[dateFields.lastModified] = new Date();
        }
        console.log('newObject', newObject);
        const result = await c.updateOne({ '_id': origObject._id }, { $set: newObject });
        if (isRename && !failedToCopy) {
            try {
                await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: filepath }));
            }
            catch (e) {
                console.warn(`Could not delete s3 file: ${filepath}`);
            }
        }
        res.send({ modifiedCount: result.matchedCount, url: newUrl });
    }
    catch (e) {
        console.log('HERE !!!!!!', e);
        (0, validation_error_1.handleValidateError)(e, res);
        return;
    }
});
//# sourceMappingURL=upload-files-router.js.map