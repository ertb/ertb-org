"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileReq = exports.FileTooLargeError = void 0;
const lib_storage_1 = require("@aws-sdk/lib-storage");
const client_s3_1 = require("@aws-sdk/client-s3");
const busboy_1 = __importDefault(require("busboy"));
const MB = 1024 * 1024;
class FileTooLargeError extends Error {
    constructor() {
        super('File too large');
        this.name = 'FileTooLargeError';
    }
}
exports.FileTooLargeError = FileTooLargeError;
const uploadFileReq = async (req, options) => {
    const { fileSizeLimit = 100 * MB } = options || {};
    if (!process.env.AWS_S3_ACCESS_KEY_ID)
        throw new Error('AWS_S3_ACCESS_KEY_ID is not set');
    if (!process.env.AWS_S3_SECRET_KEY)
        throw new Error('AWS_S3_SECRET_KEY is not set');
    if (!process.env.AWS_S3_BUCKET)
        throw new Error('AWS_S3_BUCKET is not set');
    if (!process.env.AWS_S3_REGION)
        throw new Error('AWS_S3_REGION is not set');
    const s3Client = new client_s3_1.S3Client({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_KEY,
        }
    });
    return new Promise((resolve, reject) => {
        const bb = (0, busboy_1.default)({
            headers: req.headers,
            limits: { fileSize: fileSizeLimit }
        });
        bb.on('file', (_fieldname, file, info) => {
            const { filename, mimeType } = info;
            const upload = new lib_storage_1.Upload({
                client: s3Client,
                params: {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: filename,
                    ContentType: mimeType || undefined,
                    ACL: 'public-read',
                    Body: file,
                },
            });
            upload.done().then(x => resolve(x.Location))
                .catch(reject);
        });
        bb.on('limit', () => {
            reject(new FileTooLargeError());
        });
    });
};
exports.uploadFileReq = uploadFileReq;
//# sourceMappingURL=upload-file-req.js.map