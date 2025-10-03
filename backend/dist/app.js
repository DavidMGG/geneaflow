"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
    app.use(express_1.default.json({ limit: '2mb' }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, morgan_1.default)('dev'));
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
    // TODO: montar rutas: /api/auth, /api/trees, /api/persons, /api/relationships, /api/search, /api/collaborators, /api/audit
    return app;
}
