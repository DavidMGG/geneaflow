<template>
  <section>
    <h1 style="font-size:32px;margin:0 0 8px">Crea y comparte tu árbol genealógico</h1>
    <p style="margin:0 0 16px">Interfaz intuitiva, colaboración y exportación GEDCOM/PDF.</p>
    <div style="display:flex; gap:12px; margin: 16px 0;">
      <router-link to="/register" class="btn-primary">Crear cuenta</router-link>
      <router-link to="/login" class="btn-primary" style="background: var(--color-accent);">Iniciar sesión</router-link>
      <button class="btn-primary" @click="openDemo" aria-label="Ver demo">Ver demo</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
function openDemo() {
  router.push({ name: 'TreeView', params: { id: 'demo' } });
}
</script>
