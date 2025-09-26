import { PersonModel } from '../models/person.model';
import mongoose from 'mongoose';

type ObjectId = mongoose.Types.ObjectId | string;

// ===== VALIDACIONES DE IDENTIDAD DE PERSONAS =====

/**
 * Valida que el nombre completo no esté vacío
 */
export function validatePersonName(givenNames?: string[], familyNames?: string[], displayName?: string): void {
	const hasGivenNames = givenNames && givenNames.length > 0 && givenNames.some(name => name.trim());
	const hasFamilyNames = familyNames && familyNames.length > 0 && familyNames.some(name => name.trim());
	const hasDisplayName = displayName && displayName.trim();
	
	if (!hasGivenNames && !hasFamilyNames && !hasDisplayName) {
		throw new Error('El nombre completo es obligatorio');
	}
}

/**
 * Valida que el año de nacimiento sea obligatorio
 */
export function validateBirthYearRequired(birthDate?: string): void {
	if (!birthDate || !birthDate.trim()) {
		throw new Error('El año de nacimiento es obligatorio');
	}
	
	// Validar que sea un año válido
	const year = extractYear(birthDate);
	if (!year || year < 1000 || year > new Date().getFullYear()) {
		throw new Error('El año de nacimiento debe ser un año válido');
	}
}

/**
 * Valida caracteres especiales en nombres (permite tildes, ñ, apellidos compuestos)
 */
export function validateNameCharacters(name: string): boolean {
	// Permite letras, espacios, guiones, apostrofes, puntos, tildes, ñ, y otros caracteres comunes en nombres
	const validNamePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-'\.]+$/;
	return validNamePattern.test(name);
}

/**
 * Valida que no exista otra persona con el mismo nombre y fecha de nacimiento
 */
export async function validateUniquePerson(
	treeId: string, 
	givenNames?: string[], 
	familyNames?: string[], 
	displayName?: string, 
	birthDate?: string,
	excludeId?: string
): Promise<void> {
	const fullName = displayName || [...(givenNames || []), ...(familyNames || [])].join(' ').trim();
	
	if (!fullName) return; // Si no hay nombre, no validar unicidad
	
	const query: any = {
		treeId,
		softDeleted: { $ne: true }, // Excluir registros eliminados
		$or: [
			{ displayName: fullName },
			{ 
				givenNames: { $in: givenNames || [] },
				familyNames: { $in: familyNames || [] }
			}
		]
	};
	
	if (birthDate) {
		query['birth.date'] = birthDate;
	}
	
	if (excludeId) {
		query._id = { $ne: excludeId };
	}
	
	const existingPerson = await PersonModel.findOne(query);
	if (existingPerson) {
		throw new Error(`Ya existe una persona con el nombre "${fullName}"${birthDate ? ` nacida en ${birthDate}` : ''}`);
	}
}

// ===== VALIDACIONES DE PROGENITORES =====

/**
 * Valida que una persona no se asigne como su propio padre o madre
 */
export function validateNoSelfParent(childId: ObjectId, parentId: ObjectId): void {
	if (String(childId) === String(parentId)) {
		throw new Error('Una persona no puede ser su propio padre o madre');
	}
}

export async function assertMaxTwoBiologicalParents(childId: ObjectId): Promise<void> {
	const child = await PersonModel.findOne({ _id: childId, softDeleted: { $ne: true } }).select('fatherId motherId');
	if (!child) throw new Error('Persona no encontrada');
	const parents = [child.fatherId, child.motherId].filter(Boolean);
	if (parents.length >= 2) throw new Error('Máximo 2 progenitores biológicos');
}

// ===== VALIDACIONES DE FECHAS =====

/**
 * Valida que la fecha de nacimiento sea anterior a la fecha de fallecimiento
 */
export function validateBirthBeforeDeath(birthDate?: string, deathDate?: string): void {
	if (!birthDate || !deathDate) return;
	
	const birthYear = extractYear(birthDate);
	const deathYear = extractYear(deathDate);
	
	if (birthYear && deathYear && birthYear >= deathYear) {
		throw new Error('La fecha de nacimiento debe ser anterior a la fecha de fallecimiento');
	}
}

/**
 * Valida que una persona no tenga hijos antes de su nacimiento
 */
export function validateParentAgeBeforeChild(parentBirthDate?: string, childBirthDate?: string): void {
	if (!parentBirthDate || !childBirthDate) return;
	
	const parentYear = extractYear(parentBirthDate);
	const childYear = extractYear(childBirthDate);
	
	if (parentYear && childYear && parentYear >= childYear) {
		throw new Error('Una persona no puede tener hijos antes de su nacimiento');
	}
}

/**
 * Valida que un hijo no pueda ser mayor que su progenitor
 */
export function validateChildNotOlderThanParent(parentBirthDate?: string, childBirthDate?: string): void {
	if (!parentBirthDate || !childBirthDate) return;
	
	const parentYear = extractYear(parentBirthDate);
	const childYear = extractYear(childBirthDate);
	
	if (parentYear && childYear && parentYear >= childYear) {
		throw new Error('Un progenitor debe ser mayor que su hijo');
	}
}

/**
 * Valida años bisiestos (29 de febrero)
 */
export function validateLeapYear(dateStr: string): boolean {
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return false;
	
	// Si es 29 de febrero, verificar que el año sea bisiesto
	if (date.getMonth() === 1 && date.getDate() === 29) {
		const year = date.getFullYear();
		return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
	}
	
	return true;
}

/**
 * Extrae el año de una fecha en formato string
 */
function extractYear(dateStr: string): number | null {
	const match = dateStr.match(/(\d{4})/);
	return match ? parseInt(match[1]) : null;
}

// ===== VALIDACIONES DE RELACIONES =====

/**
 * Valida que las relaciones sean bidireccionales y coherentes
 */
export async function validateBidirectionalRelationship(
	personAId: ObjectId, 
	personBId: ObjectId, 
	relationshipType: 'parent' | 'partner'
): Promise<void> {
	const personA = await PersonModel.findOne({ _id: personAId, softDeleted: { $ne: true } });
	const personB = await PersonModel.findOne({ _id: personBId, softDeleted: { $ne: true } });
	
	if (!personA || !personB) {
		throw new Error('Una o ambas personas no existen');
	}
	
	if (relationshipType === 'parent') {
		// Verificar que si A es padre de B, entonces B es hijo de A
		const isAParentOfB = String(personA._id) === String(personB.fatherId) || String(personA._id) === String(personB.motherId);
		const isBParentOfA = String(personB._id) === String(personA.fatherId) || String(personB._id) === String(personA.motherId);
		
		if (isAParentOfB && isBParentOfA) {
			throw new Error('Una persona no puede ser padre e hijo de otra persona al mismo tiempo');
		}
	}
}

/**
 * Valida que una persona no pueda tener pareja del mismo género
 */
export async function validateDifferentGenderPartners(personAId: ObjectId, personBId: ObjectId): Promise<void> {
	const personA = await PersonModel.findOne({ _id: personAId, softDeleted: { $ne: true } }).select('sex');
	const personB = await PersonModel.findOne({ _id: personBId, softDeleted: { $ne: true } }).select('sex');
	
	if (!personA || !personB) {
		throw new Error('Una o ambas personas no existen');
	}
	
	// Solo validar si ambos tienen género definido y no es 'U' (no especificado)
	if (personA.sex && personB.sex && personA.sex !== 'U' && personB.sex !== 'U') {
		if (personA.sex === personB.sex) {
			throw new Error('Una persona no puede tener pareja del mismo género');
		}
	}
}

/**
 * Valida que los padres no puedan ser del mismo género
 */
export async function validateDifferentGenderParents(childId: ObjectId): Promise<void> {
	const child = await PersonModel.findOne({ _id: childId, softDeleted: { $ne: true } }).select('fatherId motherId');
	
	if (!child) {
		throw new Error('Persona no encontrada');
	}
	
	// Solo validar si tiene ambos padres
	if (!child.fatherId || !child.motherId) {
		return; // No hay problema si solo tiene un padre
	}
	
	const [father, mother] = await Promise.all([
		PersonModel.findOne({ _id: child.fatherId, softDeleted: { $ne: true } }).select('sex'),
		PersonModel.findOne({ _id: child.motherId, softDeleted: { $ne: true } }).select('sex')
	]);
	
	if (!father || !mother) {
		throw new Error('Uno o ambos padres no existen');
	}
	
	// Solo validar si ambos tienen género definido y no es 'U' (no especificado)
	if (father.sex && mother.sex && father.sex !== 'U' && mother.sex !== 'U') {
		if (father.sex === mother.sex) {
			throw new Error('Los padres no pueden ser del mismo género');
		}
	}
}

export async function assertNoCycleOnAssignParent(childId: ObjectId, candidateParentId: ObjectId): Promise<void> {
	// Subir por ancestros desde candidateParent hasta raíces para verificar si aparece childId
	const visited = new Set<string>();
	const queue: string[] = [String(candidateParentId)];
	const target = String(childId);
	let depth = 0;
	while (queue.length && depth < 200) {
		const current = queue.shift()!;
		if (visited.has(current)) continue;
		visited.add(current);
		if (current === target) {
			throw new Error('Asignación crea un ciclo genealógico');
		}
		const p = await PersonModel.findById(current).select('fatherId motherId');
		if (!p) continue;
		if (p.fatherId) queue.push(String(p.fatherId));
		if (p.motherId) queue.push(String(p.motherId));
		depth++;
	}
}

// ===== VALIDACIONES DE ESTRUCTURA DEL ÁRBOL =====

/**
 * Valida que cada persona pertenezca a un único árbol genealógico
 */
export async function validateSingleTreeMembership(personId: ObjectId, treeId: string): Promise<void> {
	const person = await PersonModel.findById(personId).select('treeId');
	if (!person) throw new Error('Persona no encontrada');
	
	if (String(person.treeId) !== String(treeId)) {
		throw new Error('La persona no pertenece al árbol especificado');
	}
}

/**
 * Valida que no haya ramas cruzadas incoherentes
 */
export async function validateNoCrossedBranches(treeId: string): Promise<void> {
	// Esta validación es compleja y requeriría un análisis más profundo del árbol
	// Por ahora, implementamos una validación básica
	const persons = await PersonModel.find({ treeId }).select('fatherId motherId partners');
	
	// Verificar que no haya relaciones circulares complejas
	for (const person of persons) {
		if (person.partners && person.partners.length > 0) {
			for (const partnerId of person.partners) {
				const partner = persons.find(p => String(p._id) === String(partnerId));
				if (partner && partner.partners) {
					const isReciprocal = partner.partners.some(p => String(p) === String(person._id));
					if (!isReciprocal) {
						throw new Error(`Relación de pareja no bidireccional entre ${person._id} y ${partnerId}`);
					}
				}
			}
		}
	}
}

// ===== FUNCIÓN PRINCIPAL DE VALIDACIÓN =====

/**
 * Valida todos los aspectos de una persona antes de crearla o actualizarla
 */
export async function validatePersonData(
	personData: {
		givenNames?: string[];
		familyNames?: string[];
		displayName?: string;
		birthDate?: string;
		deathDate?: string;
		fatherId?: ObjectId;
		motherId?: ObjectId;
		partners?: ObjectId[];
	},
	treeId: string,
	excludeId?: string
): Promise<void> {
	// 1. Validaciones de identidad
	validatePersonName(personData.givenNames, personData.familyNames, personData.displayName);
	
	// Validar año de nacimiento obligatorio
	validateBirthYearRequired(personData.birthDate);
	
	// Validar caracteres en nombres
	const allNames = [
		...(personData.givenNames || []),
		...(personData.familyNames || []),
		personData.displayName || ''
	].filter(Boolean);
	
	for (const name of allNames) {
		if (!validateNameCharacters(name)) {
			throw new Error(`El nombre "${name}" contiene caracteres no válidos`);
		}
	}
	
	// Validar unicidad
	await validateUniquePerson(
		treeId,
		personData.givenNames,
		personData.familyNames,
		personData.displayName,
		personData.birthDate,
		excludeId
	);
	
	// 2. Validaciones de fechas
	validateBirthBeforeDeath(personData.birthDate, personData.deathDate);
	
	if (personData.birthDate && !validateLeapYear(personData.birthDate)) {
		throw new Error('Fecha de nacimiento inválida (año bisiesto)');
	}
	
	if (personData.deathDate && !validateLeapYear(personData.deathDate)) {
		throw new Error('Fecha de fallecimiento inválida (año bisiesto)');
	}
	
	// 3. Validaciones de progenitores
	if (personData.fatherId) {
		validateNoSelfParent(excludeId || '', personData.fatherId);
		// Validar que el hijo no sea mayor que el padre
		const father = await PersonModel.findById(personData.fatherId).select('birth');
		if (father?.birth?.date) {
			validateChildNotOlderThanParent(father.birth.date, personData.birthDate);
		}
	}
	
	if (personData.motherId) {
		validateNoSelfParent(excludeId || '', personData.motherId);
		// Validar que el hijo no sea mayor que la madre
		const mother = await PersonModel.findById(personData.motherId).select('birth');
		if (mother?.birth?.date) {
			validateChildNotOlderThanParent(mother.birth.date, personData.birthDate);
		}
	}
	
	// 4. Validaciones de relaciones
	if (personData.fatherId && personData.motherId) {
		await validateBidirectionalRelationship(personData.fatherId, personData.motherId, 'parent');
	}
	
	// 5. Validaciones de parejas
	if (personData.partners && personData.partners.length > 0) {
		const currentPerson = await PersonModel.findById(excludeId).select('sex');
		if (currentPerson) {
			for (const partnerId of personData.partners) {
				await validateDifferentGenderPartners(excludeId || '', partnerId);
			}
		}
	}
}
