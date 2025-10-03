"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tree_model_1 = require("../models/tree.model");
const person_model_1 = require("../models/person.model");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const trees = await (0, permissions_1.listUserTrees)(req.userId);
    res.json(trees.map(t => ({ id: t.id, name: t.name, description: t.description })));
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    const { name, description } = req.body || {};
    if (!name)
        return res.status(400).json({ message: 'Nombre requerido' });
    const ownerId = req.userId;
    const tree = await tree_model_1.TreeModel.create({ name, description, ownerId });
    res.status(201).json({ id: tree.id });
});
router.put('/:id', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('admin'), async (req, res) => {
    const id = req.params.id;
    const { name, description } = req.body || {};
    if (!name)
        return res.status(400).json({ message: 'Nombre requerido' });
    const tree = await tree_model_1.TreeModel.findById(id);
    if (!tree)
        return res.status(404).json({ message: 'Árbol no encontrado' });
    // Actualizar el árbol
    await tree_model_1.TreeModel.findByIdAndUpdate(id, { name, description });
    res.status(200).json({ message: 'Árbol actualizado exitosamente' });
});
router.delete('/:id', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('admin'), async (req, res) => {
    const id = req.params.id;
    const tree = await tree_model_1.TreeModel.findById(id);
    if (!tree)
        return res.status(404).json({ message: 'Árbol no encontrado' });
    // Eliminar todas las personas del árbol
    await person_model_1.PersonModel.updateMany({ treeId: id }, { softDeleted: true });
    // Eliminar el árbol
    await tree_model_1.TreeModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Árbol eliminado exitosamente' });
});
router.get('/:id/export', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('viewer'), async (req, res) => {
    const id = req.params.id;
    const format = String(req.query.format || 'json');
    if (format !== 'json')
        return res.status(400).json({ message: 'Formato no soportado aún' });
    const tree = await tree_model_1.TreeModel.findById(id).select('id name description');
    if (!tree)
        return res.status(404).json({ message: 'Árbol no encontrado' });
    const persons = await person_model_1.PersonModel.find({ treeId: id, softDeleted: false });
    res.json({ tree, persons });
});
exports.default = router;
