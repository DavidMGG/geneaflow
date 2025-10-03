"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const tree_model_1 = require("../models/tree.model");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('admin'), async (req, res) => {
    const tree = await tree_model_1.TreeModel.findById(req.params.treeId).select('collaborators');
    if (!tree)
        return res.status(404).json({ message: 'Árbol no encontrado' });
    res.json(tree.collaborators || []);
});
router.post('/invite', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('admin'), async (req, res) => {
    const { userId, role } = req.body || {};
    if (!userId || !role)
        return res.status(400).json({ message: 'Datos inválidos' });
    const tree = await tree_model_1.TreeModel.findById(req.params.treeId);
    if (!tree)
        return res.status(404).json({ message: 'Árbol no encontrado' });
    const exists = tree.collaborators?.some(c => String(c.userId) === String(userId));
    if (exists)
        return res.status(409).json({ message: 'Ya es colaborador' });
    tree.collaborators = [...(tree.collaborators || []), { userId, role, invitedBy: req.userId }];
    await tree.save();
    res.json({ ok: true });
});
exports.default = router;
