/**
 * API Client
 *
 * Centralized HTTP client with interceptors for auth, error handling,
 * and request/response transformations.
 * 
 * Calls go directly to smap-api.tantai.dev (no Next.js proxy needed).
 */

import { API_CONFIG, buildApiUrl } from './config';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

class ApiClient {
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(buildApiUrl(endpoint));

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle no content responses
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let error: ApiError;

      if (isJson) {
        const body = await response.json();
        error = {
          code: body.code || 'UNKNOWN_ERROR',
          message: body.message || response.statusText,
          details: body.details,
          status: response.status,
        };
      } else {
        error = {
          code: 'UNKNOWN_ERROR',
          message: response.statusText,
          status: response.status,
        };
      }

      // Handle auth errors globally
      if (response.status === 401) {
        // Dispatch event for auth store to handle
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }

      throw error;
    }

    if (isJson) {
      const body = await response.json();
      // Handle wrapped responses from Go services
      return body.data !== undefined ? body.data : body;
    }

    return response.text() as unknown as T;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, params, ...fetchOptions } = options;

    const url = this.buildUrl(endpoint, params);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Include cookies for auth (cross-origin)
    });

    return this.handleResponse<T>(response);
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
