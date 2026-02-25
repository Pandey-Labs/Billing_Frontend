import React from 'react'
import { useNavigate } from 'react-router-dom'


const Admin: React.FC = () => {
    const navigate = useNavigate()
    return (
        <div className="container-fluid py-4 px-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h3 className="mb-0">Admin</h3>
                    <p className="text-muted mb-0">Manage staff, permissions, expenses, suppliers, and backup / restore (needs backend).</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/admin/staff/new')}>
                    <i className="bi bi-person-plus me-2"></i>
                    Create Staff
                </button>
            </div>
        </div>
    )
}
export default Admin
