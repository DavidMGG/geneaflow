import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireTreeRole } from '../middleware/permissions';
import { TreeModel } from '../models/tree.model';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requireTreeRole('admin'), async (req, res) => {
	const tree = await TreeModel.findById(req.params.treeId).select('collaborators');
	if (!tree) return res.status(404).json({ message: 'Árbol no encontrado' });
	res.json(tree.collaborators || []);
});

router.post('/invite', requireAuth, requireTreeRole('admin'), async (req, res) => {
	const { userId, role } = req.body || {};
	if (!userId || !role) return res.status(400).json({ message: 'Datos inválidos' });
	const tree = await TreeModel.findById(req.params.treeId);
	if (!tree) return res.status(404).json({ message: 'Árbol no encontrado' });
	const exists = tree.collaborators?.some(c => String(c.userId) === String(userId));
	if (exists) return res.status(409).json({ message: 'Ya es colaborador' });
	tree.collaborators = [...(tree.collaborators || []), { userId, role, invitedBy: (req as any).userId } as any];
	await tree.save();
	res.json({ ok: true });
});

export default router;
