"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapAsync = void 0;
function wrapAsync(fn) {
    if (fn.length < 4) {
        return (req, res, next) => {
            return fn(req, res, next).catch(next);
        };
    }
    else {
        return (error, req, res, next) => {
            return fn(error, req, res, next).catch(next);
        };
    }
}
exports.wrapAsync = wrapAsync;
//# sourceMappingURL=wrapAsync.js.map