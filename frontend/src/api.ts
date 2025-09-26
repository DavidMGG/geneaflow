import axios from 'axios';
import { getCookie } from './utils/cookies';

export const api = axios.create({ baseURL: 'http://localhost:4000/api' });

// Interceptor para agregar el token de autorización
api.interceptors.request.use((config) => {
	const token = getCookie('accessToken') || localStorage.getItem('accessToken');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Interceptor para manejar respuestas y renovación de tokens
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		
		// Si el error es 401 (no autorizado) y no hemos intentado renovar el token
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			
			try {
				// Importar dinámicamente el store para evitar dependencias circulares
				const { useAuthStore } = await import('./stores/auth');
				const authStore = useAuthStore();
				
				// Intentar renovar el token
				const refreshed = await authStore.refreshAccessToken();
				
				if (refreshed) {
					// Reintentar la petición original con el nuevo token
					const newToken = getCookie('accessToken') || localStorage.getItem('accessToken');
					originalRequest.headers.Authorization = `Bearer ${newToken}`;
					return api(originalRequest);
				}
			} catch (refreshError) {
				console.error('Error refreshing token:', refreshError);
				// Si falla la renovación, redirigir al login
				window.location.href = '/login';
			}
		}
		
		return Promise.reject(error);
	}
);
