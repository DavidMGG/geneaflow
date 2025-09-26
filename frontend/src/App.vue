<template>
  <div>
    <header class="header">
      <div class="header-left">
        <strong>GeneaFlow</strong>
      </div>
      <nav class="header-nav">
        <router-link to="/" class="nav-link">Inicio</router-link>
        <template v-if="!authStore.isAuthenticated">
          <router-link to="/login" class="nav-link">Entrar</router-link>
          <router-link to="/register" class="nav-link">Registro</router-link>
        </template>
        <template v-else>
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        </template>
      </nav>
    </header>
    
    <!-- Botón de cerrar sesión en esquina inferior izquierda -->
    <button 
      v-if="authStore.isAuthenticated" 
      @click="logout" 
      class="logout-btn-bottom"
      title="Cerrar sesión"
    >
      Cerrar sesión
    </button>
    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

function logout() {
  authStore.logout();
  router.push('/');
}
</script>

<style>
.nav-link { 
  text-decoration: none; 
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease-in-out;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-primary);
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-nav {
  display: flex;
  gap: 12px;
}

.logout-btn-bottom {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.logout-btn-bottom:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.logout-btn-bottom:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>