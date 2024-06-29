"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const v1_1 = require("./routes/api/v1");
const auth_sign_verify_1 = require("./routes/api/auth-sign-verify");
const http_error_1 = require("./lib/http-error");
const path_1 = __importDefault(require("path"));
(0, auth_sign_verify_1.signingKeyRotation)(process.env.JWKS_ROTATION_TIME);
const app = (0, express_1.default)();
app.set('json spaces', 2);
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV != 'development') {
    app.use((0, morgan_1.default)("common"));
}
else {
    app.use((0, morgan_1.default)("dev"));
}
app.use('/api/v1', v1_1.v1);
const publicroot = path_1.default.join(__dirname, 'public');
app.use(express_1.default.static(publicroot));
app.get('*', (_req, res) => res.sendFile('index.html', { root: publicroot }));
app.use(http_error_1.ErrorHandler);
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map