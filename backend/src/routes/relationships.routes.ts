import { Router } from 'express';
import { RelationshipModel } from '../models/relationship.model';
import { PersonModel } from '../models/person.model';
import { ChangeLogModel } from '../models/change-log.model';
import { 
	assertMaxTwoBiologicalParents, 
	assertNoCycleOnAssignParent, 
	validateNoSelfParent,
	validateBidirectionalRelationship,
	validateParentAgeBeforeChild,
	validateDifferentGenderPartners,
	validateChildNotOlderThanParent,
	validateDifferentGenderParents
} from '../services/validation.service';
import { isParentAgePlausible } from '../utils/dates';

const router = Router({ mergeParams: true });

router.post('/', async (req, res) => {
	const treeId = req.params.treeId;
	const { type, fromId, toId, startDate, endDate, attributes, overrideReason } = req.body || {};
	if (!type || !fromId || !toId) return res.status(400).json({ message: 'Datos requeridos' });

	try {
		if (type === 'biological_parent') {
			// Validar que no se asigne a sí mismo como padre/madre
			validateNoSelfParent(toId, fromId);
			
			const [parent, child] = await Promise.all([
				PersonModel.findOne({ _id: fromId, treeId, softDeleted: { $ne: true } }).select('id birth'),
				PersonModel.findOne({ _id: toId, treeId, softDeleted: { $ne: true } }).select('id fatherId motherId birth'),
			]);
			if (!parent || !child) return res.status(404).json({ message: 'Personas no encontradas' });
			
			// Validar que no se exceda el máximo de progenitores biológicos
			await assertMaxTwoBiologicalParents(child.id);
			
			// Validar que no se cree un ciclo genealógico
			await assertNoCycleOnAssignParent(child.id, parent.id);
			
			// Validar edad plausible del padre/madre
			const plausible = isParentAgePlausible(parent.birth?.date, child.birth?.date, 12);
			if (!plausible && !overrideReason) {
				return res.status(400).json({ 
					message: 'Edad de padre/madre implausible, requiere motivo para override' 
				});
			}
			
			// Validar que el padre no tenga hijos antes de su nacimiento
			validateParentAgeBeforeChild(parent.birth?.date || undefined, child.birth?.date || undefined);
			
			// Validar que el hijo no sea mayor que el padre
			validateChildNotOlderThanParent(parent.birth?.date || undefined, child.birth?.date || undefined);

			// Asignar padre/madre en el registro del hijo
			if (!child.fatherId) {
				await PersonModel.updateOne({ _id: child.id }, { $set: { fatherId: parent.id } });
			} else if (!child.motherId) {
				await PersonModel.updateOne({ _id: child.id }, { $set: { motherId: parent.id } });
			} else {
				return res.status(400).json({ message: 'Máximo 2 progenitores biológicos' });
			}
			
			// Validar que los padres no sean del mismo género (después de asignar)
			await validateDifferentGenderParents(child.id);
		}

		if (type === 'partner') {
			// Validar que no se asigne a sí mismo como pareja
			validateNoSelfParent(fromId, toId);
			
			const [a, b] = await Promise.all([
				PersonModel.findOne({ _id: fromId, treeId, softDeleted: { $ne: true } }).select('id'),
				PersonModel.findOne({ _id: toId, treeId, softDeleted: { $ne: true } }).select('id'),
			]);
			if (!a || !b) return res.status(404).json({ message: 'Personas no encontradas' });
			
			// Validar relación bidireccional
			await validateBidirectionalRelationship(fromId, toId, 'partner');
			
			// Validar que no sean del mismo género
			await validateDifferentGenderPartners(fromId, toId);

			// Agregar relación bidireccional
			await Promise.all([
				PersonModel.updateOne({ _id: a.id }, { $addToSet: { partners: b.id } }),
				PersonModel.updateOne({ _id: b.id }, { $addToSet: { partners: a.id } })
			]);
		}

		const relation = await RelationshipModel.create({ treeId, type, fromId, toId, startDate, endDate, attributes, overrideReason });
		
		// Log override si se proporcionó un motivo
		if (overrideReason && overrideReason.trim()) {
			try {
				await ChangeLogModel.create({
					entityType: 'Relationship',
					entityId: relation._id,
					operation: 'create',
					changes: {
						overrideReason: overrideReason,
						validationType: 'age_plausible',
						relationshipType: type,
						fromId: fromId,
						toId: toId
					},
					performedBy: req.user?.id,
					reason: `Override de validación de edad: ${overrideReason}`
				});
			} catch (logError) {
				console.error('Error logging override:', logError);
				// No fallar la operación principal por un error de logging
			}
		}
		
		res.status(201).json({ id: relation.id });
	} catch (e: any) {
		res.status(400).json({ message: e?.message || 'Validación fallida' });
	}
});

router.delete('/:id', async (req, res) => {
	const treeId = req.params.treeId;
	const id = req.params.id;
	await RelationshipModel.deleteOne({ _id: id, treeId });
	res.json({ ok: true });
});

export default router;
