"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const v1_1 = require("./routes/api/v1");
dotenv_1.default.config();
console.log('env', process.env);
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV != 'development') {
    app.use((0, morgan_1.default)("common"));
}
else {
    app.use((0, morgan_1.default)("dev"));
}
app.use('/api/v1', v1_1.v1);
app.get("/", (_req, res) => {
    res.send("Express + TypeScript Server");
});
app.use((err, _req, res, next) => {
    if (res.headersSent)
        return next(err);
    else
        console.error('ERROR', `unexpected Error: ${err}`);
    res.status(500).send({ error: 'Unexpected error encountered. Check server log for details.' });
});
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map