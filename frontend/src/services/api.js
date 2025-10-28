// API Service - Comunicación centralizada con el backend
// Base URL del backend

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8020/api';

// Clase para manejar errores de API
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Servicio principal de API
class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = this.getToken();
  }

  // Obtener token del localStorage
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // Guardar token en localStorage
  setToken(token) {
    localStorage.setItem('auth_token', token);
    this.token = token;
  }

  // Eliminar token del localStorage
  clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.token = null;
  }

  // Obtener datos del usuario
  getUserData() {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  // Guardar datos del usuario
  setUserData(userData) {
    localStorage.setItem('user_data', JSON.stringify(userData));
  }

  // Aplicar sesión recibida desde el backend
  applySession(payload) {
    if (!payload) {
      return;
    }

    if (payload.token) {
      this.setToken(payload.token);
    }

    if (payload.user) {
      this.setUserData(payload.user);
    }
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.token;
  }

  // Headers por defecto
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Método genérico para hacer peticiones
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.includeAuth !== false),
    };

    try {
      const response = await fetch(url, config);

      // Si no hay contenido (204), retornar null
      if (response.status === 204) {
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        if (
          (response.status === 401 || response.status === 403) &&
          options.includeAuth !== false
        ) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
          }
        }

        throw new APIError(
          data.error || 'Error en la petición',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Error de red o parsing
      throw new APIError(
        error.message || 'Error de conexión con el servidor',
        0,
        null
      );
    }
  }

  // Métodos HTTP convenientes
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // === AUTENTICACIÓN ===

  async register(userData) {
    const response = await this.post('/auth/register', userData, { includeAuth: false });
    this.applySession(response);
    return response;
  }

  async login(email, password) {
    const response = await this.post('/auth/login', { email, password }, { includeAuth: false });
    this.applySession(response);
    return response;
  }

  logout() {
    this.clearToken();
  }

  async getCurrentUser() {
    const response = await this.get('/auth/me');
    if (response) {
      this.setUserData(response);
    }
    return response;
  }

  async resendVerification(email) {
    return this.post('/auth/resend-verification', { email }, { includeAuth: false });
  }

  async verifyEmail(token) {
    const response = await this.post('/auth/verify-email', { token }, { includeAuth: false });
    this.applySession(response);
    return response;
  }

  async requestPasswordReset(email) {
    return this.post('/auth/forgot-password', { email }, { includeAuth: false });
  }

  async resetPassword(token, password) {
    const response = await this.post(
      '/auth/reset-password',
      { token, password },
      { includeAuth: false }
    );
    this.applySession(response);
    return response;
  }

  async devLogin() {
    const response = await this.post('/auth/dev-login', {}, { includeAuth: false });
    this.applySession(response);
    return response;
  }

  getBaseUrl() {
    return this.baseURL;
  }

  // === FACTURAS ===

  async getInvoices(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `/invoices?${params}` : '/invoices';
    return this.get(endpoint);
  }

  async getInvoice(id) {
    return this.get(`/invoices/${id}`);
  }

  async createInvoice(invoiceData) {
    return this.post('/invoices', invoiceData);
  }

  async updateInvoice(id, invoiceData) {
    return this.put(`/invoices/${id}`, invoiceData);
  }

  async deleteInvoice(id) {
    return this.delete(`/invoices/${id}`);
  }

  // === VERIFACTU ===

  async getVerifactuConfig() {
    return this.get('/verifactu/config');
  }

  async updateVerifactuConfig(config) {
    return this.put('/verifactu/config', config);
  }

  async registerInvoiceVerifactu(invoiceId) {
    return this.post(`/verifactu/register/${invoiceId}`);
  }

  async cancelInvoiceVerifactu(invoiceId, reason) {
    return this.post(`/verifactu/cancel/${invoiceId}`, { reason });
  }

  async getVerifactuStatus(invoiceId) {
    return this.get(`/verifactu/status/${invoiceId}`);
  }

  async getVerifactuStatistics() {
    return this.get('/verifactu/statistics');
  }

  async getPendingVerifactu() {
    return this.get('/verifactu/pending');
  }

  async getRegisteredVerifactu() {
    return this.get('/verifactu/registered');
  }

  async getVerifactuLogs(invoiceId) {
    return this.get(`/verifactu/logs?invoice_id=${invoiceId}`);
  }

  async verifyVerifactuChain() {
    return this.get('/verifactu/verify-chain');
  }

  async batchRegisterVerifactu(invoiceIds) {
    return this.post('/verifactu/batch-register', { invoice_ids: invoiceIds });
  }

  // === CLIENTES ===

  async getClients(filters = {}) {
    const params = new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {})
    ).toString();

    const endpoint = params ? `/clients?${params}` : '/clients';
    return this.get(endpoint);
  }

  async getClient(id) {
    return this.get(`/clients/${id}`);
  }

  async createClient(clientData) {
    return this.post('/clients', clientData);
  }

  async updateClient(id, clientData) {
    return this.put(`/clients/${id}`, clientData);
  }

  async deleteClient(id) {
    return this.delete(`/clients/${id}`);
  }

  // === GASTOS ===

  async getExpenses(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `/expenses?${params}` : '/expenses';
    return this.get(endpoint);
  }

  async getExpense(id) {
    return this.get(`/expenses/${id}`);
  }

  async createExpense(expenseData) {
    return this.post('/expenses', expenseData);
  }

  async updateExpense(id, expenseData) {
    return this.put(`/expenses/${id}`, expenseData);
  }

  async deleteExpense(id) {
    return this.delete(`/expenses/${id}`);
  }

  // === PROYECTOS ===

  async getProjects() {
    return this.get('/projects');
  }

  async getProject(id) {
    return this.get(`/projects/${id}`);
  }

  async createProject(projectData) {
    return this.post('/projects', projectData);
  }

  async updateProject(id, projectData) {
    return this.put(`/projects/${id}`, projectData);
  }

  async deleteProject(id) {
    return this.delete(`/projects/${id}`);
  }
}

// Crear instancia global del servicio API
const api = new APIService();

// Exportar para uso en módulos
export default api;
export { APIError };

// También hacer disponible globalmente para uso sin módulos
if (typeof window !== 'undefined') {
  window.api = api;
  window.APIError = APIError;
}
