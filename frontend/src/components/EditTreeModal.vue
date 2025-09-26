<template>
  <div v-if="open" class="modal-overlay" @click.self="close">
    <div class="modal-panel">
      <h3 class="modal-title">Editar árbol</h3>
      
      <div class="form-group">
        <label class="form-label">Nombre</label>
        <input 
          v-model="name" 
          type="text"
          required
          class="form-input"
          placeholder="Nombre del árbol genealógico"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea 
          v-model="description" 
          class="form-textarea"
          placeholder="Descripción opcional del árbol"
          rows="3"
        ></textarea>
      </div>
      
      <div class="modal-actions">
        <button class="btn-secondary" @click="close">Cancelar</button>
        <button 
          class="btn-primary" 
          @click="update" 
          :disabled="!name || loading"
        >
          {{ loading ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
      
      <p v-if="error" class="form-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '../api';

const props = defineProps<{ 
  open: boolean;
  tree: { id: string; name: string; description?: string } | null;
}>();

const emits = defineEmits<{ 
  (e: 'close'): void; 
  (e: 'updated'): void 
}>();

const name = ref('');
const description = ref('');
const error = ref('');
const loading = ref(false);

watch(() => props.open, (o) => { 
  if (o && props.tree) { 
    name.value = props.tree.name || ''; 
    description.value = props.tree.description || ''; 
    error.value = '';
    loading.value = false;
  } 
});

function close() { 
  emits('close'); 
}

async function update() {
  if (!name.value.trim() || !props.tree) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    await api.put(`/trees/${props.tree.id}`, { 
      name: name.value.trim(), 
      description: description.value.trim() 
    });
    emits('updated');
    close();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al actualizar el árbol';
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
  width: 50rem;
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

/* Grupos de formulario - copiado de .form-group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
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

/* Textarea - usando el mismo patrón que .form-input */
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
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea::placeholder {
  color: #9ca3af;
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

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .modal-panel {
    background: #1f2937;
    border-color: #374151;
  }
  
  .modal-title {
    color: #f9fafb;
  }
  
  .form-label {
    color: #d1d5db;
  }
  
  .form-input,
  .form-textarea {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .form-input:focus,
  .form-textarea:focus {
    border-color: var(--color-accent);
    background: #374151;
  }
  
  .form-input::placeholder,
  .form-textarea::placeholder {
    color: #9ca3af;
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
  
  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
