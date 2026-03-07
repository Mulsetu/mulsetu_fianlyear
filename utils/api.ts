import { ApiResponse, PaginatedResponse } from '@/types';

// Base API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mulsetu.com';
const API_VERSION = 'v1';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // User management
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    UPLOAD_AVATAR: '/user/avatar',
  },
  
  // Produce
  PRODUCE: {
    LIST: '/produce',
    DETAILS: '/produce/:id',
    CATEGORIES: '/produce/categories',
    SEARCH: '/produce/search',
  },
  
  // Markets
  MARKETS: {
    LIST: '/markets',
    DETAILS: '/markets/:id',
    NEARBY: '/markets/nearby',
    STATES: '/markets/states',
    DISTRICTS: '/markets/districts',
  },
  
  // Prices
  PRICES: {
    LIST: '/prices',
    TRENDS: '/prices/trends',
    REPORT: '/prices/report',
    VERIFY: '/prices/verify',
  },
  
  // Listings
  LISTINGS: {
    LIST: '/listings',
    CREATE: '/listings',
    DETAILS: '/listings/:id',
    UPDATE: '/listings/:id',
    DELETE: '/listings/:id',
    MY_LISTINGS: '/listings/my',
  },
  
  // Offers
  OFFERS: {
    LIST: '/offers',
    CREATE: '/offers',
    DETAILS: '/offers/:id',
    UPDATE: '/offers/:id',
    DELETE: '/offers/:id',
    MY_OFFERS: '/offers/my',
  },
  
  // Transactions
  TRANSACTIONS: {
    LIST: '/transactions',
    DETAILS: '/transactions/:id',
    CREATE: '/transactions',
  },
  
  // Transport
  TRANSPORT: {
    REQUESTS: '/transport/requests',
    CREATE_REQUEST: '/transport/requests',
    UPDATE_STATUS: '/transport/requests/:id/status',
    MY_REQUESTS: '/transport/requests/my',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PRICE_TRENDS: '/analytics/price-trends',
    MARKET_COMPARISON: '/analytics/market-comparison',
  },
  
  // Admin
  ADMIN: {
    USERS: '/admin/users',
    MARKETS: '/admin/markets',
    PRICES: '/admin/prices',
    UPLOAD_DATA: '/admin/upload',
    STATS: '/admin/stats',
  },
} as const;

// HTTP methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// Request configuration
interface RequestConfig {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

// API client class
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/${API_VERSION}`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  // Build full URL
  private buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    let url = `${this.baseURL}${endpoint}`;
    
    if (params) {
      Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, String(params[key]));
      });
    }
    
    return url;
  }

  // Make HTTP request
  private async request<T>(
    endpoint: string,
    config: RequestConfig,
    params?: Record<string, string | number>
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, params);
      
      const response = await fetch(url, {
        ...config,
        headers: {
          ...this.defaultHeaders,
          ...config.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
          data: data,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
        pagination: data.pagination,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: HTTP_METHODS.GET,
      headers: headers || {},
    }, params);
  }

  // POST request
  async post<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, string | number>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: HTTP_METHODS.POST,
      headers: headers || {},
      body: data ? JSON.stringify(data) : undefined,
    }, params);
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, string | number>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: HTTP_METHODS.PUT,
      headers: headers || {},
      body: data ? JSON.stringify(data) : undefined,
    }, params);
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, string | number>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: HTTP_METHODS.PATCH,
      headers: headers || {},
      body: data ? JSON.stringify(data) : undefined,
    }, params);
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    params?: Record<string, string | number>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: HTTP_METHODS.DELETE,
      headers: headers || {},
    }, params);
  }

  // Upload file
  async uploadFile<T>(
    endpoint: string,
    file: FormData,
    params?: Record<string, string | number>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    
    try {
      const response = await fetch(url, {
        method: HTTP_METHODS.POST,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
        body: file,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Upload failed',
          data: data,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
}

// Create API client instance
export const apiClient = new ApiClient();

// Mock API functions for development
export const mockApi = {
  // Simulate network delay
  delay: (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock successful response
  success: <T>(data: T, message?: string): ApiResponse<T> => ({
    success: true,
    data,
    message,
  }),

  // Mock error response
  error: (error: string): ApiResponse<null> => ({
    success: false,
    error,
  }),

  // Mock paginated response
  paginated: <T>(items: T[], page: number = 1, limit: number = 10): ApiResponse<PaginatedResponse<T>> => ({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
      },
    },
  }),
};

// API helper functions
export const apiHelpers = {
  // Handle API response
  handleResponse: <T>(response: ApiResponse<T>): T => {
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data as T;
  },

  // Handle paginated response
  handlePaginatedResponse: <T>(response: ApiResponse<PaginatedResponse<T>>): PaginatedResponse<T> => {
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data as PaginatedResponse<T>;
  },

  // Build query string
  buildQueryString: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  },

  // Build URL with query params
  buildUrlWithQuery: (baseUrl: string, params: Record<string, any>): string => {
    const queryString = apiHelpers.buildQueryString(params);
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  },
};

// Export default API client
export default apiClient;
