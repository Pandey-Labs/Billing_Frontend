import type { Product, Customer, Invoice } from '../types';

export declare class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown);
}

export interface LoginResponse {
  token: string;
  expiresIn?: number;
  user: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

export declare function login(credentials: {
  companyName: string;
  email: string;
  password: string;
}): Promise<LoginResponse>;

export declare function register(payload: {
  name: string;
  contact: string;
  email: string;
  companyName?: string;
  state?: string;
  city?: string;
  password?: string;
}): Promise<{ token?: string; user?: any; [key: string]: any }>;

export declare function getProducts(
  options?: RequestInit & { token?: string },
): Promise<Product[]>;

export declare function createProduct(
  product: Partial<Product>,
  options?: RequestInit & { token?: string },
): Promise<Product>;

export declare function updateProduct(
  id: string,
  product: Partial<Product>,
  options?: RequestInit & { token?: string },
): Promise<Product>;

export declare function deleteProduct(
  id: string,
  options?: RequestInit & { token?: string },
): Promise<{ id: string }>;

export interface DashboardData {
  sales: Array<{
    id: string;
    date: string;
    total: number;
    paymentMethod?: string;
    items: Array<{
      id: string;
      productId: string;
      name: string;
      price: number;
      qty: number;
    }>;
    subtotal?: number;
    tax?: number;
    discount?: number;
    customer?: unknown | null;
  }>;
  products: Array<{
    id: string;
    name: string;
    stock: number;
    price: number;
    sku?: string;
    category?: string;
  }>;
}

export declare function getDashboard(
  options?: RequestInit & { token?: string },
): Promise<DashboardData>;


export declare function getCustomers(
  options?: RequestInit & { token?: string; search?: string },
): Promise<Customer[]>;

export declare function getCustomerById(
  id: string,
  options?: RequestInit & { token?: string },
): Promise<Customer>;

export declare function createCustomer(
  customer: Partial<Customer>,
  options?: RequestInit & { token?: string },
): Promise<Customer>;

export declare function updateCustomer(
  id: string,
  customer: Partial<Customer>,
  options?: RequestInit & { token?: string },
): Promise<Customer>;

export declare function deleteCustomer(
  id: string,
  options?: RequestInit & { token?: string },
): Promise<{ id: string }>;


export declare function getSalesReport(
  options?: RequestInit & { token?: string },
): Promise<Invoice[]>;

export declare function getProductByBarcode(
  barcode: string,
  options?: RequestInit & { token?: string },
): Promise<Product | null>;

export declare function downloadBulkTemplate(
  options?: { token?: string },
): Promise<Blob>;

export interface BulkUploadResult {
  message: string;
  operation: 'create' | 'update' | 'upsert';
  results: {
    success?: Array<{ row: number; product: Product }>;
    created?: Array<{ row: number; product: Product }>;
    updated?: Array<{ row: number; product: Product }>;
    notFound?: Array<{ row: number; data: Record<string, unknown> }>;
    errors: Array<{ row: number; error: string }>;
  };
  summary: {
    total: number;
    processed: number;
    validationErrors: number;
    created?: number;
    updated?: number;
    errors: number;
    notFound?: number;
  };
}

export declare function bulkUploadProducts(
  file: File,
  operation?: 'create' | 'update' | 'upsert',
  options?: { token?: string },
): Promise<BulkUploadResult>;
