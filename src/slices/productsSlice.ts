import * as toolkit from '@reduxjs/toolkit';
const { createSlice, createAsyncThunk } = toolkit;
import type { Product } from '../types';
import {
  getProducts,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
  ApiError,
} from '../api/api';

type DiscountCompatibleProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

interface ProductsState {
  items: Product[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchProducts = createAsyncThunk<Product[]>(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const products = await getProducts();
      return products;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch products');
    }
  },
);

export const addProduct = createAsyncThunk<Product, DiscountCompatibleProduct>(
  'products/add',
  async (payload, { rejectWithValue }) => {
    try {
      const created = await createProductApi(payload);
      return created;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create product');
    }
  },
);

export const updateProduct = createAsyncThunk<
  Product,
  { id: string; data: Partial<DiscountCompatibleProduct> }
>(
  'products/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updated = await updateProductApi(id, data);
      return updated;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update product');
    }
  },
);

export const removeProduct = createAsyncThunk<string, string>(
  'products/remove',
  async (id, { rejectWithValue }) => {
    try {
      await deleteProductApi(id);
      return id;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete product');
    }
  },
);

const slice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    deductStock(state, action: toolkit.PayloadAction<{ productId: string; qty: number }[]>) {
      action.payload.forEach((line) => {
        const product = state.items.find((item) => item.id === line.productId);
        if (product) {
          product.stock = Math.max(0, (product.stock || 0) - line.qty);
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch products';
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.error = null;
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to create product';
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
        }
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to update product';
      })
      .addCase(removeProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((product) => product.id !== action.payload);
        state.error = null;
      })
      .addCase(removeProduct.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to delete product';
      });
  },
});

export const { deductStock } = slice.actions;
export default slice.reducer;
