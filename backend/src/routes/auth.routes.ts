import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel } from '../models/user.model';
import { SessionModel } from '../models/session.model';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
router.use(authLimiter);

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	displayName: z.string().min(1),
});

router.post('/register', async (req, res) => {
	const parse = registerSchema.safeParse(req.body);
	if (!parse.success) return res.status(400).json({ message: 'Datos inválidos' });
	const { email, password, displayName } = parse.data;
	const exists = await UserModel.findOne({ email });
	if (exists) return res.status(409).json({ message: 'Email ya registrado' });
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await UserModel.create({ email, passwordHash, displayName });
	const { accessToken, refreshToken } = await issueTokens(user.id, req);
	return res.json({ userId: user.id, accessToken, refreshToken });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

router.post('/login', async (req, res) => {
	const parse = loginSchema.safeParse(req.body);
	if (!parse.success) return res.status(400).json({ message: 'Datos inválidos' });
	const { email, password } = parse.data;
	const user = await UserModel.findOne({ email });
	if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });
	const { accessToken, refreshToken } = await issueTokens(user.id, req);
	return res.json({ userId: user.id, accessToken, refreshToken });
});

router.post('/refresh', async (req, res) => {
	const { refreshToken } = req.body || {};
	if (!refreshToken) return res.status(400).json({ message: 'Falta refreshToken' });
	try {
		const payload = jwt.verify(refreshToken, process.env.JWT_SECRET || 'dev') as any;
		if (payload.type !== 'refresh') return res.status(401).json({ message: 'Token inválido' });
		const session = await SessionModel.findOne({ jti: payload.jti, userId: payload.sub, revokedAt: null });
		if (!session) return res.status(401).json({ message: 'Sesión inválida' });
		// Rotación: revocar actual y emitir nuevo par
		session.revokedAt = new Date();
		await session.save();
		const { accessToken, refreshToken: newRefresh } = await issueTokens(payload.sub, req);
		return res.json({ accessToken, refreshToken: newRefresh });
	} catch {
		return res.status(401).json({ message: 'Refresh inválido' });
	}
});

router.post('/logout', async (req, res) => {
	const { refreshToken } = req.body || {};
	if (!refreshToken) return res.json({ ok: true });
	try {
		const payload = jwt.verify(refreshToken, process.env.JWT_SECRET || 'dev') as any;
		await SessionModel.updateOne({ jti: payload.jti, userId: payload.sub }, { revokedAt: new Date() });
	} catch {}
	return res.json({ ok: true });
});

async function issueTokens(userId: string, req: any) {
	const jti = randomUUID();
	await SessionModel.create({ userId, jti, userAgent: req.headers['user-agent'] || '', ip: req.ip || '' });
	const jwtSecret = process.env.JWT_SECRET || 'dev';
	const accessToken = jwt.sign({ sub: userId }, jwtSecret, {
		expiresIn: process.env.JWT_ACCESS_TTL || '15m',
	});
	const refreshToken = jwt.sign({ sub: userId, type: 'refresh', jti }, jwtSecret, {
		expiresIn: process.env.JWT_REFRESH_TTL || '30d',
	});
	return { accessToken, refreshToken };
}

export default router;
