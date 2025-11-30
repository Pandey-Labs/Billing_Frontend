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
        addCustomer(state, action: PayloadAction<Customer | Omit<Customer, 'id'>>) {
            // Handle both full Customer (from API) and partial Customer (from local)
            if ('id' in action.payload && action.payload.id) {
                state.items.push(action.payload as Customer)
            } else {
                state.items.push({ id: uuidv4(), ...action.payload })
            }
            localStorage.setItem('customers', JSON.stringify(state.items))
        },
        setCustomers(state, action: PayloadAction<Customer[]>) {
            state.items = action.payload
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


export const { addCustomer, setCustomers, updateCustomer, removeCustomer } = slice.actions
export default slice.reducer