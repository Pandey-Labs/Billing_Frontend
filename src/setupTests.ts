import '@testing-library/jest-dom';

// Mock api module before any other imports
jest.mock('./api/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  }
  
  return {
    createInvoice: jest.fn(() => Promise.resolve({ success: true })),
    getCustomers: jest.fn(() => Promise.resolve([])),
    getMyProfile: jest.fn(() => Promise.resolve({ user: { razorpayKeyId: 'test_key' } })),
    getProductByBarcode: jest.fn(() => Promise.resolve(null)),
    request: jest.fn(() => Promise.resolve({})),
    ApiError: ApiError,
  };
});

// Mock uuid before any other imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeDisabled(): R;
    }
  }
}

// Mock window.__APP_CONFIG for tests
Object.defineProperty(window, '__APP_CONFIG', {
  value: {
    VITE_API_URL: 'http://localhost:5000',
    VITE_RAZORPAY_KEY_ID: 'test_key',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock fetch globally
global.fetch = jest.fn();
