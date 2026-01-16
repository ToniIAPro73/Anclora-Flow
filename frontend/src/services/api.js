// API Service - Versión restaurada para compatibilidad
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class APIService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, data };
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      throw { status: 0, data: { error: 'Network error' } };
    }
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }

    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }

    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Métodos genéricos
  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

const api = new APIService();
export default api;
