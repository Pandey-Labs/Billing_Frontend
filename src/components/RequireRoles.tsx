import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

const RequireRoles: React.FC<{ roles: string[]; children: React.ReactNode }> = ({
  roles,
  children,
}) => {
  const user = useAppSelector((s) => s.auth.user)
  if (!user) return <Navigate to="/" replace />

  const role = String(user.role || '').toLowerCase()
  const allowed = roles.map((r) => String(r).toLowerCase())
  if (!allowed.includes(role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

export default RequireRoles
