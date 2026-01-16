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

  // --- MÉTODOS DE NEGOCIO ---

  // Facturas
  async getInvoices(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/invoices?${query}`);
  }

  async getInvoice(id) {
    return this.get(`/invoices/${id}`);
  }

  async createInvoice(data) {
    return this.post('/invoices', data);
  }

  async updateInvoice(id, data) {
    return this.put(`/invoices/${id}`, data);
  }

  async deleteInvoice(id) {
    return this.delete(`/invoices/${id}`);
  }

  async generateInvoicePdf(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error generando PDF');
    return response.blob();
  }

  // Clientes
  async getClients(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/clients?${query}`);
  }

  async createClient(data) { return this.post('/clients', data); }
  async updateClient(id, data) { return this.put(`/clients/${id}`, data); }
  async deleteClient(id) { return this.delete(`/clients/${id}`); }
  
  async getClientSummary() { return this.get('/clients/summary'); }
  async getRecentClients(limit = 5) { return this.get(`/clients/recent?limit=${limit}`); }

  // Proyectos
  async getProjects(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/projects?${query}`);
  }
  
  async createProject(data) { return this.post('/projects', data); }
  async updateProject(id, data) { return this.put(`/projects/${id}`, data); }
  async deleteProject(id) { return this.delete(`/projects/${id}`); }
  
  async getProjectSummary() { return this.get('/projects/summary'); }
  async getProjectUpcomingDeadlines(limit = 5) { return this.get(`/projects/upcoming?limit=${limit}`); }
  async getProjectStatusMetrics() { return this.get('/projects/metrics'); }

  // Gastos
  async getExpenses(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/expenses?${query}`);
  }
  
  async createExpense(data) { return this.post('/expenses', data); }
  async updateExpense(id, data) { return this.put(`/expenses/${id}`, data); }
  async deleteExpense(id) { return this.delete(`/expenses/${id}`); }
  async getExpenseSummary() { return this.get('/expenses/summary'); }
  async getExpenseCategoryBreakdown() { return this.get('/expenses/breakdown'); }

  // Suscripciones
  async getSubscriptions(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/subscriptions?${query}`);
  }
  
  async createSubscription(data) { return this.post('/subscriptions', data); }
  async updateSubscription(id, data) { return this.put(`/subscriptions/${id}`, data); }
  async deleteSubscription(id) { return this.delete(`/subscriptions/${id}`); }
  
  async getSubscriptionSummary() { return this.get('/subscriptions/summary'); }
  async getSubscriptionUpcoming(limit = 5) { return this.get(`/subscriptions/upcoming?limit=${limit}`); }
  async getSubscriptionStatusBreakdown() { return this.get('/subscriptions/breakdown'); }

  // Presupuestos
  async getBudgets(filters = {}) { 
    const query = new URLSearchParams(filters).toString();
    return this.get(`/budgets?${query}`); 
  }
  async createBudget(data) { return this.post('/budgets', data); }
  async updateBudget(id, data) { return this.put(`/budgets/${id}`, data); }
  async deleteBudget(id) { return this.delete(`/budgets/${id}`); }
  async getBudgetSummary(month, year) { 
    const query = new URLSearchParams({ month, year }).toString();
    return this.get(`/budgets/summary?${query}`); 
  }
  async getAutoBudgetRecommendations() { return this.get('/budgets/recommendations'); }

  // Dashboard stats
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  // --- FIN MÉTODOS DE NEGOCIO ---

  // Métodos requeridos por main.js (existentes)
  getUserData() {
    return null; 
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async devLogin() {
    return this.post('/auth/dev-login');
  }
}

const api = new APIService();
window.api = api; // Exponer globalmente para main.js
export default api;
