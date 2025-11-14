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

