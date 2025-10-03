"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const normalization_1 = require("../utils/normalization");
const eventSchema = new mongoose_1.Schema({
    type: { type: String },
    date: { type: String },
    placeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Place' },
    note: { type: String },
}, { _id: false });
const photoSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    caption: { type: String },
    uploadedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    storedAt: { type: String },
}, { _id: false });
const sourceSchema = new mongoose_1.Schema({
    type: { type: String },
    referenceId: { type: String },
    description: { type: String },
}, { _id: false });
const personSchema = new mongoose_1.Schema({
    treeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tree', required: true, index: true },
    givenNames: [{ type: String }],
    familyNames: [{ type: String }],
    displayName: { type: String },
    prefixes: [{ type: String }],
    suffixes: [{ type: String }],
    sex: { type: String, enum: ['M', 'F', 'U'], default: 'U' },
    birth: { date: { type: String }, placeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Place' }, note: { type: String } },
    death: { date: { type: String }, placeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Place' }, note: { type: String } },
    otherEvents: [eventSchema],
    fatherId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Person', default: null },
    motherId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Person', default: null },
    partners: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Person' }],
    guardians: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Person' }],
    photos: [photoSchema],
    sources: [sourceSchema],
    notes: { type: String },
    search: {
        normalizedFullName: { type: String, index: true },
        tokens: [{ type: String, index: true }],
    },
    version: { type: Number, default: 0 },
    softDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
personSchema.pre('save', function (next) {
    const full = this.displayName || [...(this.givenNames || []), ...(this.familyNames || [])].join(' ').trim();
    const normalized = (0, normalization_1.normalizeText)(full);
    this.search = this.search || {};
    this.search.normalizedFullName = normalized;
    this.search.tokens = (0, normalization_1.tokenize)(full);
    next();
});
exports.PersonModel = mongoose_1.default.model('Person', personSchema);
