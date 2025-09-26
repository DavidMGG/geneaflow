import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Inicializar la sesión desde cookies al cargar la aplicación
const authStore = useAuthStore();
authStore.initializeSession();

app.mount('#app');
