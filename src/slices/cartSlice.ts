import * as toolkit from '@reduxjs/toolkit';
const { createSlice } = toolkit;
type PayloadAction<T> = toolkit.PayloadAction<T>;
import type { CartItem, Customer } from '../types';
import { v4 as uuidv4 } from 'uuid'


interface CartState { items: CartItem[]; customer?: Customer | null; payments: { method: string; amount: number }[] }
const initialState: CartState = { items: [], customer: null, payments: [] }


const slice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart(state, action: PayloadAction<Omit<CartItem, 'id'>>) {
            const existing = state.items.find(i => i.productId === action.payload.productId)
            if (existing) existing.qty += action.payload.qty
            else state.items.push({ id: uuidv4(), ...action.payload })
        },
        updateQty(state, action: PayloadAction<{ id: string; qty: number }>) {
            const it = state.items.find(i => i.id === action.payload.id)
            if (it) it.qty = action.payload.qty
        },
        removeFromCart(state, action: PayloadAction<string>) {
            state.items = state.items.filter(i => i.id !== action.payload)
        },
        clearCart(state) { state.items = []; state.customer = null; state.payments = [] },
        setCustomer(state, action: PayloadAction<Customer | null>) { state.customer = action.payload },
        addPayment(state, action: PayloadAction<{ method: string; amount: number }>) { state.payments.push(action.payload) },
    }
})


export const { addToCart, updateQty, removeFromCart, clearCart, setCustomer, addPayment } = slice.actions
export default slice.reducer