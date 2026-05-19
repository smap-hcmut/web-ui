/**
 * API Client
 *
 * Centralized HTTP client with auth, error handling,
 * and request/response transformations.
 *
 * Browser requests go through the Next.js proxy (/api/proxy/*)
 * which forwards them to smap-api.tantai.dev with cookies.
 */

import { buildApiUrl } from './config';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizeDetails(value: unknown, traceId: string | undefined): ApiError['details'] {
  if (isRecord(value)) {
    return traceId ? { ...value, trace_id: traceId } : value;
  }
  if (typeof value === 'string') {
    return traceId ? { message: value, trace_id: traceId } : value;
  }
  if (value !== undefined && value !== null) {
    return traceId ? { value, trace_id: traceId } : { value };
  }
  return traceId ? { trace_id: traceId } : undefined;
}

function normalizeApiError(body: unknown, response: Response): ApiError {
  const root = isRecord(body) ? body : {};
  const nested = isRecord(root.error) ? root.error : undefined;
  const source = nested ?? root;
  const traceId = stringValue(root.trace_id);

  return {
    code: stringValue(source.code) ?? stringValue(root.error_code) ?? 'UNKNOWN_ERROR',
    message: stringValue(source.message) ?? response.statusText,
    details: normalizeDetails(source.details, traceId),
    status: response.status,
  };
}

class ApiClient {
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const raw = buildApiUrl(endpoint);

    // In browser the base is a relative path (/api/proxy/...) — need window.location as base
    const base = typeof window !== 'undefined' ? window.location.origin : undefined;
    const url = new URL(raw, base);

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
        error = normalizeApiError(body, response);
      } else {
        error = {
          code: 'UNKNOWN_ERROR',
          message: response.statusText,
          status: response.status,
        };
      }

      // Handle auth errors globally
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }
      if (response.status === 403 || error.code === 'INSUFFICIENT_PERMISSIONS') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('smap:permission-denied', { detail: error }));
        }
      }

      throw error;
    }

    if (isJson) {
      const body = await response.json();
      // Handle wrapped responses from Go services.
      // Standard envelope: { error_code: 0, message: "...", data: <payload> }
      // where <payload> may itself be a single-key wrapper like { campaign: {...} }
      // or a multi-key object like { campaigns: [...], paginator: {...} }.
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        if (body.data !== undefined) {
          const data = body.data as Record<string, unknown>;
          // If data is a single-key object wrapping the real entity (e.g. {campaign:{...}}),
          // unwrap one more level so callers get the entity directly.
          // Multi-key payloads (e.g. {campaigns:[...], paginator:{...}}) are returned as-is.
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            const dataKeys = Object.keys(data);
            if (
              dataKeys.length === 1 &&
              data[dataKeys[0]] !== null &&
              typeof data[dataKeys[0]] === 'object' &&
              !Array.isArray(data[dataKeys[0]])
            ) {
              return data[dataKeys[0]] as T;
            }
          }
          return data as T;
        }
        // Legacy / non-envelope responses: single-key wrapper without an error_code
        const keys = Object.keys(body);
        if (keys.length === 1 && typeof body[keys[0]] === 'object') {
          return body[keys[0]] as T;
        }
      }
      return body;
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
      credentials: 'include',
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
