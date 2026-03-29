// API Configuration
// On Vercel, frontend and backend are on same domain, so use relative path /api
// In development, use localhost:5000/api
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  // Auth endpoints
  async signup(data) {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token on successful signup
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(data) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token on successful login
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async verifyToken(token) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getProtected() {
    return this.request('/auth/protected', {
      method: 'GET',
    });
  }

  // Canvas endpoints
  async saveCanvas(data) {
    const method = data._id ? 'PUT' : 'POST';
    return this.request('/canvas/save', {
      method,
      body: JSON.stringify(data),
    });
  }

  async getUserCanvases() {
    return this.request('/canvas/list', {
      method: 'GET',
    });
  }

  async getCanvas(id) {
    return this.request(`/canvas/${id}`, {
      method: 'GET',
    });
  }

  async deleteCanvas(id) {
    return this.request(`/canvas/${id}`, {
      method: 'DELETE',
    });
  }

  // Subscription endpoints
  async getSubscriptionInfo() {
    return this.request('/subscription/info', {
      method: 'GET',
    });
  }

  async upgradeSubscription() {
    return this.request('/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async downgradeSubscription() {
    return this.request('/subscription/downgrade', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async cancelSubscription() {
    return this.request('/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Token management
  setToken(token) {
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  removeToken() {
    localStorage.removeItem('auth_token');
  }

  // Add logout method
  logout() {
    this.removeToken();
  }
}

export const apiClient = new ApiClient(API_URL);
