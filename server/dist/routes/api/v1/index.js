"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v1 = void 0;
const express_1 = require("express");
const files_1 = require("./files");
const router = (0, express_1.Router)();
router.use('/files', files_1.files);
exports.v1 = router;
//# sourceMappingURL=index.js.map