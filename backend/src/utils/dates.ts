export function parseYear(dateStr?: string): number | null {
	if (!dateStr) return null;
	const m = dateStr.match(/(\d{4})/);
	return m ? Number(m[1]) : null;
}

export function isParentAgePlausible(parentBirth?: string, childBirth?: string, minAge = 12): boolean {
	const p = parseYear(parentBirth);
	const c = parseYear(childBirth);
	if (p == null || c == null) return true; // desconocido => permisivo con warning en UI
	return p + minAge <= c;
}
