const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class APIError extends Error {
  constructor(public message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

class APIService {
  private token: string | null = localStorage.getItem('auth_token');

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
    this.token = token;
  }

  clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.token = null;
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit & { includeAuth?: boolean } = {}): Promise<T> {
    const { includeAuth = true, ...fetchOptions } = options;
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(includeAuth),
        ...fetchOptions.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 204) return null as T;

      const data = await response.json();

      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && includeAuth) {
          this.clearToken();
          window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
        }

        throw new APIError(data.error || 'Error en la petición', response.status, data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError((error as Error).message || 'Error de conexión', 0);
    }
  }

  get<T>(endpoint: string, options?: RequestInit & { includeAuth?: boolean }) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit & { includeAuth?: boolean }) {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    });
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit & { includeAuth?: boolean }) {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    });
  }

  delete<T>(endpoint: string, options?: RequestInit & { includeAuth?: boolean }) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth
  getCurrentUser() { return this.get<any>('/auth/me'); }
  login(credentials: any) { return this.post<any>('/auth/login', credentials, { includeAuth: false }); }
  
  // Dashboard / Summary
  getProjectSummary() { return this.get<any>('/projects/summary'); }
  getSubscriptionSummary() { return this.get<any>('/subscriptions/summary'); }
  getInvoicesStatistics() { return this.get<any>('/invoices/statistics'); }
  getExpensesStatistics() { return this.get<any>('/expenses/statistics'); }
}

export const api = new APIService();
