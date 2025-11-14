import React, { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchProducts } from '../slices/productsSlice'


const ProtectedRoute: React.FC = () => {
const user = useAppSelector(s => s.auth.user)
const productsStatus = useAppSelector(s => s.products.status)
const dispatch = useAppDispatch()

useEffect(() => {
  if (user && productsStatus === 'idle') {
    dispatch(fetchProducts())
  }
}, [dispatch, user, productsStatus])

if (!user) return <Navigate to="/" replace />
return <Outlet />
}


export default ProtectedRoute