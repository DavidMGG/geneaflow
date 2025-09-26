import { Router } from 'express';
import { PersonModel } from '../models/person.model';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
	const treeId = req.params.treeId;
	const persons = await PersonModel.find({ treeId, softDeleted: false })
		.select('displayName fatherId motherId birth.date death.date photos sex partners')
		.limit(5000);
	res.json(persons.map(p => ({
		id: p.id,
		displayName: p.displayName,
		fatherId: p.fatherId,
		motherId: p.motherId,
		birthYear: p.birth?.date || null,
		deathYear: p.death?.date || null,
		hasPhoto: Array.isArray((p as any).photos) && (p as any).photos.length > 0,
		sex: (p as any).sex || 'U',
		partners: Array.isArray((p as any).partners) ? (p as any).partners : [],
	})));
});

export default router;
