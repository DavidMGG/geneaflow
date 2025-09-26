import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload { sub: string; jti?: string; type?: 'refresh' | 'access' }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	try {
		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.slice(7) : null;
		if (!token) return res.status(401).json({ message: 'No autorizado' });
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev') as AuthPayload;
		(req as any).userId = decoded.sub;
		next();
	} catch {
		return res.status(401).json({ message: 'Token inválido' });
	}
}
