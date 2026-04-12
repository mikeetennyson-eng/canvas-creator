// API Configuration
// On Vercel, frontend and backend are on same domain, so use relative path /api
// In development, use localhost:5000/api
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginData {
  email: string;
  password: string;
  forceLogoutPrevious?: boolean;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    isTourShown?: boolean;
  };
}

export interface VerifyTokenResponse {
  message: string;
  user: {
    id: string;
    name?: string;
    email: string;
    isTourShown?: boolean;
  };
}

export interface TourStatusResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    isTourShown: boolean;
  };
}

export interface SessionStatusResponse {
  message: string;
  takeoverRequested: boolean;
}

export class ApiClientError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

export interface SubscriptionInfo {
  plan: 'free' | 'professional';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd?: string;
  autoRenewal: boolean;
  daysRemaining: number | null;
}

export interface SubscriptionResponse {
  message: string;
  subscription: SubscriptionInfo;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
}

export interface RazorpayOrderResponse {
  message: string;
  order: RazorpayOrder;
}

export interface RazorpaySubscription {
  subscriptionId: string;
  planId: string;
  status: string;
  paymentLink: string;
  shortUrl: string;
}

export interface RazorpaySubscriptionResponse {
  message: string;
  subscription: RazorpaySubscription;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
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
      throw new ApiClientError(data.message || `HTTP ${response.status}`, data.code, response.status);
    }

    return data as T;
  }

  // Auth endpoints
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token on successful signup
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token on successful login
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    return this.request<VerifyTokenResponse>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getSessionStatus(): Promise<SessionStatusResponse> {
    return this.request<SessionStatusResponse>('/auth/session-status', {
      method: 'GET',
    });
  }

  async logoutSession(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout-session', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getProtected(): Promise<any> {
    return this.request('/auth/protected', {
      method: 'GET',
    });
  }

  async updateTourStatus(isTourShown: boolean): Promise<TourStatusResponse> {
    return this.request<TourStatusResponse>('/auth/tour-status', {
      method: 'POST',
      body: JSON.stringify({ isTourShown }),
    });
  }

  // Canvas endpoints
  async saveCanvas(data: {
    _id?: string;
    title: string;
    description?: string;
    canvasData: string;
    thumbnail?: string;
  }): Promise<any> {
    const method = data._id ? 'PUT' : 'POST';
    return this.request('/canvas/save', {
      method,
      body: JSON.stringify(data),
    });
  }

  async getUserCanvases(): Promise<any> {
    return this.request('/canvas/list', {
      method: 'GET',
    });
  }

  async getCanvas(id: string): Promise<any> {
    return this.request(`/canvas/${id}`, {
      method: 'GET',
    });
  }

  async deleteCanvas(id: string): Promise<any> {
    return this.request(`/canvas/${id}`, {
      method: 'DELETE',
    });
  }

  // Subscription endpoints
  async getSubscriptionInfo(): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>('/subscription/info', {
      method: 'GET',
    });
  }

  async upgradeSubscription(paymentMethod: string, transactionId: string): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>('/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, transactionId }),
    });
  }

  async downgradeSubscription(): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>('/subscription/downgrade', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async toggleAutoRenewal(autoRenewal: boolean): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>('/subscription/toggle-renewal', {
      method: 'POST',
      body: JSON.stringify({ autoRenewal }),
    });
  }

  async cancelSubscription(): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>('/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Razorpay endpoints
  async createRazorpayOrder(): Promise<RazorpayOrderResponse> {
    return this.request<RazorpayOrderResponse>('/subscription/create-order', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async createRazorpaySubscription(autoRenewal: boolean = true): Promise<RazorpaySubscriptionResponse> {
    return this.request<RazorpaySubscriptionResponse>('/subscription/create-subscription', {
      method: 'POST',
      body: JSON.stringify({ autoRenewal }),
    });
  }

  async verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>('/subscription/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature }),
    });
  }

  async verifyRecurringSubscription(
    subscriptionId: string,
    paymentId?: string,
    signature?: string
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>('/subscription/verify-subscription', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId, paymentId, signature }),
    });
  }

  // Token management
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.removeToken();
  }
}

export const apiClient = new ApiClient(API_URL);
