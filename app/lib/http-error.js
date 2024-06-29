"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.Redirect = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.toName = void 0;
const http_1 = require("http");
const url_1 = __importDefault(require("url"));
class HTTPError extends Error {
    statusCode;
    constructor(code, message, extras) {
        super(message || http_1.STATUS_CODES[code]);
        if (extras) {
            Object.assign(this, extras);
        }
        this.name = toName(code);
        this.statusCode = code;
    }
}
exports.default = HTTPError;
function toName(code) {
    const suffix = (code >= 400 && code < 600) ? 'Error' : '';
    return ((http_1.STATUS_CODES[code] || 'Undefined') + suffix).replace(' ', '');
}
exports.toName = toName;
function BadRequestError(message, extras) {
    return new HTTPError(400, message, extras);
}
exports.BadRequestError = BadRequestError;
function UnauthorizedError(message, extras) {
    return new HTTPError(401, message, extras);
}
exports.UnauthorizedError = UnauthorizedError;
function ForbiddenError(message, extras) {
    return new HTTPError(403, message, extras);
}
exports.ForbiddenError = ForbiddenError;
function NotFoundError(message, extras) {
    return new HTTPError(404, message, extras);
}
exports.NotFoundError = NotFoundError;
function Redirect(location, code = 302, extras = {}) {
    if ('object' === typeof location) {
        location = url_1.default.format(location);
    }
    if ('string' !== typeof location) {
        throw new TypeError('A redirection `location` string or object must be given');
    }
    if ((code / 100 | 0) !== 3) {
        throw new TypeError(`\`code\` must be a 3xx redirect status code (i.e. 302), got ${code}`);
    }
    const message = `Redirecting to ${JSON.stringify(location)}`;
    if (!extras.headers)
        extras.headers = {};
    extras.headers.Location = location;
    return new HTTPError(code, message, extras);
}
exports.Redirect = Redirect;
const ErrorHandler = (error, _req, res, next) => {
    if (res.headersSent)
        return next(error);
    if (error instanceof HTTPError) {
        res.status(error.statusCode).send({ error: error.message });
    }
    console.error(`Unexpected Error: ${error}`);
    if (error.stack)
        console.error(error.stack);
    res.status(500).send({ error: 'Unexpected error encountered. Check server log for details.' });
};
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=http-error.js.map