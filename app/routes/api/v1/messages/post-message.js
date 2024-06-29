"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postMessage = void 0;
const messages_1 = require("../../../../model/messages");
const express_1 = require("express");
const validation_error_1 = require("../../../../lib/mongo-rest-route/validation-error");
const email_1 = require("../../../../lib/email");
const ajv_with_formats_1 = __importDefault(require("../../../../lib/mongo-rest-route/ajv-with-formats"));
const mongo_rest_route_1 = require("../../../../lib/mongo-rest-route");
const ajv = new ajv_with_formats_1.default();
const validator = ajv.compile(messages_1.postedMessageSchema);
const validateMessage = (data) => {
    const valid = validator(data);
    if (!valid) {
        throw new validation_error_1.ValidationError(ajv.errors);
    }
    return data;
};
const postMessage = async (req, res) => {
    if (!req.body)
        await new Promise((resolve) => (0, express_1.json)()(req, res, resolve));
    if (!req.db)
        await new Promise((resolve) => (0, mongo_rest_route_1.withDb)(req, res, resolve));
    try {
        const clientAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const data = validateMessage(req.body);
        data.clientAddress = clientAddress?.toString() || 'unknown';
        data.date = new Date().toISOString();
        const c = req.db.collection('messages');
        let isSaved = false, isSent = false;
        try {
            await c.insertOne(data);
            isSaved = true;
        }
        catch (e) {
            console.error('Error storing message.', e);
        }
        const sendTo = process.env.CONTACT_EMAIL;
        if (sendTo) {
            const sendFrom = 'no-reply@ertb.org';
            const subject = `ertb.org Contact Form - Message from ${data.name}`;
            const message = "Name: " + data.name + "\n"
                + "Phone: " + data.phone + "\n"
                + "Email: " + data.email + "\n\n\n"
                + data.message + "\n\n\n"
                + "clientAddress: " + clientAddress;
            (0, email_1.sendEmail)(sendFrom, sendTo, subject, message);
        }
        if (!isSaved && !isSent) {
            res.status(500).send({ error: 'Message was not recorded.' });
            return;
        }
        res.status(202).send({ message: 'Message recorded.' });
    }
    catch (e) {
        (0, validation_error_1.handleValidateError)(e, res);
    }
};
exports.postMessage = postMessage;
//# sourceMappingURL=post-message.js.map