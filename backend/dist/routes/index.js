"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
// TODO: router.use('/auth', authRouter)
// TODO: router.use('/trees', treesRouter)
// TODO: router.use('/search', searchRouter)
exports.default = router;
