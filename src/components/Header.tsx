import React from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { logout } from '../slices/authSlice'


const Header: React.FC<{ onToggle?: () => void }> = ({ onToggle }) => {
    const user = useAppSelector(s => s.auth.user)
    const dispatch = useAppDispatch()
    return (
        <nav className="navbar navbar-light bg-light px-3 d-flex justify-content-between align-items-center">
            <div>
                <button className="btn btn-outline-secondary d-md-none" onClick={onToggle}>☰</button>
                <span className="ms-2 fw-bold">MyShop Billing</span>
            </div>
            <div className="d-flex align-items-center">
                <div className="me-3">{user ? `Role: ${user.role}` : ''}</div>
                {user && <button className="btn btn-sm btn-outline-danger" onClick={() => dispatch(logout())}>Logout</button>}
            </div>
        </nav>
    )
}


export default Header