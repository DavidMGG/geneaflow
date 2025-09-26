import { createApp } from './app';
import authRoutes from './routes/auth.routes';
import treesRoutes from './routes/trees.routes';
import personsRoutes from './routes/persons.routes';
import relationshipsRoutes from './routes/relationships.routes';
import searchRoutes from './routes/search.routes';
import collaboratorsRoutes from './routes/collaborators.routes';
import personsReadRoutes from './routes/persons.read.routes';
import demoRoutes from './routes/demo.routes';
import express from 'express';
import { requireAuth } from './middleware/auth';
import { requireTreeRole } from './middleware/permissions';

export function mountApi() {
	const app = createApp();
	const api = express.Router();
	
	// Rutas del demo (sin autenticación)
	api.use('/', demoRoutes);
	
	// Rutas autenticadas
	api.use('/auth', authRoutes);
	api.use('/trees', treesRoutes);
	api.use('/trees/:treeId/persons', requireAuth, requireTreeRole('editor'), personsRoutes);
	api.use('/trees/:treeId/people', requireAuth, requireTreeRole('viewer'), personsReadRoutes);
	api.use('/trees/:treeId/relationships', requireAuth, requireTreeRole('editor'), relationshipsRoutes);
	api.use('/trees/:treeId/search', requireAuth, requireTreeRole('viewer'), searchRoutes);
	api.use('/trees/:treeId/collaborators', collaboratorsRoutes);
	
	app.use('/api', api);

	// 404 global
	app.use((_req, res) => {
		res.status(404).json({ error: 'Not Found' });
	});

	return app;
}