import { createSlice } from '@reduxjs/toolkit';

export interface SettingsState {
  paymentGatewayEnabled: boolean;
  defaultTaxRate: number;
  invoicePrefix: string;
  autoDeductStock: boolean;
  // Add more settings as needed
}

const initialState: SettingsState = {
  paymentGatewayEnabled: false, // Default to OFF
  defaultTaxRate: 18,
  invoicePrefix: 'INV',
  autoDeductStock: true,
};

// Load settings from localStorage
const loadSettings = (): SettingsState => {
  try {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      return { ...initialState, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return initialState;
};

// Save settings to localStorage
const saveSettings = (state: SettingsState) => {
  try {
    localStorage.setItem('appSettings', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: loadSettings(),
  reducers: {
    togglePaymentGateway: (state) => {
      state.paymentGatewayEnabled = !state.paymentGatewayEnabled;
      saveSettings(state);
    },
    setPaymentGateway: (state, action) => {
      state.paymentGatewayEnabled = action.payload;
      saveSettings(state);
    },
    setDefaultTaxRate: (state, action) => {
      state.defaultTaxRate = action.payload;
      saveSettings(state);
    },
    setInvoicePrefix: (state, action) => {
      state.invoicePrefix = action.payload;
      saveSettings(state);
    },
    setAutoDeductStock: (state, action) => {
      state.autoDeductStock = action.payload;
      saveSettings(state);
    },
    resetSettings: (state) => {
      Object.assign(state, initialState);
      saveSettings(state);
    },
  },
});

export const {
  togglePaymentGateway,
  setPaymentGateway,
  setDefaultTaxRate,
  setInvoicePrefix,
  setAutoDeductStock,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;