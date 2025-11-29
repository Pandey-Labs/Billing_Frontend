// @ts-check

const resolveBaseUrl = () => {
  // @ts-ignore - import.meta.env is available in Vite
  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  // @ts-ignore
  const envUrl = metaEnv?.VITE_API_URL;
  // @ts-ignore
  const mode = metaEnv?.MODE || 'development';
  
  if (typeof envUrl === 'string' && envUrl.trim()) {
    const baseUrl = envUrl.trim().replace(/\/+$/, '');
    // Log in development mode for debugging
    if (mode === 'development') {
      console.log(`[API] Using ${mode} environment: ${baseUrl}`);
    }
    return baseUrl;
  }
  
  // Fallback to default if env variable is not set
  const DEFAULT_BASE_URL = 'https://billing-backend-wje7.onrender.com';
  if (mode === 'development') {
    console.warn(`[API] VITE_API_URL not found, using default: ${DEFAULT_BASE_URL}`);
  }
  return DEFAULT_BASE_URL;
};

const API_BASE_URL = resolveBaseUrl();

class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {unknown} [details]
   */
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * @param {Response} response
 */
const parseResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError('Failed to parse server response', response.status, { raw: text, error });
  }
};

/**
 * @param {string} path
 */
const makeUrl = (path) => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

/**
 * @param {string} path
 * @param {{ token?: string; body?: any; method?: string; headers?: HeadersInit; [key: string]: any }} options
 */
const request = async (path, options = {}) => {
  const { token, body, headers, ...rest } = options;

  const finalHeaders = new Headers(headers || {});
  if (body !== undefined && body !== null && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(makeUrl(path), {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
};

/**
 * @param {{ email: string; password: string }} credentials
 */
export const login = async (credentials) => {
  const email = String(credentials.email || '').trim();
  const password = String(credentials.password || '');

  if (!email) {
    throw new ApiError('Email is required', 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError('Please enter a valid email address', 400);
  }

  if (!password || password.length < 6) {
    throw new ApiError('Password must be at least 6 characters long', 400);
  }

  return request('/api/auth/login', {
    method: 'POST',
    body: {
      email,
      password,
    },
  });
};

/**
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const getProducts = async (options) => {
  return request('/api/products', {
    method: 'GET',
    ...(options || {}),
  });
};

/**
 * @param {Record<string, unknown>} product
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const createProduct = async (product, options) => {
  return request('/api/products', {
    method: 'POST',
    body: product,
    ...(options || {}),
  });
};

/**
 * @param {string} id
 * @param {Record<string, unknown>} product
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const updateProduct = async (id, product, options) => {
  return request(`/api/products/${id}`, {
    method: 'PUT',
    body: product,
    ...(options || {}),
  });
};

/**
 * @param {string} id
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const deleteProduct = async (id, options) => {
  await request(`/api/products/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
  return { id };
};

export { ApiError };

