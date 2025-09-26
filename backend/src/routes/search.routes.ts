import { Router } from 'express';
import { PersonModel } from '../models/person.model';
import { normalizeText, tokenize } from '../utils/normalization';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
	const treeId = req.params.treeId;
	const q = String(req.query.q || '').trim();
	if (!q) return res.json([]);
	const tokens = tokenize(q);
	const query: any = { treeId, softDeleted: false };
	if (tokens.length) {
		query.$or = [
			{ 'search.normalizedFullName': { $regex: normalizeText(q), $options: 'i' } },
			{ 'search.tokens': { $in: tokens } },
		];
	}
	const results = await PersonModel.find(query).select('displayName fatherId motherId').limit(20);
	res.json(results);
});

export default router;
