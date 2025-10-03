"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const person_model_1 = require("../models/person.model");
const normalization_1 = require("../utils/normalization");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', async (req, res) => {
    const treeId = req.params.treeId;
    const q = String(req.query.q || '').trim();
    if (!q)
        return res.json([]);
    const tokens = (0, normalization_1.tokenize)(q);
    const query = { treeId, softDeleted: false };
    if (tokens.length) {
        query.$or = [
            { 'search.normalizedFullName': { $regex: (0, normalization_1.normalizeText)(q), $options: 'i' } },
            { 'search.tokens': { $in: tokens } },
        ];
    }
    const results = await person_model_1.PersonModel.find(query).select('displayName fatherId motherId').limit(20);
    res.json(results);
});
exports.default = router;
