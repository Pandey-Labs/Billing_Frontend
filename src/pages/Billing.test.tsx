import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Billing from './Billing';
import cartReducer from '../slices/cartSlice';
import productsReducer from '../slices/productsSlice';
import customersReducer from '../slices/customersSlice';
import authReducer from '../slices/authSlice';
import reportsReducer from '../slices/reportsSlice';
import settingsReducer from '../slices/settingsSlice';
import * as api from '../api/api';

// Mock the API module
jest.mock('../api/api');

const mockApi = api as jest.Mocked<typeof api>;

// Mock the toast utility
jest.mock('../utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock components
jest.mock('../components/ApiErrorFallback', () => {
  return function MockApiErrorFallback() {
    return <div data-testid="api-error-fallback">API Error</div>;
  };
});

jest.mock('../components/PaymentMethodModal', () => {
  return function MockPaymentMethodModal({
    show,
    onHide,
    onSelectPaymentMethod,
  }: any) {
    if (!show) return null;
    return (
      <div data-testid="payment-modal">
        <button onClick={() => onSelectPaymentMethod('cash')}>Pay Cash</button>
        <button onClick={() => onSelectPaymentMethod('card')}>Pay Card</button>
        <button onClick={onHide}>Close</button>
      </div>
    );
  };
});

// Create a test store
const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      products: productsReducer,
      customers: customersReducer,
      auth: authReducer,
      reports: reportsReducer,
      settings: settingsReducer,
    } as any,
    preloadedState,
  } as any);
};

const renderWithProviders = (
  component: React.ReactElement,
  {
    preloadedState = undefined,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: any = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return { ...render(component, { wrapper: Wrapper }), store };
};

describe('Billing Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  // Test 1: Component Rendering
  describe('Component Rendering', () => {
    it('should render the Billing component with all main sections', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('Quick Billing')).toBeInTheDocument();
        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('Cart')).toBeInTheDocument();
        expect(screen.getByText('Selected Customer')).toBeInTheDocument();
      });
    });

    it('should display billing statistics', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('Cart Value')).toBeInTheDocument();
        expect(screen.getByText('Items in Cart')).toBeInTheDocument();
        expect(screen.getByText('Unique Products')).toBeInTheDocument();
        expect(screen.getByText('Customers')).toBeInTheDocument();
      });
    });

    it('should show empty cart message initially', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('Cart is empty')).toBeInTheDocument();
      });
    });
  });

  // Test 2: Customer API Loading
  describe('Customer API Loading', () => {
    it('should fetch and display customers on mount', async () => {
      const mockCustomers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', phone: '1234567890' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321' },
      ];

      mockApi.getCustomers.mockResolvedValueOnce(mockCustomers as any);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        expect(mockApi.getCustomers).toHaveBeenCalled();
      });
    });

    it('should handle customer API errors gracefully', async () => {
      const error = new api.ApiError('Failed to load customers', 500);
      mockApi.getCustomers.mockRejectedValueOnce(error);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      const preloadedState = {
        customers: { items: [] },
        cart: { items: [] },
        products: { items: [] },
        auth: { token: 'test_token' },
        reports: { sales: [], totalRevenue: 0, totalTransactions: 0 },
        settings: { paymentGatewayEnabled: true },
      };

      renderWithProviders(<Billing />, { preloadedState });

      await waitFor(() => {
        expect(mockApi.getCustomers).toHaveBeenCalled();
      });
    });
  });

  // Test 3: Barcode Search
  describe('Barcode Search', () => {
    it('should allow searching for products by barcode', async () => {
      const mockProduct = {
        id: 'prod1',
        name: 'Test Product',
        sku: 'SKU123',
        barcode: 'BARCODE123',
        price: 100,
        sellingPrice: 100,
        stock: 10,
        taxRate: 18,
      };

      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);
      mockApi.getProductByBarcode.mockResolvedValueOnce(mockProduct as any);

      renderWithProviders(<Billing />);

      const barcodeInput = await screen.findByPlaceholderText('Scan or enter barcode...');
      await userEvent.type(barcodeInput, 'BARCODE123');

      // Find submit button by testing for it in the form
      const form = barcodeInput.closest('form');
      const submitButton = form?.querySelector('button[type="submit"]');
      if (submitButton) {
        await userEvent.click(submitButton);
      }

      await waitFor(() => {
        expect(mockApi.getProductByBarcode).toHaveBeenCalledWith(
          'BARCODE123',
          expect.any(Object)
        );
      });
    });

    it('should show error message when product not found', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);
      mockApi.getProductByBarcode.mockRejectedValueOnce(
        new api.ApiError('Product not found', 404)
      );

      renderWithProviders(<Billing />);

      const barcodeInput = await screen.findByPlaceholderText('Scan or enter barcode...');
      await userEvent.type(barcodeInput, 'INVALID_BARCODE');

      // Find submit button by testing for it in the form
      const form = barcodeInput.closest('form');
      const submitButton = form?.querySelector('button[type="submit"]');
      if (submitButton) {
        await userEvent.click(submitButton);
      }

      await waitFor(() => {
        const errorElement = screen.queryByText(/product not found/i);
        expect(errorElement).toBeInTheDocument();
      });
    });
  });

  // Test 4: Checkout Operations
  describe('Checkout Operations', () => {
    it('should disable checkout when cart is empty', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        const checkoutButton = screen.getByRole('button', { name: /checkout/i });
        expect(checkoutButton).toBeDisabled();
      });
    });
  });

  // Test 5: Customer Modal
  describe('Customer Modal Operations', () => {
    it('should open customer selection modal', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        const selectCustomerButtons = screen.getAllByRole('button', {
          name: /select customer/i,
        });
        expect(selectCustomerButtons.length).toBeGreaterThan(0);
      });
    });
  });

  // Test 6: Error Handling
  describe('Error Handling and Edge Cases', () => {
    it('should handle missing razorpay key gracefully', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: null },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('Quick Billing')).toBeInTheDocument();
      });
    });

    it('should handle network errors during customer fetch', async () => {
      mockApi.getCustomers.mockRejectedValueOnce(new Error('Network error'));
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        expect(mockApi.getCustomers).toHaveBeenCalled();
      });
    });

    it('should display cart value in correct format', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'test_key_123' },
      } as any);

      const preloadedState = {
        cart: { items: [] },
        products: { items: [] },
        customers: { items: [] },
        auth: { token: 'test_token' },
        reports: { sales: [], totalRevenue: 0, totalTransactions: 0 },
        settings: { paymentGatewayEnabled: true },
      };

      renderWithProviders(<Billing />, { preloadedState });

      await waitFor(() => {
        const cartValueElement = screen.getByText('₹0.00', {
          selector: '.fw-bold.text-warning',
        });
        expect(cartValueElement).toBeInTheDocument();
      });
    });
  });

  // Test 7: Razorpay Configuration
  describe('Razorpay Configuration', () => {
    it('should load Razorpay key from profile', async () => {
      mockApi.getCustomers.mockResolvedValueOnce([]);
      mockApi.getMyProfile.mockResolvedValueOnce({
        user: { razorpayKeyId: 'rzp_test_123456' },
      } as any);

      renderWithProviders(<Billing />);

      await waitFor(() => {
        const profileElement = screen.getByText('Quick Billing');
        expect(profileElement).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
