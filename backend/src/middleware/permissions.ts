import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TreeModel } from '../models/tree.model';

export type TreeRole = 'viewer' | 'editor' | 'admin';

export function requireTreeRole(role: TreeRole) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = (req as any).userId as string | undefined;
			if (!userId) return res.status(401).json({ message: 'No autorizado' });
			const treeId = (req.params.treeId || req.params.id) as string;
			if (!treeId) return res.status(400).json({ message: 'Falta treeId' });
			const tree = await TreeModel.findById(treeId).select('ownerId collaborators');
			if (!tree) return res.status(404).json({ message: 'Árbol no encontrado' });

			const isOwner = String(tree.ownerId) === String(userId);
			if (isOwner) return next();
			const collab = tree.collaborators?.find(c => String(c.userId) === String(userId));
			const level = collab?.role || null;
			const ok =
				(role === 'viewer' && (level === 'viewer' || level === 'editor' || level === 'admin')) ||
				(role === 'editor' && (level === 'editor' || level === 'admin')) ||
				(role === 'admin' && level === 'admin');
			if (!ok) return res.status(403).json({ message: 'Permisos insuficientes' });
			return next();
		} catch {
			return res.status(500).json({ message: 'Error de permisos' });
		}
	};
}

export async function listUserTrees(userId: string) {
	const uid = new mongoose.Types.ObjectId(userId);
	const trees = await TreeModel.find({
		$or: [
			{ ownerId: uid },
			{ 'collaborators.userId': uid },
		],
	});
	return trees;
}
