"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.tokenize = tokenize;
function normalizeText(input) {
    return input
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9'\-\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function tokenize(input) {
    const n = normalizeText(input);
    return n ? Array.from(new Set(n.split(' '))) : [];
}
