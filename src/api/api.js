// @ts-check
import axios from 'axios';

const resolveBaseUrl = () => {
  // Try Vite's import.meta.env first
  // @ts-ignore - import.meta.env is available in Vite
  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  // @ts-ignore
  const viteUrl = metaEnv?.VITE_API_URL;
  // @ts-ignore
  const mode = metaEnv?.MODE || 'development';

  if (typeof viteUrl === 'string' && viteUrl.trim()) {
    const baseUrl = viteUrl.trim().replace(/\/+$/, '');
    if (mode === 'development') console.log(`[API] Using ${mode} environment (import.meta.env): ${baseUrl}`);
    return baseUrl;
  }

  // Fallbacks for environments where import.meta.env isn't available
  // 1) process.env (useful in some dev servers or tests)
  try {
    // @ts-ignore
    const proc = typeof process !== 'undefined' ? process.env : undefined;
    const procUrl = proc?.VITE_API_URL || proc?.REACT_APP_API_URL || proc?.API_URL;
    if (typeof procUrl === 'string' && procUrl.trim()) {
      const baseUrl = procUrl.trim().replace(/\/+$/, '');
      console.log(`[API] Using environment from process.env: ${baseUrl}`);
      return baseUrl;
    }
  } catch (e) {
    // ignore
  }

  // 2) A runtime-injected global (useful for docker/static hosting) e.g. window.__APP_CONFIG = { VITE_API_URL: '...' }
  try {
    // @ts-ignore
    const runtime = typeof window !== 'undefined' ? window.__APP_CONFIG : undefined;
    const runtimeUrl = runtime?.VITE_API_URL || runtime?.API_URL;
    if (typeof runtimeUrl === 'string' && runtimeUrl.trim()) {
      const baseUrl = runtimeUrl.trim().replace(/\/+$/, '');
      console.log(`[API] Using runtime-injected config: ${baseUrl}`);
      return baseUrl;
    }
  } catch (e) {
    // ignore
  }

  // Final fallback: no env found. Log clear guidance and return empty string to use relative URLs.
  if (mode === 'development') {
    console.error('[API] VITE_API_URL not found in import.meta.env, process.env, or window.__APP_CONFIG. API requests will use relative paths. Set VITE_API_URL in Billing_Frontend/.env.development or export VITE_API_URL before starting the dev server.');
  }
  return '';
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
 * @param {string} path
 */
const handleUnauthorized = (path) => {
  try {
    if (typeof path === 'string' && (path.startsWith('/api/auth') || path.startsWith('/api/auth/register'))) {
      return;
    }
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('auth');
    } catch (e) {
      // ignore
    }
    if (window.location && window.location.pathname !== '/') {
      window.location.assign('/');
    }
  } catch (e) {
    // ignore
  }
};

// Using axios responses, parsing is handled by axios (response.data)

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
 * @param {{ token?: string; body?: any; method?: string; headers?: any; [key: string]: any }} options
 */
const request = async (path, options = {}) => {
  const { token, body, headers = {}, method = 'GET', ...rest } = options;

  /** @type {any} */
  let finalHeaders = {};
  if (headers && typeof headers === 'object') {
    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
      finalHeaders = Object.fromEntries(headers.entries());
    } else if (Array.isArray(headers)) {
      finalHeaders = Object.fromEntries(headers);
    } else {
      finalHeaders = { ...headers };
    }
  }

  if (body !== undefined && body !== null && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const axiosConfig = {
      url: makeUrl(path),
      method: method.toLowerCase(),
      headers: finalHeaders,
      data: body !== undefined && body !== null ? body : undefined,
      // allow callers to pass axios-specific options via rest (e.g., params)
      ...rest,
    };

    const response = await axios.request(axiosConfig);

    const payload = response && response.data !== undefined ? response.data : null;

    return payload;
  } catch (err) {
    /** @type {any} */
    const error = err;
    // Normalize axios error
    if (error && error.response) {
      const status = error.response.status;
      const payload = error.response.data;
      if (status === 401) {
        handleUnauthorized(path);
      }
      const message = typeof payload?.error === 'string' ? payload.error : error.message || `Request failed with status ${status}`;
      throw new ApiError(message, status, payload);
    }
    throw new ApiError((error && error.message) || 'Network request failed', 0, { originalError: error });
  }
};

/**
 * @param {{ companyName: string; email: string; password: string }} credentials
 */
export const login = async (credentials) => {
  const companyName = String(credentials.companyName || '').trim();
  const email = String(credentials.email || '').trim();
  const password = String(credentials.password || '');

  if (!companyName) {
    throw new ApiError('Company name is required', 400);
  }

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
      companyName,
      email,
      password,
    },
  });
};

/**
 * @param {{ name: string; contact: string; email: string; companyName?: string; state?: string; city?: string; password?: string }} payload
 */
export const register = async (payload) => {
  const email = String(payload.email || '').trim();
  if (!email) throw new ApiError('Email is required', 400);
  return request('/api/auth/register', {
    method: 'POST',
    body: payload,
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

/**
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const getDashboard = async (options) => {
  return request('/api/dashboard', {
    method: 'GET',
    ...(options || {}),
  });
};

/**
 * Create invoice on backend
 * @param {{ id?: string; date?: string; items: Array<any>; subtotal?: number; discount?: number; tax?: number; total?: number; customer?: any }} payload
 * @param {{ token?: string }} [options]
 */
export const createInvoice = async (payload, options) => {
  return request('/api/invoices', {
    method: 'POST',
    body: payload,
    ...(options || {}),
  });
};

/**
 * @param {{ search?: string; token?: string; [key: string]: any }} [options]
 */
export const getCustomers = async (options) => {
  const { search, ...rest } = options || {};
  const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/api/customers${queryParams}`, {
    method: 'GET',
    ...rest,
  });
};

/**
 * @param {string} id
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const getCustomerById = async (id, options) => {
  return request(`/api/customers/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
};

/**
 * @param {Record<string, unknown>} customer
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const createCustomer = async (customer, options) => {
  return request('/api/customers', {
    method: 'POST',
    body: customer,
    ...(options || {}),
  });
};

/**
 * @param {string} id
 * @param {Record<string, unknown>} customer
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const updateCustomer = async (id, customer, options) => {
  return request(`/api/customers/${id}`, {
    method: 'PUT',
    body: customer,
    ...(options || {}),
  });
};

/**
 * @param {string} id
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const deleteCustomer = async (id, options) => {
  await request(`/api/customers/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
  return { id };
};

/**
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const getSalesReport = async (options) => {
  return request('/api/reports/sales', {
    method: 'GET',
    ...(options || {}),
  });
};

/**
 * @param {string} barcode
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const getProductByBarcode = async (barcode, options) => {
  return request(`/api/products/barcode/${encodeURIComponent(barcode)}`, {
    method: 'GET',
    ...(options || {}),
  });
};

/**
 * Download bulk upload template
 * @param {{ token?: string }} [options]
 */
export const downloadBulkTemplate = async (options) => {
  const { token } = options || {};
  const url = makeUrl('/api/products/bulk/template');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new ApiError('Failed to download template', response.status);
  }

  return response.blob();
};

/**
 * Bulk upload products from Excel file
 * @param {File} file - Excel file to upload
 * @param {'create' | 'update' | 'upsert'} [operation='upsert'] - Operation type
 * @param {{ token?: string }} [options]
 */
export const bulkUploadProducts = async (file, operation = 'upsert', options) => {
  const { token } = options || {};
  const url = makeUrl(`/api/products/bulk/upload?operation=${operation}`);
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.message || data.error || 'Bulk upload failed', response.status, data);
  }

  return data;
};

/**
 * Get billing history
 * @param {{ token?: string; [key: string]: any }} [options]
 */
export const getBillingHistory = async (options) => {
  return request('/api/billing-history', {
    method: 'GET',
    ...(options || {}),
  });
};

/**
 * Create a refund for an invoice
 * @param {any} payload
 * @param {{ token?: string }} [options]
 */
export const createRefund = async (payload, options) => {
  return request('/api/refunds', {
    method: 'POST',
    body: payload,
    ...(options || {}),
  });
};

export { ApiError };

