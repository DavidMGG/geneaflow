<template>
  <form class="register-form" @submit.prevent="onSubmit">
    <h2 class="form-title">Crear cuenta</h2>
    
    <div class="form-group">
      <label class="form-label">Nombre completo</label>
      <input 
        v-model="displayName" 
        type="text" 
        required 
        class="form-input"
      />
    </div>
    
    <div class="form-group">
      <label class="form-label">Email</label>
      <input 
        v-model="email" 
        type="email" 
        required 
        class="form-input"
      />
    </div>
    
    <div class="form-group">
      <label class="form-label">Contraseña</label>
      <input 
        v-model="password" 
        type="password" 
        required 
        minlength="8" 
        aria-describedby="pwd-help" 
        class="form-input"
      />
      <small id="pwd-help" class="form-help">Usa 12+ caracteres, combina mayúsculas y números.</small>
    </div>
    
    <div class="form-group">
      <label class="form-label">Confirmación</label>
      <input 
        v-model="confirm" 
        type="password" 
        required 
        :aria-invalid="confirmInvalid" 
        class="form-input"
        :class="{ 'form-input--error': confirmInvalid }"
      />
      <p v-if="confirmInvalid" class="form-error">Las contraseñas no coinciden</p>
    </div>
    
    <div class="form-group form-group--checkbox">
      <label class="checkbox-label">
        <input type="checkbox" v-model="terms" required class="checkbox-input" />
        <span class="checkbox-text">Acepto términos y condiciones</span>
      </label>
    </div>
    
    <button 
      class="btn-primary btn-primary--full" 
      :disabled="loading || confirmInvalid"
    >
      Registrarme
    </button>
    
    <p v-if="error" class="form-error">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const displayName = ref('');
const email = ref('');
const password = ref('');
const confirm = ref('');
const terms = ref(false);
const loading = ref(false);
const error = ref('');

const confirmInvalid = computed(() => confirm.value && confirm.value !== password.value);

async function onSubmit() {
  if (confirmInvalid.value) return;
  loading.value = true; error.value = '';
  try {
    await auth.register(displayName.value, email.value, password.value, true); // Siempre recordar en registro
    router.push('/dashboard');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al registrar';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Variables CSS locales para el componente */
:root {
  --form-spacing: 1.5rem;
  --form-spacing-sm: 1rem;
  --form-spacing-xs: 0.5rem;
  --form-radius: 0.25rem;
  --form-radius-sm: 0.75rem;
  --form-border-width: 1px;
  --form-transition: all 0.15s ease-in-out;
  
  /* Colores semánticos */
  --color-error: #b91c1c;
  --color-error-light: #fef2f2;
  --color-text-muted: #6b7280;
  --color-text-secondary: #9ca3af;
  --color-border-light: #e5e7eb;
  --color-border-medium: #d1d5db;
  --color-focus: #2563eb;
  --color-focus-light: #dbeafe;
}

/* Contenedor principal del formulario */
.register-form {
  max-width: 28rem; /* 448px */
  margin: 2.5rem auto 0;
  padding: 2rem;
  background: #ffffff;
  border: var(--form-border-width) solid var(--color-border-light);
  border-radius: var(--form-radius);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: var(--form-spacing);
  box-sizing: border-box;
}

/* Título del formulario */
.form-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.875rem; /* 30px */
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-primary);
  text-align: center;
  padding: 0;
}

/* Grupos de formulario */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--form-spacing-xs);
  margin: 0;
  padding: 0;
}

.form-group--checkbox {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--form-spacing-xs);
  margin: 0;
  padding: 0;
}

/* Labels */
.form-label {
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin: 0;
  padding: 0;
}

/* Inputs del formulario */
.form-input {
  padding: 0.875rem 1.25rem;
  border: var(--form-border-width) solid var(--color-border-medium);
  border-radius: var(--form-radius-sm);
  background: #ffffff;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.5;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  transition: var(--form-transition);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px var(--color-focus-light);
}

.form-input--error {
  border-color: var(--color-error);
}

.form-input--error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px var(--color-error-light);
}

/* Botón principal */
.btn-primary {
  padding: 0.875rem 1.75rem;
  background: var(--color-accent);
  color: #ffffff;
  border: none;
  border-radius: var(--form-radius-sm);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  cursor: pointer;
  transition: var(--form-transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  box-sizing: border-box;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:disabled {
  background: var(--color-text-secondary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary--full {
  width: 100%;
}

/* Checkbox personalizado */
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--form-spacing-xs);
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  padding: 0.5rem 0;
}

.checkbox-input {
  margin: 0;
  width: 1.125rem;
  height: 1.125rem;
  border: var(--form-border-width) solid var(--color-border-medium);
  border-radius: 0.375rem;
  background: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.checkbox-input:checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.checkbox-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-focus-light);
}

.checkbox-text {
  color: var(--color-text-muted);
  user-select: none;
}

/* Texto de ayuda */
.form-help {
  font-size: 0.75rem; /* 12px */
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0;
  padding: 0;
}

/* Mensajes de error */
.form-error {
  font-size: 0.875rem;
  color: var(--color-error);
  line-height: 1.4;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-error::before {
  content: "⚠";
  font-size: 0.75rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .register-form {
    background: #1f2937;
    border-color: #374151;
  }
  
  .form-title {
    color: #f9fafb;
  }
  
  .form-label {
    color: #d1d5db;
  }
  
  .form-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .form-input:focus {
    border-color: var(--color-focus);
    background: #374151;
  }
  
  .form-input--error {
    border-color: var(--color-error);
  }
  
  .checkbox-input {
    background: #374151;
    border-color: #4b5563;
  }
  
  .checkbox-input:checked {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }
  
  .checkbox-text {
    color: #d1d5db;
  }
  
  .form-help {
    color: #9ca3af;
  }
}

/* Responsive */
@media (max-width: 640px) {
  .register-form {
    margin: 1.5rem 1rem 0;
    padding: 1.5rem;
    box-sizing: border-box;
  }
  
  .form-title {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
  }
}
</style>
