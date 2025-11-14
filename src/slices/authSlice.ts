import * as toolkit from '@reduxjs/toolkit';
const { createSlice } = toolkit;
type PayloadAction<T> = toolkit.PayloadAction<T>;
import type { User } from '../types';

interface AuthState {
  user: User | null
  token: string | null
  expiresAt: number | null
}

type LoginPayload = {
  user: User
  token: string
  expiresAt?: number | null
}

const STORAGE_KEY = 'auth'

let persisted: Partial<AuthState> | null = null
const stored = localStorage.getItem(STORAGE_KEY)
if (stored) {
  try {
    const parsed = JSON.parse(stored) as Partial<AuthState>
    if (parsed && typeof parsed === 'object') {
      persisted = parsed
    }
  } catch {
    // swallow malformed storage data
    localStorage.removeItem(STORAGE_KEY)
  }
}

const initialState: AuthState = {
  user: persisted?.user ?? null,
  token: persisted?.token ?? null,
  expiresAt: persisted && typeof persisted.expiresAt === 'number' ? persisted.expiresAt : null,
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
  loginSuccess(state, action: PayloadAction<LoginPayload>) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.expiresAt = action.payload.expiresAt ?? null
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: state.user,
          token: state.token,
          expiresAt: state.expiresAt,
        }),
      )
    },
    logout(state) {
      state.user = null
      state.token = null
      state.expiresAt = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})

export const { loginSuccess, logout } = slice.actions
export default slice.reducer
