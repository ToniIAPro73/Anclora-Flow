// Auth Guard - Middleware para proteger rutas
// Importar en cada página protegida para verificar autenticación

import api from './api.js';

class AuthGuard {
  constructor() {
    this.checkAuth();
  }

  checkAuth() {
    // Verificar si el usuario está autenticado
    if (!api.isAuthenticated()) {
      // Guardar la URL actual para redirigir después del login
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirect_after_login', currentPath);

      // Redirigir a login
      window.location.href = '/login.html';
      return false;
    }

    return true;
  }

  getUserData() {
    return api.getUserData();
  }

  logout() {
    api.logout();
  }
}

// Crear instancia global
const authGuard = new AuthGuard();

export default authGuard;

// También hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.authGuard = authGuard;
}
