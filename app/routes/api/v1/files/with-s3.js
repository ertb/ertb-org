"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const getS3Client = () => {
    const credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    };
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('Unexpected error. Either S3_ACCESS_KEY_ID or S3_SECRET_ACCESS_KEY is unset.');
    }
    const region = process.env.S3_REGION;
    if (!region) {
        throw new Error('Unexpected error. S3_REGION is unset.');
    }
    const endpoint = process.env.S3_ENDPOINT;
    return new client_s3_1.S3Client({ region, credentials, endpoint, forcePathStyle: !!endpoint });
};
const getBucket = () => {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
        throw new Error('Unexpected error. S3_BUCKET is unset.');
    }
    return bucket;
};
const withS3 = (req, _res, next) => {
    req.s3 = getS3Client();
    req.bucket = getBucket();
    next();
};
exports.withS3 = withS3;
//# sourceMappingURL=with-s3.js.map