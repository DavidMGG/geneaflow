// Utilidades de validación para el frontend

/**
 * Valida caracteres especiales en nombres (permite tildes, ñ, apellidos compuestos)
 */
export function validateNameCharacters(name: string): boolean {
  if (!name || !name.trim()) return false;
  
  // Permite letras, espacios, guiones, apostrofes, puntos, tildes, ñ, y otros caracteres comunes en nombres
  const validNamePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-'\.]+$/;
  return validNamePattern.test(name.trim());
}

/**
 * Valida que el nombre completo no esté vacío
 */
export function validatePersonName(givenNames?: string[], familyNames?: string[], displayName?: string): boolean {
  const hasGivenNames = givenNames && givenNames.length > 0 && givenNames.some(name => name.trim());
  const hasFamilyNames = familyNames && familyNames.length > 0 && familyNames.some(name => name.trim());
  const hasDisplayName = displayName && displayName.trim();
  
  return !!(hasGivenNames || hasFamilyNames || hasDisplayName);
}

/**
 * Valida que el año de nacimiento sea obligatorio
 */
export function validateBirthYearRequired(birthDate?: string): boolean {
  if (!birthDate || !birthDate.trim()) {
    return false;
  }
  
  // Validar que sea un año válido
  const year = extractYear(birthDate);
  return !!(year && year >= 1000 && year <= new Date().getFullYear());
}

/**
 * Valida que la fecha de nacimiento sea anterior a la fecha de fallecimiento
 */
export function validateBirthBeforeDeath(birthDate?: string, deathDate?: string): boolean {
  if (!birthDate || !deathDate) return true;
  
  const birthYear = extractYear(birthDate);
  const deathYear = extractYear(deathDate);
  
  if (birthYear && deathYear) {
    return birthYear < deathYear;
  }
  
  return true;
}

/**
 * Valida años bisiestos (29 de febrero)
 */
export function validateLeapYear(dateStr: string): boolean {
  if (!dateStr) return true;
  
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
 * Valida que una persona no se asigne como su propio padre o madre
 */
export function validateNoSelfParent(childId: string, parentId: string): boolean {
  return childId !== parentId;
}

/**
 * Extrae el año de una fecha en formato string
 */
function extractYear(dateStr: string): number | null {
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Valida que una persona no tenga hijos antes de su nacimiento
 */
export function validateParentAgeBeforeChild(parentBirthDate?: string, childBirthDate?: string): boolean {
  if (!parentBirthDate || !childBirthDate) return true;
  
  const parentYear = extractYear(parentBirthDate);
  const childYear = extractYear(childBirthDate);
  
  if (parentYear && childYear) {
    return parentYear < childYear;
  }
  
  return true;
}

/**
 * Valida que un hijo no pueda ser mayor que su progenitor
 */
export function validateChildNotOlderThanParent(parentBirthDate?: string, childBirthDate?: string): boolean {
  if (!parentBirthDate || !childBirthDate) return true;
  
  const parentYear = extractYear(parentBirthDate);
  const childYear = extractYear(childBirthDate);
  
  if (parentYear && childYear) {
    return childYear < parentYear;
  }
  
  return true;
}

/**
 * Valida que la edad del padre/madre sea plausible (mínimo 12 años)
 */
export function validateParentAgePlausible(parentBirthDate?: string, childBirthDate?: string, minAge = 12): boolean {
  if (!parentBirthDate || !childBirthDate) return true;
  
  const parentYear = extractYear(parentBirthDate);
  const childYear = extractYear(childBirthDate);
  
  if (parentYear && childYear) {
    return parentYear + minAge <= childYear;
  }
  
  return true;
}

/**
 * Mensajes de error amigables para el usuario
 */
export const ValidationMessages = {
  NAME_REQUIRED: 'El nombre completo es obligatorio',
  BIRTH_YEAR_REQUIRED: 'El año de nacimiento es obligatorio',
  INVALID_BIRTH_YEAR: 'El año de nacimiento debe ser un año válido',
  INVALID_NAME_CHARACTERS: 'El nombre contiene caracteres no válidos',
  BIRTH_BEFORE_DEATH: 'La fecha de nacimiento debe ser anterior a la fecha de fallecimiento',
  INVALID_LEAP_YEAR: 'Fecha inválida (año bisiesto)',
  SELF_PARENT: 'Una persona no puede ser su propio padre o madre',
  PARENT_AGE_BEFORE_CHILD: 'Una persona no puede tener hijos antes de su nacimiento',
  CHILD_NOT_OLDER_THAN_PARENT: 'Un progenitor debe ser mayor que su hijo',
  PARENT_AGE_IMPLAUSIBLE: 'La edad del padre/madre es implausible (mínimo 12 años)',
  SAME_GENDER_PARTNERS: 'Una persona no puede tener pareja del mismo género',
  SAME_GENDER_PARENTS: 'Los padres no pueden ser del mismo género',
  MAX_TWO_BIOLOGICAL_PARENTS: 'Máximo 2 progenitores biológicos',
  GENEALOGICAL_CYCLE: 'Asignación crea un ciclo genealógico',
  BIDIRECTIONAL_RELATIONSHIP: 'Las relaciones deben ser bidireccionales',
  PERSON_NOT_FOUND: 'Persona no encontrada',
  DUPLICATE_PERSON: 'Ya existe una persona con el mismo nombre y fecha de nacimiento'
};

/**
 * Valida todos los aspectos de una persona en el frontend
 */
export function validatePersonDataFrontend(personData: {
  givenNames?: string[];
  familyNames?: string[];
  displayName?: string;
  birthDate?: string;
  deathDate?: string;
  fatherId?: string;
  motherId?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. Validaciones de identidad
  if (!validatePersonName(personData.givenNames, personData.familyNames, personData.displayName)) {
    errors.push(ValidationMessages.NAME_REQUIRED);
  }
  
  // Validar año de nacimiento obligatorio
  if (!validateBirthYearRequired(personData.birthDate)) {
    errors.push(ValidationMessages.BIRTH_YEAR_REQUIRED);
  }
  
  // Validar caracteres en nombres
  const allNames = [
    ...(personData.givenNames || []),
    ...(personData.familyNames || []),
    personData.displayName || ''
  ].filter(Boolean);
  
  for (const name of allNames) {
    if (!validateNameCharacters(name)) {
      errors.push(`${ValidationMessages.INVALID_NAME_CHARACTERS}: "${name}"`);
    }
  }
  
  // 2. Validaciones de fechas
  if (!validateBirthBeforeDeath(personData.birthDate, personData.deathDate)) {
    errors.push(ValidationMessages.BIRTH_BEFORE_DEATH);
  }
  
  if (personData.birthDate && !validateLeapYear(personData.birthDate)) {
    errors.push(`${ValidationMessages.INVALID_LEAP_YEAR}: nacimiento`);
  }
  
  if (personData.deathDate && !validateLeapYear(personData.deathDate)) {
    errors.push(`${ValidationMessages.INVALID_LEAP_YEAR}: fallecimiento`);
  }
  
  // 3. Validaciones de progenitores
  if (personData.fatherId && !validateNoSelfParent('', personData.fatherId)) {
    errors.push(ValidationMessages.SELF_PARENT);
  }
  
  if (personData.motherId && !validateNoSelfParent('', personData.motherId)) {
    errors.push(ValidationMessages.SELF_PARENT);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
