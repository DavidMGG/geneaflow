import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

export function createApp() {
	const app = express();

	app.use(helmet());
	app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
	app.use(express.json({ limit: '2mb' }));
	app.use(cookieParser());
	app.use(morgan('dev'));

	app.get('/health', (_req: Request, res: Response) => {
		res.json({ status: 'ok' });
	});

	// TODO: montar rutas: /api/auth, /api/trees, /api/persons, /api/relationships, /api/search, /api/collaborators, /api/audit

	return app;
}
