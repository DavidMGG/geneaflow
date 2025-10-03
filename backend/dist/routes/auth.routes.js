"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const user_model_1 = require("../models/user.model");
const session_model_1 = require("../models/session.model");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
const authLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100 });
router.use(authLimiter);
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    displayName: zod_1.z.string().min(1),
});
router.post('/register', async (req, res) => {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ message: 'Datos inválidos' });
    const { email, password, displayName } = parse.data;
    const exists = await user_model_1.UserModel.findOne({ email });
    if (exists)
        return res.status(409).json({ message: 'Email ya registrado' });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await user_model_1.UserModel.create({ email, passwordHash, displayName });
    const { accessToken, refreshToken } = await issueTokens(user.id, req);
    return res.json({ userId: user.id, accessToken, refreshToken });
});
const loginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(8) });
router.post('/login', async (req, res) => {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ message: 'Datos inválidos' });
    const { email, password } = parse.data;
    const user = await user_model_1.UserModel.findOne({ email });
    if (!user)
        return res.status(401).json({ message: 'Credenciales inválidas' });
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        return res.status(401).json({ message: 'Credenciales inválidas' });
    const { accessToken, refreshToken } = await issueTokens(user.id, req);
    return res.json({ userId: user.id, accessToken, refreshToken });
});
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken)
        return res.status(400).json({ message: 'Falta refreshToken' });
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET || 'dev');
        if (payload.type !== 'refresh')
            return res.status(401).json({ message: 'Token inválido' });
        const session = await session_model_1.SessionModel.findOne({ jti: payload.jti, userId: payload.sub, revokedAt: null });
        if (!session)
            return res.status(401).json({ message: 'Sesión inválida' });
        // Rotación: revocar actual y emitir nuevo par
        session.revokedAt = new Date();
        await session.save();
        const { accessToken, refreshToken: newRefresh } = await issueTokens(payload.sub, req);
        return res.json({ accessToken, refreshToken: newRefresh });
    }
    catch {
        return res.status(401).json({ message: 'Refresh inválido' });
    }
});
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken)
        return res.json({ ok: true });
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET || 'dev');
        await session_model_1.SessionModel.updateOne({ jti: payload.jti, userId: payload.sub }, { revokedAt: new Date() });
    }
    catch { }
    return res.json({ ok: true });
});
async function issueTokens(userId, req) {
    const jti = (0, crypto_1.randomUUID)();
    await session_model_1.SessionModel.create({ userId, jti, userAgent: req.headers['user-agent'] || '', ip: req.ip || '' });
    const jwtSecret = process.env.JWT_SECRET || 'dev';
    const accessToken = jsonwebtoken_1.default.sign({ sub: userId }, jwtSecret, {
        expiresIn: process.env.JWT_ACCESS_TTL || '15m',
    });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: userId, type: 'refresh', jti }, jwtSecret, {
        expiresIn: process.env.JWT_REFRESH_TTL || '30d',
    });
    return { accessToken, refreshToken };
}
exports.default = router;
