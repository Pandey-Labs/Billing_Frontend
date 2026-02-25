import * as toolkit from '@reduxjs/toolkit';
const { createSlice } = toolkit;
type PayloadAction<T> = toolkit.PayloadAction<T>;
import type { EnhancedInvoice } from '../types';


interface ReportsState { sales: EnhancedInvoice[] }
const stored = localStorage.getItem('sales')
const initialState: ReportsState = { sales: stored ? JSON.parse(stored) : [] }


const slice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        addSale(state, action: PayloadAction<EnhancedInvoice>) { state.sales.push(action.payload); localStorage.setItem('sales', JSON.stringify(state.sales)) },
        loadSales(state) { state.sales = JSON.parse(localStorage.getItem('sales') || '[]') },
        setSales(state, action: PayloadAction<EnhancedInvoice[]>) { state.sales = action.payload; localStorage.setItem('sales', JSON.stringify(state.sales)) },
    }
})


export const { addSale, loadSales, setSales } = slice.actions
export default slice.reducer