import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import type { RootState } from '../store/store'
import { createStaffUser, ApiError } from '../api/api'
import { toast } from '../utils/toast'

const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'billing', label: 'Billing' },
  { key: 'customers', label: 'Customers' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
  { key: 'admin', label: 'Admin' },
]

const StaffForm: React.FC = () => {
  const nav = useNavigate()
  const token = useAppSelector((s: RootState) => s.auth.token) || undefined
  const currentUser = useAppSelector((s: RootState) => s.auth.user)

  const currentRole = String(currentUser?.role || '').toLowerCase()

  const roleOptions = useMemo(() => {
    if (currentRole === 'admin') return ['staffAdmin', 'staff']
    if (currentRole === 'staffadmin') return ['staff']
    return []
  }, [currentRole])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(roleOptions[0] || 'staff')
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const togglePermission = (p: string) => {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    try {
      await createStaffUser(
        {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          permissions,
        },
        { token },
      )
      toast.success('Staff user created')
      setTimeout(() => nav('/admin'), 600)
    } catch (err) {
      const anyErr = err as any
      const message =
        err instanceof ApiError
          ? err.message
          : typeof anyErr?.details?.error === 'string'
            ? anyErr.details.error
            : typeof anyErr?.response?.data?.error === 'string'
              ? anyErr.response.data.error
              : typeof anyErr?.message === 'string'
                ? anyErr.message
                : 'Failed to create staff'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid py-4 px-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-0 fw-bold">Create Staff</h4>
          <div className="text-muted small">Create tenant staff accounts</div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Name</label>
                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={roleOptions.length === 0}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {roleOptions.length === 0 && (
                  <div className="text-danger small mt-1">You are not allowed to create users.</div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Permissions</label>
                <div className="row g-2">
                  {PERMISSIONS.map((p) => (
                    <div key={p.key} className="col-12 col-sm-6 col-lg-4">
                      <label className="form-check d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={permissions.includes(p.key)}
                          onChange={() => togglePermission(p.key)}
                        />
                        <span className="form-check-label">{p.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="text-muted small mt-1">
                  Admin users bypass permissions automatically.
                </div>
              </div>

              <div className="col-12 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => nav(-1)} disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || roleOptions.length === 0}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StaffForm
