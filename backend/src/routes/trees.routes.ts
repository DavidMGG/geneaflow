import { Router } from 'express';
import { TreeModel } from '../models/tree.model';
import { PersonModel } from '../models/person.model';
import { requireAuth } from '../middleware/auth';
import { listUserTrees, requireTreeRole } from '../middleware/permissions';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
	const trees = await listUserTrees((req as any).userId);
	res.json(trees.map(t => ({ id: t.id, name: t.name, description: t.description })));
});

router.post('/', requireAuth, async (req, res) => {
	const { name, description } = req.body || {};
	if (!name) return res.status(400).json({ message: 'Nombre requerido' });
	const ownerId = (req as any).userId;
	const tree = await TreeModel.create({ name, description, ownerId });
	res.status(201).json({ id: tree.id });
});

router.put('/:id', requireAuth, requireTreeRole('admin'), async (req, res) => {
	const id = req.params.id;
	const { name, description } = req.body || {};
	
	if (!name) return res.status(400).json({ message: 'Nombre requerido' });
	
	const tree = await TreeModel.findById(id);
	if (!tree) return res.status(404).json({ message: 'Árbol no encontrado' });
	
	// Actualizar el árbol
	await TreeModel.findByIdAndUpdate(id, { name, description });
	
	res.status(200).json({ message: 'Árbol actualizado exitosamente' });
});

router.delete('/:id', requireAuth, requireTreeRole('admin'), async (req, res) => {
	const id = req.params.id;
	const tree = await TreeModel.findById(id);
	if (!tree) return res.status(404).json({ message: 'Árbol no encontrado' });
	
	// Eliminar todas las personas del árbol
	await PersonModel.updateMany({ treeId: id }, { softDeleted: true });
	
	// Eliminar el árbol
	await TreeModel.findByIdAndDelete(id);
	
	res.status(200).json({ message: 'Árbol eliminado exitosamente' });
});

router.get('/:id/export', requireAuth, requireTreeRole('viewer'), async (req, res) => {
	const id = req.params.id;
	const format = String(req.query.format || 'json');
	if (format !== 'json') return res.status(400).json({ message: 'Formato no soportado aún' });
	const tree = await TreeModel.findById(id).select('id name description');
	if (!tree) return res.status(404).json({ message: 'Árbol no encontrado' });
	const persons = await PersonModel.find({ treeId: id, softDeleted: false });
	res.json({ tree, persons });
});

export default router;
