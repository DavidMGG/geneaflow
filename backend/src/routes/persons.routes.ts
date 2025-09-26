import { Router } from 'express';
import { PersonModel } from '../models/person.model';
import { validatePersonData } from '../services/validation.service';

const router = Router({ mergeParams: true });

router.post('/', async (req, res) => {
	try {
		const treeId = req.params.treeId;
		const { givenNames, familyNames, displayName, sex, birthYear, deathYear, fatherId, motherId, partners } = req.body || {};
		
		// Validar datos de la persona
		await validatePersonData({
			givenNames,
			familyNames,
			displayName,
			birthDate: birthYear,
			deathDate: deathYear,
			fatherId,
			motherId,
			partners
		}, treeId);
		
		// Mapear birthYear y deathYear a la estructura del modelo
		const personData: any = { treeId, givenNames, familyNames, displayName, sex };
		
		if (birthYear) {
			personData.birth = { date: birthYear };
		}
		
		if (deathYear) {
			personData.death = { date: deathYear };
		}
		
		if (fatherId) {
			personData.fatherId = fatherId;
		}
		
		if (motherId) {
			personData.motherId = motherId;
		}
		
		if (partners && partners.length > 0) {
			personData.partners = partners;
		}
		
		const person = await PersonModel.create(personData);
		res.status(201).json({ id: person.id });
	} catch (error) {
		console.error('Error creando persona:', error);
		res.status(400).json({ message: error.message || 'Error al crear persona' });
	}
});

router.get('/:personId', async (req, res) => {
	const { treeId, personId } = req.params;
	const person = await PersonModel.findOne({ _id: personId, treeId, softDeleted: { $ne: true } });
	if (!person) return res.status(404).json({ message: 'No encontrado' });
	res.json(person);
});

router.put('/:personId', async (req, res) => {
	try {
		const { treeId, personId } = req.params;
		const { givenNames, familyNames, displayName, birthYear, deathYear, fatherId, motherId, partners } = req.body || {};
		
		// Validar datos de la persona (excluyendo el ID actual para actualizaciones)
		await validatePersonData({
			givenNames,
			familyNames,
			displayName,
			birthDate: birthYear,
			deathDate: deathYear,
			fatherId,
			motherId,
			partners
		}, treeId, personId);
		
		const person = await PersonModel.findOneAndUpdate({ _id: personId, treeId, softDeleted: { $ne: true } }, req.body, { new: true });
		if (!person) return res.status(404).json({ message: 'No encontrado' });
		res.json(person);
	} catch (error) {
		console.error('Error actualizando persona:', error);
		res.status(400).json({ message: error.message || 'Error al actualizar persona' });
	}
});

router.delete('/:personId', async (req, res) => {
	const { treeId, personId } = req.params;
	const person = await PersonModel.findOneAndUpdate({ _id: personId, treeId }, { softDeleted: true }, { new: true });
	if (!person) return res.status(404).json({ message: 'No encontrado' });
	res.json({ ok: true });
});

export default router;
