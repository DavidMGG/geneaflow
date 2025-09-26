/**
 * Utilidades para manejo de cookies seguras
 */

interface CookieOptions {
  expires?: Date;
  maxAge?: number; // en segundos
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

/**
 * Establece una cookie con opciones de seguridad
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const {
    expires,
    maxAge,
    path = '/',
    domain,
    secure = true, // Por defecto seguro en producción
    sameSite = 'lax',
    httpOnly = false
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  }

  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure && window.location.protocol === 'https:') {
    cookieString += '; secure';
  }

  cookieString += `; samesite=${sameSite}`;

  if (httpOnly) {
    // Nota: httpOnly no se puede establecer desde JavaScript del cliente
    // Solo se puede establecer desde el servidor
    console.warn('httpOnly no se puede establecer desde el cliente');
  }

  document.cookie = cookieString;
}

/**
 * Obtiene el valor de una cookie
 */
export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    let c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Elimina una cookie
 */
export function deleteCookie(name: string, path: string = '/', domain?: string): void {
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
}

/**
 * Verifica si las cookies están habilitadas
 */
export function areCookiesEnabled(): boolean {
  try {
    const testCookie = 'test-cookie-' + Math.random();
    setCookie(testCookie, 'test', { maxAge: 1 });
    const exists = getCookie(testCookie) !== null;
    deleteCookie(testCookie);
    return exists;
  } catch (error) {
    return false;
  }
}

/**
 * Configuraciones predefinidas para diferentes tipos de cookies
 */
export const COOKIE_CONFIGS = {
  // Cookie de sesión que expira cuando se cierra el navegador
  session: {
    secure: true,
    sameSite: 'lax' as const,
    path: '/'
  },
  
  // Cookie persistente que dura 30 días
  persistent: {
    maxAge: 30 * 24 * 60 * 60, // 30 días en segundos
    secure: true,
    sameSite: 'lax' as const,
    path: '/'
  },
  
  // Cookie de autenticación con duración extendida (90 días)
  auth: {
    maxAge: 90 * 24 * 60 * 60, // 90 días en segundos
    secure: true,
    sameSite: 'lax' as const,
    path: '/'
  }
} as const;
