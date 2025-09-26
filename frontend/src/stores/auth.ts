import { defineStore } from 'pinia';
import { api } from '../api';
import { getCookie, setCookie, deleteCookie, COOKIE_CONFIGS } from '../utils/cookies';

export const useAuthStore = defineStore('auth', {
	state: () => ({ 
		accessToken: getCookie('accessToken') || '', 
		refreshToken: getCookie('refreshToken') || '', 
		userId: getCookie('userId') || '',
		rememberMe: getCookie('rememberMe') === 'true' || false
	}),
	
	getters: {
		isAuthenticated: (state) => !!state.accessToken && !!state.userId,
		userDisplayName: (state) => getCookie('userDisplayName') || '',
	},
	
	actions: {
		setSession(userId: string, accessToken: string, refreshToken: string, displayName?: string, rememberMe: boolean = false) {
			this.userId = userId; 
			this.accessToken = accessToken; 
			this.refreshToken = refreshToken;
			this.rememberMe = rememberMe;
			
			// Configuración de cookies basada en "recordar sesión"
			const cookieConfig = rememberMe ? COOKIE_CONFIGS.auth : COOKIE_CONFIGS.persistent;
			
			// Guardar tokens y datos del usuario en cookies
			setCookie('userId', userId, cookieConfig);
			setCookie('accessToken', accessToken, cookieConfig);
			setCookie('refreshToken', refreshToken, cookieConfig);
			setCookie('rememberMe', rememberMe.toString(), cookieConfig);
			
			if (displayName) {
				setCookie('userDisplayName', displayName, cookieConfig);
			}
			
			// También mantener en localStorage como fallback
			localStorage.setItem('userId', userId);
			localStorage.setItem('accessToken', accessToken);
			localStorage.setItem('refreshToken', refreshToken);
			localStorage.setItem('rememberMe', rememberMe.toString());
			if (displayName) {
				localStorage.setItem('userDisplayName', displayName);
			}
		},
		
		async login(email: string, password: string, rememberMe: boolean = false) {
			const res = await api.post('/auth/login', { email, password });
			this.setSession(
				res.data.userId, 
				res.data.accessToken, 
				res.data.refreshToken, 
				res.data.displayName || res.data.email,
				rememberMe
			);
		},
		
		async register(displayName: string, email: string, password: string, rememberMe: boolean = false) {
			const res = await api.post('/auth/register', { displayName, email, password });
			this.setSession(
				res.data.userId, 
				res.data.accessToken, 
				res.data.refreshToken, 
				displayName,
				rememberMe
			);
		},
		
		logout() {
			// Eliminar cookies
			deleteCookie('userId');
			deleteCookie('accessToken');
			deleteCookie('refreshToken');
			deleteCookie('userDisplayName');
			deleteCookie('rememberMe');
			
			// Eliminar localStorage
			localStorage.removeItem('userId');
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('userDisplayName');
			localStorage.removeItem('rememberMe');
			
			// Limpiar estado
			this.userId = '';
			this.accessToken = '';
			this.refreshToken = '';
			this.rememberMe = false;
		},
		
		// Método para verificar y renovar tokens si es necesario
		async refreshAccessToken() {
			if (!this.refreshToken) {
				this.logout();
				return false;
			}
			
			try {
				const res = await api.post('/auth/refresh', { 
					refreshToken: this.refreshToken 
				});
				
				this.setSession(
					this.userId, 
					res.data.accessToken, 
					res.data.refreshToken || this.refreshToken,
					this.userDisplayName,
					this.rememberMe
				);
				
				return true;
			} catch (error) {
				console.error('Error refreshing token:', error);
				this.logout();
				return false;
			}
		},
		
		// Método para inicializar la sesión desde cookies al cargar la app
		initializeSession() {
			const userId = getCookie('userId');
			const accessToken = getCookie('accessToken');
			const refreshToken = getCookie('refreshToken');
			const rememberMe = getCookie('rememberMe') === 'true';
			
			if (userId && accessToken && refreshToken) {
				this.userId = userId;
				this.accessToken = accessToken;
				this.refreshToken = refreshToken;
				this.rememberMe = rememberMe;
				return true;
			}
			
			return false;
		}
	},
});
