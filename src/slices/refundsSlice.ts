import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import { ApiError, createRefund as createRefundApi } from '../api/api';

export const createRefund = createAsyncThunk(
    'refunds/create',
    async (refundData: any, { getState, rejectWithValue }) => {
        try {
            const token = (getState() as RootState).auth.token || undefined;
            const response = await createRefundApi(refundData, { token });
            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                // Extract detailed error message from API response
                const errorDetails = error.details as any;
                const errorMessage = errorDetails?.message || error.message || 'Failed to create refund';
                return rejectWithValue(errorMessage);
            }
            return rejectWithValue('Failed to create refund');
        }
    }
);

interface RefundsState {
    loading: boolean;
    error: any;
}

const initialState: RefundsState = {
    loading: false,
    error: null,
};

const refundsSlice = createSlice({
    name: 'refunds',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createRefund.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createRefund.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createRefund.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default refundsSlice.reducer;
