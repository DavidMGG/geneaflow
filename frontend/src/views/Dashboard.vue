<template>
  <section class="container">
    <div class="header">
      <h2 class="title">Mis árboles</h2>
      <div class="header-actions">
        <button class="btn-primary" @click="openModal = true">Crear nuevo árbol</button>
        <button class="btn-primary btn-import" @click="importTree">Importar</button>
      </div>
    </div>
    
    <div class="search-container">
      <input 
        placeholder="Buscar árbol..." 
        v-model="query" 
        class="search-input"
      />
    </div>

    <div class="grid">
      <div v-for="t in filtered" :key="t.id" class="card">
        <div class="card-content">
          <h3 class="card-title">{{ t.name }}</h3>
          <p class="card-description">{{ t.description || 'Sin descripción' }}</p>
          <div class="card-actions">
            <router-link class="btn-primary btn-card" :to="{ name: 'TreeView', params: { id: t.id } }">Abrir</router-link>
            <button class="btn-primary btn-card btn-edit" @click="edit(t)">Editar</button>
            <button class="btn-primary btn-card btn-delete" @click="confirmDelete(t)">Eliminar</button>
          </div>
        </div>
      </div>
    </div>

    <CreateTreeModal :open="openModal" @close="openModal=false" @created="fetchTrees" />
    
    <EditTreeModal 
      :open="editModal" 
      :tree="treeToEdit"
      @close="editModal = false; treeToEdit = null" 
      @updated="fetchTrees" 
    />
    
    <!-- Modal de confirmación para eliminar árbol -->
    <div v-if="deleteConfirmModal" class="modal-overlay" @click="deleteConfirmModal = false">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">Confirmar eliminación</h3>
        <p class="modal-message">
          ¿Estás seguro de que quieres eliminar el árbol <strong>"{{ treeToDelete?.name }}"</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="deleteConfirmModal = false">Cancelar</button>
          <button class="btn-danger" @click="deleteTree">Eliminar</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import CreateTreeModal from '../components/CreateTreeModal.vue';
import EditTreeModal from '../components/EditTreeModal.vue';

const query = ref('');
const trees = ref<{id:string;name:string;description?:string}[]>([]);
const openModal = ref(false);

// Variables para eliminación de árboles
const deleteConfirmModal = ref(false);
const treeToDelete = ref<{id:string;name:string;description?:string} | null>(null);

// Variables para edición de árboles
const editModal = ref(false);
const treeToEdit = ref<{id:string;name:string;description?:string} | null>(null);

async function fetchTrees() {
  const res = await api.get('/trees');
  trees.value = res.data;
}

onMounted(fetchTrees);

const filtered = computed(() => {
  const q = query.value.toLowerCase();
  if (!q) return trees.value;
  return trees.value.filter(t => t.name.toLowerCase().includes(q));
});

function importTree() { alert('Abrir importación'); }

function edit(tree: {id:string;name:string;description?:string}) {
  treeToEdit.value = tree;
  editModal.value = true;
}

// Funciones para eliminación de árboles
function confirmDelete(tree: {id:string;name:string;description?:string}) {
  treeToDelete.value = tree;
  deleteConfirmModal.value = true;
}

async function deleteTree() {
  if (!treeToDelete.value) return;
  
  try {
    // Verificar que el ID existe
    if (!treeToDelete.value.id) {
      throw new Error('ID del árbol no válido');
    }
    
    // Eliminar el árbol del backend
    const response = await api.delete(`/trees/${treeToDelete.value.id}`);
    
    // Verificar que la respuesta sea exitosa
    if (response.status >= 200 && response.status < 300) {
      // Actualizar la lista local
      trees.value = trees.value.filter(t => t.id !== treeToDelete.value!.id);
      
      // Cerrar modal
      deleteConfirmModal.value = false;
      treeToDelete.value = null;
    } else {
      throw new Error(`Respuesta del servidor: ${response.status}`);
    }
    
  } catch (error: any) {
    
    // Determinar el mensaje de error específico
    let errorMessage = 'Error desconocido al eliminar el árbol';
    
    if (error.response?.status === 404) {
      errorMessage = 'El árbol no fue encontrado';
    } else if (error.response?.status === 403) {
      errorMessage = 'No tienes permisos para eliminar este árbol';
    } else if (error.response?.status === 401) {
      errorMessage = 'No estás autenticado. Por favor, inicia sesión nuevamente';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Error del servidor. Por favor, intenta más tarde';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    alert(`Error al eliminar el árbol: ${errorMessage}`);
  }
}
</script>

<style scoped>
/* Header responsive */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-import {
  background: #10b981 !important;
}

/* Search container */
.search-container {
  margin-bottom: 20px;
}

.search-input {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 400px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Grid responsive */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* Card styles */
.card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  overflow: hidden;
}

.card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: var(--color-accent);
}

.card-content {
  padding: 20px;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1.3;
}

.card-description {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
  min-height: 2.8em; /* Mantener altura consistente */
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-card {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  font-size: 0.85rem;
  text-align: center;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-edit {
  background: #059669 !important;
}

.btn-edit:hover {
  background: #047857 !important;
}

.btn-delete {
  background: #dc2626 !important;
}

.btn-delete:hover {
  background: #b91c1c !important;
}

/* Modal de confirmación */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-title {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
}

.modal-message {
  margin: 0 0 24px 0;
  color: #6b7280;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-actions {
    justify-content: stretch;
  }
  
  .header-actions button {
    flex: 1;
    min-width: 0;
  }
  
  .title {
    text-align: center;
    font-size: 1.4rem;
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .btn-card {
    flex: none;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 12px;
  }
  
  .header {
    margin-bottom: 12px;
  }
  
  .search-container {
    margin-bottom: 16px;
  }
  
  .search-input {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
  
  .card-content {
    padding: 14px;
  }
  
  .card-title {
    font-size: 1.1rem;
  }
  
  .card-description {
    font-size: 0.85rem;
    margin-bottom: 12px;
  }
  
  .btn-card {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
}

@media (min-width: 1200px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }
  
  .card-content {
    padding: 24px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .card {
    background: #1f2937;
    border-color: #374151;
  }
  
  .card:hover {
    border-color: var(--color-accent);
  }
  
  .card-title {
    color: #f9fafb;
  }
  
  .card-description {
    color: #d1d5db;
  }
  
  .search-input {
    background: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .search-input:focus {
    border-color: var(--color-accent);
  }
  
  .search-input::placeholder {
    color: #9ca3af;
  }
  
  .modal-content {
    background: #1f2937;
  }
  
  .modal-title {
    color: #f9fafb;
  }
  
  .modal-message {
    color: #d1d5db;
  }
}
</style>
