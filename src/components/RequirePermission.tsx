import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

const RequirePermission: React.FC<{ permission: string; children: React.ReactNode }> = ({
  permission,
  children,
}) => {
  const user = useAppSelector((s) => s.auth.user)

  if (!user) return <Navigate to="/" replace />

  const role = String(user.role || '').toLowerCase()
  if (role === 'admin') return <>{children}</>

  const perms = Array.isArray(user.permissions) ? user.permissions : []
  if (!perms.includes(permission)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

export default RequirePermission
