import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// TODO: router.use('/auth', authRouter)
// TODO: router.use('/trees', treesRouter)
// TODO: router.use('/search', searchRouter)

export default router;
