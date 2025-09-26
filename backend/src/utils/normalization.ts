export function normalizeText(input: string): string {
	return input
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9'\-\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function tokenize(input: string): string[] {
	const n = normalizeText(input);
	return n ? Array.from(new Set(n.split(' '))) : [];
}
