// Auth Guard - Middleware para proteger rutas
// Importar en cada página protegida para verificar autenticación

import { openAuthModal } from '../components/AuthModal.js';
import api from './api.js';

class AuthGuard {
  constructor() {
    this.checkAuth();
  }

  checkAuth() {
    // Verificar si el usuario está autenticado
    if (!api.isAuthenticated()) {
      openAuthModal('login');
      return false;
    }

    return true;
  }

  getUserData() {
    return api.getUserData();
  }

  logout() {
    api.logout();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
    }
  }
}

// Crear instancia global
const authGuard = new AuthGuard();

export default authGuard;

// También hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.authGuard = authGuard;
}
