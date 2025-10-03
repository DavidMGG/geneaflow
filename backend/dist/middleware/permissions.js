"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTreeRole = requireTreeRole;
exports.listUserTrees = listUserTrees;
const mongoose_1 = __importDefault(require("mongoose"));
const tree_model_1 = require("../models/tree.model");
function requireTreeRole(role) {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: 'No autorizado' });
            const treeId = (req.params.treeId || req.params.id);
            if (!treeId)
                return res.status(400).json({ message: 'Falta treeId' });
            const tree = await tree_model_1.TreeModel.findById(treeId).select('ownerId collaborators');
            if (!tree)
                return res.status(404).json({ message: 'Árbol no encontrado' });
            const isOwner = String(tree.ownerId) === String(userId);
            if (isOwner)
                return next();
            const collab = tree.collaborators?.find(c => String(c.userId) === String(userId));
            const level = collab?.role || null;
            const ok = (role === 'viewer' && (level === 'viewer' || level === 'editor' || level === 'admin')) ||
                (role === 'editor' && (level === 'editor' || level === 'admin')) ||
                (role === 'admin' && level === 'admin');
            if (!ok)
                return res.status(403).json({ message: 'Permisos insuficientes' });
            return next();
        }
        catch {
            return res.status(500).json({ message: 'Error de permisos' });
        }
    };
}
async function listUserTrees(userId) {
    const uid = new mongoose_1.default.Types.ObjectId(userId);
    const trees = await tree_model_1.TreeModel.find({
        $or: [
            { ownerId: uid },
            { 'collaborators.userId': uid },
        ],
    });
    return trees;
}
