import React, { useState, useEffect } from 'react'
import { useAppSelector } from '../store/hooks'
import { toast } from '../utils/toast'
import { getStaffUsers, createStaffUser, updateStaffUser, deleteStaffUser, toggleStaffStatus } from '../api/api'
import type { User } from '../types'

interface StaffUser extends User {
  status: 'active' | 'inactive'
  createdAt: string
}

interface StaffApiResponse {
  _id: string  // MongoDB uses _id
  name: string
  email: string
  role: string
  permissions: string[]
  status: string
  createdAt: string
}

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'staff' | 'staffAdmin',
    permissions: [] as string[]
  })
  const [submitting, setSubmitting] = useState(false)
  
  const currentUser = useAppSelector(state => state.auth.user)

  const availablePermissions = [
    'products',
    'billing',
    'reports',
    'settings',
    'customers',
    'inventory'
  ]

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      console.log('Fetching staff users...')
      const response = await getStaffUsers()
      console.log('Staff API response:', response)
      const staffData: StaffUser[] = (response.staff || []).map((staffMember: StaffApiResponse) => ({
        id: staffMember._id,  // Use _id from MongoDB response
        username: staffMember.name || staffMember.email || 'Unknown', // Add required username field
        role: staffMember.role as 'admin' | 'staffAdmin' | 'staff',
        permissions: staffMember.permissions || [],
        email: staffMember.email,
        name: staffMember.name,
        status: staffMember.status as 'active' | 'inactive',
        createdAt: staffMember.createdAt
      }))
      console.log('Processed staff data:', staffData)
      setStaff(staffData)
    } catch (error: any) {
      console.error('Error fetching staff:', error)
      toast.error(error.message || 'Failed to fetch staff')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || (!formData.password && !editingStaff)) {
      toast.error('Please fill all required fields')
      return
    }

    console.log('Submitting staff form:', { editingStaff: !!editingStaff, formData });
    
    try {
      setSubmitting(true)
      if (editingStaff) {
        if (!editingStaff.id || editingStaff.id === 'undefined') {
          console.error('Invalid staff ID for update:', editingStaff.id);
          toast.error('Invalid staff member data');
          return;
        }
        console.log('Updating existing staff:', editingStaff.id, formData);
        await updateStaffUser(editingStaff.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions
        })
        toast.success('Staff updated successfully')
      } else {
        console.log('Creating new staff:', formData);
        await createStaffUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          permissions: formData.permissions
        })
        toast.success('Staff created successfully')
      }
      
      resetForm()
      fetchStaff()
    } catch (error: any) {
      console.error('Submit staff form error:', error);
      toast.error(error.message || 'Failed to save staff')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (staffMember: StaffUser) => {
    console.log('Editing staff member:', staffMember);
    if (!staffMember.id) {
      console.error('Staff member ID is undefined:', staffMember);
      toast.error('Invalid staff member data');
      return;
    }
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      email: staffMember.email || '',
      password: '',
      role: staffMember.role as 'staff' | 'staffAdmin',
      permissions: staffMember.permissions || []
    });
    setShowCreateForm(true);
  }

  const handleDelete = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return
    }

    if (!staffId || staffId === 'undefined') {
      console.error('Invalid staff ID for deletion:', staffId);
      toast.error('Invalid staff member ID');
      return;
    }

    console.log('Deleting staff member with ID:', staffId);
    try {
      await deleteStaffUser(staffId);
      toast.success('Staff deleted successfully');
      fetchStaff();
    } catch (error: any) {
      console.error('Delete staff error:', error);
      toast.error(error.message || 'Failed to delete staff');
    }
  }

  const handleToggleStatus = async (staffId: string, currentStatus: 'active' | 'inactive') => {
    if (!staffId || staffId === 'undefined') {
      console.error('Invalid staff ID for status toggle:', staffId);
      toast.error('Invalid staff member ID');
      return;
    }

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    console.log('Toggling staff status:', { staffId, currentStatus, newStatus });
    
    try {
      await toggleStaffStatus(staffId, newStatus);
      toast.success(`Staff ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchStaff();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error(error.message || 'Failed to update staff status');
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      permissions: []
    })
    setEditingStaff(null)
    setShowCreateForm(false)
  }

  const handlePermissionChange = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Access denied. Admin privileges required.
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 col-md-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-gradient text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Staff Management
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-success"
                  onClick={() => setShowCreateForm(true)}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Register New Staff
                </button>
              </div>
              
              <hr />
              
              <div className="text-muted small">
                <h6 className="text-dark mb-3">Statistics</h6>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Total Staff:</span>
                  <span className="badge bg-primary rounded-pill">{staff.length}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Active:</span>
                  <span className="badge bg-success rounded-pill">{staff.filter(s => s.status === 'active').length}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Inactive:</span>
                  <span className="badge bg-danger rounded-pill">{staff.filter(s => s.status === 'inactive').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-lg-9 col-md-8">
          {showCreateForm ? (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-dark">
                  {editingStaff ? 'Edit Staff Member' : 'Register New Staff Member'}
                </h5>
                <button
                  className="btn btn-outline-secondary btn-sm rounded-circle"
                  onClick={resetForm}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter staff member's full name"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Password {!editingStaff && '*'}</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder={editingStaff ? "Leave blank to keep current password" : "Enter password"}
                        required={!editingStaff}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Role *</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'staff' | 'staffAdmin' }))}
                        required
                      >
                        <option value="staff">Staff</option>
                        <option value="staffAdmin">Staff Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Permissions</label>
                    <div className="row">
                      {availablePermissions.map((permission) => (
                        <div key={permission} className="col-md-4 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={permission}
                              checked={formData.permissions.includes(permission)}
                              onChange={() => handlePermissionChange(permission)}
                            />
                            <label className="form-check-label text-capitalize" htmlFor={permission}>
                              {permission}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          {editingStaff ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          {editingStaff ? 'Update Staff' : 'Create Staff'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-dark">
                    <i className="bi bi-people me-2 text-primary"></i>
                    Registered Staff Members
                  </h5>
                  <span className="badge bg-primary rounded-pill">{staff.length} Members</span>
                </div>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading staff members...</p>
                  </div>
                ) : staff.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-people display-1 d-block mb-3 text-muted"></i>
                    <h5>No Staff Members Found</h5>
                    <p>Register your first staff member to get started.</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCreateForm(true)}
                    >
                      <i className="bi bi-person-plus me-2"></i>
                      Register First Staff Member
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>
                            <i className="bi bi-person me-1"></i>
                            Name
                          </th>
                          <th>
                            <i className="bi bi-envelope me-1"></i>
                            Email
                          </th>
                          <th>
                            <i className="bi bi-shield me-1"></i>
                            Role
                          </th>
                          <th>
                            <i className="bi bi-key me-1"></i>
                            Permissions
                          </th>
                          <th>
                            <i className="bi bi-toggle-on me-1"></i>
                            Status
                          </th>
                          <th className="text-center">
                            <i className="bi bi-gear me-1"></i>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map((staffMember) => (
                          <tr key={staffMember.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                                  {staffMember.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-semibold text-dark">{staffMember.name}</div>
                                  <small className="text-muted">ID: {staffMember.id.slice(-8)}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-envelope-fill text-muted me-2"></i>
                                {staffMember.email}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                staffMember.role === 'admin' ? 'bg-danger' : 
                                staffMember.role === 'staffAdmin' ? 'bg-warning' : 
                                'bg-info'
                              } text-white`}>
                                <i className={`bi ${
                                  staffMember.role === 'admin' ? 'bi-shield-fill' : 
                                  staffMember.role === 'staffAdmin' ? 'bi-shield-fill-exclamation' : 
                                  'bi-person-badge'
                                } me-1`}></i>
                                {staffMember.role}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {staffMember.permissions && staffMember.permissions.length > 0 ? (
                                  staffMember.permissions.map((permission, index) => (
                                    <span key={index} className="badge bg-light text-dark border">
                                      {permission}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted small">No permissions</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                staffMember.status === 'active' ? 'bg-success' : 'bg-secondary'
                              } text-white`}>
                                <i className={`bi ${
                                  staffMember.status === 'active' ? 'bi-check-circle-fill' : 'bi-pause-circle-fill'
                                } me-1`}></i>
                                {staffMember.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEdit(staffMember)}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className={`btn btn-sm ${
                                    staffMember.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'
                                  }`}
                                  onClick={() => handleToggleStatus(staffMember.id, staffMember.status)}
                                  title={staffMember.status === 'active' ? 'Deactivate' : 'Activate'}
                                >
                                  <i className={`bi ${
                                    staffMember.status === 'active' ? 'bi-pause' : 'bi-play'
                                  }`}></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete(staffMember.id)}
                                  title="Delete"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffManagement
