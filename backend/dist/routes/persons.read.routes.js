"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const person_model_1 = require("../models/person.model");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', async (req, res) => {
    const treeId = req.params.treeId;
    const persons = await person_model_1.PersonModel.find({ treeId, softDeleted: false })
        .select('displayName fatherId motherId birth.date death.date photos sex partners')
        .limit(5000);
    res.json(persons.map(p => ({
        id: p.id,
        displayName: p.displayName,
        fatherId: p.fatherId,
        motherId: p.motherId,
        birthYear: p.birth?.date || null,
        deathYear: p.death?.date || null,
        hasPhoto: Array.isArray(p.photos) && p.photos.length > 0,
        sex: p.sex || 'U',
        partners: Array.isArray(p.partners) ? p.partners : [],
    })));
});
exports.default = router;
