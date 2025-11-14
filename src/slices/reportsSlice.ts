import * as toolkit from '@reduxjs/toolkit';
const { createSlice } = toolkit;
type PayloadAction<T> = toolkit.PayloadAction<T>;
import type { Invoice } from '../types';


interface ReportsState { sales: Invoice[] }
const stored = localStorage.getItem('sales')
const initialState: ReportsState = { sales: stored ? JSON.parse(stored) : [] }


const slice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        addSale(state, action: PayloadAction<Invoice>) { state.sales.push(action.payload); localStorage.setItem('sales', JSON.stringify(state.sales)) },
        loadSales(state) { state.sales = JSON.parse(localStorage.getItem('sales') || '[]') },
    }
})


export const { addSale, loadSales } = slice.actions
export default slice.reducer