"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postJSON = exports.fetchJSON = void 0;
class ResponseError extends Error {
    res;
    constructor(message, res) {
        super(message);
        this.res = res;
    }
}
const fetchJSON = (input, init) => {
    const headers = { ...init?.headers, 'accept': 'application/json' };
    return fetch(input, { ...init, headers })
        .then(res => {
        if (!res.ok)
            throw new ResponseError(`${res.status} ${res.statusText}`, res);
        return res.json();
    })
        .then(json => json);
};
exports.fetchJSON = fetchJSON;
const postJSON = (input, payload, init) => {
    const headers = { ...init?.headers, 'content-type': 'application/json' };
    init = { ...init, method: 'POST', headers, body: JSON.stringify(payload) };
    return (0, exports.fetchJSON)(input, init);
};
exports.postJSON = postJSON;
//# sourceMappingURL=fetch-json.js.map