import * as toolkit from '@reduxjs/toolkit';
const { createSlice } = toolkit;
type PayloadAction<T> = toolkit.PayloadAction<T>;
import type { Customer } from '../types';
import { v4 as uuidv4 } from 'uuid'


interface CustomersState { items: Customer[] }
const stored = localStorage.getItem('customers')
const initialState: CustomersState = { items: stored ? JSON.parse(stored) : [] }


const slice = createSlice({
    name: 'customers',
    initialState,
    reducers: {
        addCustomer(state, action: PayloadAction<Omit<Customer, 'id'>>) {
            state.items.push({ id: uuidv4(), ...action.payload })
            localStorage.setItem('customers', JSON.stringify(state.items))
        },
        updateCustomer(state, action: PayloadAction<Customer>) {
            const idx = state.items.findIndex(c => c.id === action.payload.id)
            if (idx >= 0) state.items[idx] = action.payload
            localStorage.setItem('customers', JSON.stringify(state.items))
        },
        removeCustomer(state, action: PayloadAction<string>) {
            state.items = state.items.filter(c => c.id !== action.payload)
            localStorage.setItem('customers', JSON.stringify(state.items))
        }
    }
})


export const { addCustomer, updateCustomer, removeCustomer } = slice.actions
export default slice.reducer