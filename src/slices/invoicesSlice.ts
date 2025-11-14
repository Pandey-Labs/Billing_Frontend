// src/slices/invoicesSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  taxPercent: number;
}

interface Invoice {
  id: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface InvoicesState {
  list: Invoice[];
}

const initialState: InvoicesState = {
  list: [],
};

const invoicesSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.list.push(action.payload);
    },
  },
});

export const { addInvoice } = invoicesSlice.actions;
export default invoicesSlice.reducer;
