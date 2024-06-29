"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamFilesRouter = void 0;
const express_1 = require("express");
const with_db_1 = require("../../../../lib/mongo-rest-route/with-db");
const client_s3_1 = require("@aws-sdk/client-s3");
const with_s3_1 = require("./with-s3");
const router = (0, express_1.Router)();
exports.streamFilesRouter = router;
router.use(with_db_1.withDb, with_s3_1.withS3);
router.get('/:filepath(*.mp4)', async (req, res) => {
    const filepath = req.params.filepath || req.params[0];
    const range = req.headers.range;
    if (!range) {
        res.status(416).send({ error: 'Range not provided' });
        return;
    }
    const { s3, bucket } = req;
    const headRes = await s3.send(new client_s3_1.HeadObjectCommand({ Bucket: bucket, Key: filepath }));
    const contentLength = headRes.ContentLength;
    if (!contentLength) {
        res.status(404).send({ error: 'Not found' });
        return;
    }
    const lastModified = headRes.LastModified?.toUTCString();
    const etag = headRes.ETag;
    const [starts, ends] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(starts, 10);
    const end = ends ? parseInt(ends, 10) : contentLength - 1;
    const getRes = await s3.send(new client_s3_1.GetObjectCommand({ Bucket: bucket, Key: filepath, Range: range }));
    res.status(206);
    Object.entries({
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Length': (end - start) + 1,
        'Content-Range': `bytes ${start}-${end}/${contentLength}`,
        'Content-Type': 'video/mp4',
        'ETag': etag,
        'Keep-Alive': 'timeout=5',
        'Last-Modified': lastModified,
    }).forEach(([k, v]) => v && res.setHeader(k, v));
    if (!getRes.Body) {
        res.status(502).send({ error: 'Failed to get content from S3.' });
        return;
    }
    getRes.Body.pipe(res);
});
router.get('/:filepath', async (req, res) => {
    const filepath = req.params.filepath || req.params[0];
    const { s3, bucket } = req;
    const headRes = await s3.send(new client_s3_1.HeadObjectCommand({ Bucket: bucket, Key: filepath }));
    const contentLength = headRes.ContentLength;
    if (!contentLength) {
        res.status(404).send({ error: 'Not found' });
        return;
    }
    const getRes = await s3.send(new client_s3_1.GetObjectCommand({ Bucket: bucket, Key: filepath }));
    if (!getRes.Body) {
        res.status(502).send({ error: 'Failed to get content from S3.' });
        return;
    }
    getRes.Body.pipe(res);
});
//# sourceMappingURL=stream-files-router.js.map