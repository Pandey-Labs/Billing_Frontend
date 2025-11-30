import type { Product } from '../types';

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
  email: string;
  password: string;
}): Promise<LoginResponse>;

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

import type { Customer } from '../types';

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

import type { Invoice } from '../types';

export declare function getSalesReport(
  options?: RequestInit & { token?: string },
): Promise<Invoice[]>;

