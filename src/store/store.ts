import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'
import productsReducer from '../slices/productsSlice'
import cartReducer from '../slices/cartSlice'
import customersReducer from '../slices/customersSlice'
import reportsReducer from '../slices/reportsSlice'
import settingsReducer from '../slices/settingsSlice';
import refundsReducer from '../slices/refundsSlice';



const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productsReducer,
        cart: cartReducer,
        customers: customersReducer,
        reports: reportsReducer,
        settings: settingsReducer,
        refunds: refundsReducer,
    },
})


export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store