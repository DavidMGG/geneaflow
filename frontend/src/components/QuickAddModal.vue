<template>
  <div v-if="open" class="modal-overlay" @click.self="close">
    <div class="modal-panel">
      <h3 class="modal-title">Agregar persona</h3>
      
      <div v-if="context && relType!=='root'" class="relationship-info">
        <p class="relationship-text">
        Relación con <strong>{{ context.anchor.displayName }}</strong>
      </p>
      </div>
      
      <div v-if="relType!=='root'" class="form-group">
        <label class="form-label">Tipo de relación</label>
        <select v-model="relType" class="form-select">
            <option value="child">Hijo/a</option>
            <option value="parent">Padre/Madre</option>
            <option value="partner">Pareja</option>
            <option value="sibling">Hermano/a</option>
          </select>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Primer nombre *</label>
          <input 
            v-model="firstName" 
            type="text"
            required
            class="form-input"
            placeholder="Primer nombre"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">Segundo nombre</label>
          <input 
            v-model="secondName" 
            type="text"
            class="form-input"
            placeholder="Segundo nombre"
          />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Primer apellido *</label>
          <input 
            v-model="firstLastName" 
            type="text"
            required
            class="form-input"
            placeholder="Primer apellido"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">Segundo apellido</label>
          <input 
            v-model="secondLastName" 
            type="text"
            class="form-input"
            placeholder="Segundo apellido"
          />
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Sexo</label>
        <select v-model="sex" class="form-select">
          <option value="U">No especificado</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">Año de nacimiento *</label>
        <input 
          v-model="birthYear" 
          type="text"
          required
          class="form-input"
          placeholder="Ej: 1990"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">Año de fallecimiento</label>
        <input 
          v-model="deathYear" 
          type="text"
          class="form-input"
          placeholder="Ej: 2020 o dejar vacío si está vivo"
        />
      </div>
      
      <div class="modal-actions">
        <button class="btn-secondary" @click="close">Cancelar</button>
        <button 
          class="btn-primary" 
          @click="create" 
          :disabled="!isFormValid || loading"
        >
          {{ loading ? 'Creando...' : 'Crear' }}
        </button>
      </div>
      
      <!-- Mostrar errores de validación -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <p v-for="error in validationErrors" :key="error" class="form-error">{{ error }}</p>
      </div>
      
      <!-- Mostrar errores del servidor -->
      <p v-if="error" class="form-error">{{ error }}</p>
    </div>
    
    <!-- Modal de override para edad implausible -->
    <div v-if="showOverrideModal" class="modal-overlay" @click.self="cancelOverride">
      <div class="modal-panel override-modal">
        <h3 class="modal-title">⚠️ Edad de padre/madre implausible</h3>
        
        <div class="override-content">
          <p class="override-message">
            La edad del padre/madre es menor a 12 años al momento del nacimiento del hijo/a.
            Esto puede indicar un error en las fechas o una situación especial.
          </p>
          
          <div class="age-info">
            <div class="age-item">
              <span class="age-label">Padre/Madre:</span>
              <span class="age-value">{{ parentAge }} años</span>
            </div>
            <div class="age-item">
              <span class="age-label">Hijo/a:</span>
              <span class="age-value">{{ childAge }} años</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Motivo para continuar (obligatorio):</label>
            <textarea 
              v-model="overrideReason" 
              class="form-textarea"
              placeholder="Ej: Error en fechas de nacimiento, adopción, etc."
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="cancelOverride">Cancelar</button>
          <button 
            class="btn-warning" 
            @click="confirmOverride"
            :disabled="!overrideReason.trim()"
          >
            Continuar con motivo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { api } from '../api';
import { validatePersonDataFrontend, ValidationMessages, validateParentAgePlausible } from '../utils/validation';

interface Context { type: 'child'|'parent'|'partner'|'sibling'|'root'; anchor: any; treeId: string }

const props = defineProps<{ open: boolean; context?: Context|null }>();
const emits = defineEmits<{ (e: 'close'): void; (e: 'created'): void }>();

const firstName = ref('');
const secondName = ref('');
const firstLastName = ref('');
const secondLastName = ref('');
const sex = ref('U');
const birthYear = ref('');
const deathYear = ref('');
const error = ref('');
const loading = ref(false);
const relType = ref<Context['type']>('child');

// Variables para el modal de override
const showOverrideModal = ref(false);
const overrideReason = ref('');
const parentAge = ref(0);
const childAge = ref(0);
const pendingRelationship = ref<any>(null);

// Validación en tiempo real
const validationErrors = computed(() => {
  const givenNames = [firstName.value.trim()].filter(Boolean);
  if (secondName.value.trim()) givenNames.push(secondName.value.trim());
  
  const familyNames = [firstLastName.value.trim()].filter(Boolean);
  if (secondLastName.value.trim()) familyNames.push(secondLastName.value.trim());
  
  const displayName = [...givenNames, ...familyNames].join(' ');
  
  const validation = validatePersonDataFrontend({
    givenNames,
    familyNames,
    displayName,
    birthDate: birthYear.value.trim() || undefined,
    deathDate: deathYear.value.trim() || undefined
  });
  
  return validation.errors;
});

const isFormValid = computed(() => {
  return validationErrors.value.length === 0 && 
         firstName.value.trim() && 
         firstLastName.value.trim() &&
         birthYear.value.trim();
});

watch(() => props.open, (o) => {
  if (o) {
    firstName.value=''; 
    secondName.value='';
    firstLastName.value='';
    secondLastName.value='';
    sex.value='U';
    birthYear.value='';
    deathYear.value='';
    error.value='';
    loading.value = false;
    relType.value = (props.context?.type || 'child') as Context['type'];
    showOverrideModal.value = false;
    overrideReason.value = '';
    pendingRelationship.value = null;
  }
});

function close() { emits('close'); }

// Función para validar edad y crear relación
async function validateAndCreateRelationship(createdPersonId: string): Promise<any> {
  const relationshipData = getRelationshipData(createdPersonId);
  
  // Si no hay datos de relación, retornar null
  if (!relationshipData) {
    return null;
  }
  
  // Solo validar edad para relaciones padre-hijo
  if (relationshipData.type === 'biological_parent') {
    const parentBirthDate = getParentBirthDate(relationshipData.fromId);
    const childBirthDate = birthYear.value.trim();
    
    if (parentBirthDate && childBirthDate) {
      const isPlausible = validateParentAgePlausible(parentBirthDate, childBirthDate, 12);
      
      if (!isPlausible) {
        // Calcular edades para mostrar en el modal
        const parentYear = parseInt(parentBirthDate.match(/\d{4}/)?.[0] || '0');
        const childYear = parseInt(childBirthDate.match(/\d{4}/)?.[0] || '0');
        parentAge.value = childYear - parentYear;
        childAge.value = 0; // Al nacer
        
        // Guardar datos de relación pendientes
        pendingRelationship.value = relationshipData;
        
        // Mostrar modal de override
        showOverrideModal.value = true;
        
        // Retornar null para pausar la creación
        return null;
      }
    }
  }
  
  return relationshipData;
}

// Función para obtener datos de relación según el tipo
function getRelationshipData(createdPersonId: string): any {
  if (relType.value === 'child') {
    return {
      type: 'biological_parent',
      fromId: props.context!.anchor.id,
      toId: createdPersonId
    };
  } else if (relType.value === 'parent') {
    return {
      type: 'biological_parent',
      fromId: createdPersonId,
      toId: props.context!.anchor.id
    };
  } else if (relType.value === 'partner') {
    return {
      type: 'partner',
      fromId: props.context!.anchor.id,
      toId: createdPersonId
    };
  } else if (relType.value === 'sibling') {
    // Para hermanos, retornar null ya que se manejan múltiples relaciones
    return null;
  }
  
  return null;
}

// Función para obtener fecha de nacimiento del padre/madre
function getParentBirthDate(parentId: string): string | null {
  // Si es el ancla (persona existente), usar su fecha de nacimiento
  if (parentId === props.context!.anchor.id) {
    return props.context!.anchor.birthYear || props.context!.anchor.birth?.date || null;
  }
  
  // Si es la persona recién creada, usar la fecha del formulario
  if (parentId === 'new') {
    return birthYear.value.trim() || null;
  }
  
  return null;
}

// Funciones para manejar el modal de override
function cancelOverride() {
  showOverrideModal.value = false;
  overrideReason.value = '';
  pendingRelationship.value = null;
  // No cerrar el modal principal, permitir al usuario corregir las fechas
}

async function confirmOverride() {
  if (!overrideReason.value.trim() || !pendingRelationship.value) return;
  
  try {
    // Crear la relación con el motivo de override
    const relationshipData = {
      ...pendingRelationship.value,
      overrideReason: overrideReason.value.trim()
    };
    
    await api.post(`/trees/${props.context!.treeId}/relationships`, relationshipData);
    
    // Limpiar y cerrar
    showOverrideModal.value = false;
    overrideReason.value = '';
    pendingRelationship.value = null;
    
    // Emitir evento de creación exitosa
    emits('created');
    close();
  } catch (error: any) {
    console.error('Error creando relación con override:', error);
    // Mostrar error en el modal principal
    error.value = error?.response?.data?.message || 'Error al crear la relación';
  }
}

async function create() {
  if (!isFormValid.value || !props.context) return;
  
  loading.value = true;
  error.value = '';
  
  let createdPersonId = null;
  
  try {
    // Normalizar nombres - solo agregar si no están vacíos
    const givenNames = [firstName.value.trim()];
    if (secondName.value.trim()) {
      givenNames.push(secondName.value.trim());
    }
    
    const familyNames = [firstLastName.value.trim()];
    if (secondLastName.value.trim()) {
      familyNames.push(secondLastName.value.trim());
    }
    
    // Crear displayName concatenando todos los nombres
    const displayName = [...givenNames, ...familyNames].join(' ');
    
    // 1) crear persona
    const p = await api.post(`/trees/${props.context.treeId}/persons`, { 
      givenNames, 
      familyNames, 
      displayName,
      sex: sex.value,
      birthYear: birthYear.value.trim() || null,
      deathYear: deathYear.value.trim() || null
    });
    createdPersonId = p.data.id;

    // 2) crear relación según selección (solo si no es 'root')
    if (relType.value !== 'root') {
      try {
        if (relType.value === 'sibling') {
          // Hermano: asignar los mismos padres disponibles del ancla
          const fatherId = props.context.anchor.fatherId;
          const motherId = props.context.anchor.motherId;
          
          if (fatherId) {
            await api.post(`/trees/${props.context.treeId}/relationships`, { 
              type: 'biological_parent', 
              fromId: fatherId, 
              toId: createdPersonId 
            });
          }
          if (motherId) {
            await api.post(`/trees/${props.context.treeId}/relationships`, { 
              type: 'biological_parent', 
              fromId: motherId, 
              toId: createdPersonId 
            });
          }
        } else {
          // Validar edad antes de crear la relación
          const relationshipData = await validateAndCreateRelationship(createdPersonId);
          if (relationshipData) {
            // Si hay datos de relación pendientes, crear la relación
            await api.post(`/trees/${props.context.treeId}/relationships`, relationshipData);
          }
        }
      } catch (relationshipError: any) {
        // Si falla la relación, eliminar la persona creada
        console.error('Error creando relación, eliminando persona:', relationshipError);
        try {
          await api.delete(`/trees/${props.context.treeId}/persons/${createdPersonId}`);
        } catch (deleteError) {
          console.error('Error eliminando persona huérfana:', deleteError);
        }
        throw relationshipError; // Re-lanzar el error original
      }
    }

    // Solo emitir 'created' y cerrar si todo fue exitoso
    emits('created');
    close();
  } catch (e: any) {
    console.error('Error creando persona:', e);
    error.value = e?.response?.data?.message || 'Error al crear la persona';
    // NO emitir 'created' ni cerrar el modal si hay error
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Overlay del modal */
.modal-overlay { 
  position: fixed; 
  inset: 0; 
  background: rgba(17, 24, 39, 0.6); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 9999;
  backdrop-filter: blur(4px);
}

/* Panel principal del modal - copiado de .login-form */
.modal-panel { 
  width: 60rem;
  max-width: 90rem; /* 1440px */
  margin: auto;
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
}

/* Título del modal - copiado de .form-title */
.modal-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.875rem; /* 30px */
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-primary);
  text-align: center;
  padding: 0;
}

/* Información de relación */
.relationship-info {
  margin: 0;
  padding: 0;
}

.relationship-text {
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  text-align: center;
}

.relationship-text strong {
  color: var(--color-primary);
  font-weight: 600;
}

/* Filas de formulario para campos en línea */
.form-row {
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0;
}

/* Grupos de formulario - copiado de .form-group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  flex: 1;
}

/* Labels - copiado de .form-label */
.form-label {
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  color: #374151;
  line-height: 1.4;
  margin: 0;
  padding: 0;
}

/* Inputs del formulario - copiado de .form-input */
.form-input {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #ffffff;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.5;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  transition: all 0.15s ease-in-out;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

/* Select - usando el mismo patrón que .form-input */
.form-select {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #ffffff;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.5;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  transition: all 0.15s ease-in-out;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-select option {
  padding: 0.5rem;
  background: #ffffff;
  color: var(--color-text);
}

/* Botones del modal - usando .btn-primary y .btn-secondary del login */
.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin: 0;
  padding: 0;
}

/* Mensajes de error - copiado de .form-error */
.form-error {
  color: #b91c1c;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: center;
}

.form-error::before {
  content: "⚠";
  font-size: 0.75rem;
}

/* Contenedor de errores de validación */
.validation-errors {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.validation-errors .form-error {
  justify-content: flex-start;
  text-align: left;
  background: rgba(185, 28, 28, 0.1);
  padding: 0.5rem;
  border-radius: 0.375rem;
  border-left: 3px solid #b91c1c;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .modal-panel {
    background: #1f2937;
    border-color: #374151;
  }
  
  .modal-title {
    color: #f9fafb;
  }
  
  .relationship-text {
    color: #d1d5db;
  }
  
  .relationship-text strong {
    color: #f9fafb;
  }
  
  .form-label {
    color: #d1d5db;
  }
  
  .form-input,
  .form-select {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .form-input:focus,
  .form-select:focus {
    border-color: var(--color-accent);
    background: #374151;
  }
  
  .form-input::placeholder {
    color: #9ca3af;
  }
  
  .form-select option {
    background: #374151;
    color: #f9fafb;
  }
}

/* Responsive - copiado del login */
@media (max-width: 1080px) {
  .modal-panel {
    width: 100%;
    max-width: 90rem;
    margin: 1.5rem 1rem 0;
    padding: 1.25rem;
    box-sizing: border-box;
  }
}

@media (max-width: 640px) {
  .modal-panel {
    margin: 1.5rem 1rem 0;
    padding: 1.25rem;
    box-sizing: border-box;
  }
  
  .modal-title {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}

/* Estilos para el modal de override */
.override-modal {
  max-width: 500px;
  width: 90%;
}

.override-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
  padding: 0;
}

.override-message {
  margin: 0;
  padding: 0;
  color: #374151;
  line-height: 1.5;
  font-size: 0.9rem;
}

.age-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.age-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.age-label {
  font-weight: 500;
  color: #374151;
}

.age-value {
  font-weight: 600;
  color: #dc2626;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #ffffff;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.5;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  transition: all 0.15s ease-in-out;
  resize: vertical;
  min-height: 80px;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea::placeholder {
  color: #9ca3af;
}

.btn-warning {
  background: #f59e0b;
  color: white;
  border: 1px solid #f59e0b;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s ease-in-out;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
  border-color: #d97706;
}

.btn-warning:disabled {
  background: #9ca3af;
  border-color: #9ca3af;
  cursor: not-allowed;
}

/* Dark mode para override modal */
@media (prefers-color-scheme: dark) {
  .override-message {
    color: #d1d5db;
  }
  
  .age-info {
    background: #374151;
    border-color: #4b5563;
  }
  
  .age-label {
    color: #d1d5db;
  }
  
  .age-value {
    color: #fca5a5;
  }
  
  .form-textarea {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .form-textarea:focus {
    border-color: var(--color-accent);
    background: #374151;
  }
  
  .form-textarea::placeholder {
    color: #9ca3af;
  }
}
</style>
