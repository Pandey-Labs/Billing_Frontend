import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store/hooks';
import { logout } from '../slices/authSlice';
import { toast } from '../utils/toast';
import { PersonCircle, Bell } from 'react-bootstrap-icons';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Logged out successfully');
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <header 
      className="bg-white border-bottom shadow-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '70px',
      }}
    >
      <div className="d-flex align-items-center justify-content-between h-100 px-3 px-md-4">
        {/* Left: Logo and Software Name */}
        <div className="d-flex align-items-center gap-3">
          <div
            className="brand-icon rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
            style={{ width: 40, height: 40, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            MS
          </div>
          <h4 className="mb-0 fw-bold text-primary" style={{ fontSize: '1.5rem' }}>
            MyShop
          </h4>
        </div>

        {/* Right: User Info & Actions */}
        <div className="d-flex align-items-center gap-3">
          {/* Current Time */}
          <div className="d-none d-md-flex align-items-center gap-2 text-muted">
            <i className="bi bi-clock"></i>
            <span className="small fw-semibold">{currentTime}</span>
          </div>

          {/* Notifications Icon */}
          <button
            className="btn btn-link text-muted p-2 position-relative"
            style={{
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Notifications"
          >
            <Bell size={20} />
            <span 
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.6rem', padding: '2px 4px' }}
            >
              0
            </span>
          </button>

          {/* User Profile Dropdown */}
          <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-link text-decoration-none d-flex align-items-center gap-2 p-0"
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                color: '#212529',
                border: 'none',
              }}
            >
              <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                   style={{ width: '40px', height: '40px' }}>
                <PersonCircle size={24} className="text-primary" />
              </div>
              <div className="d-none d-md-block text-start">
                <div className="fw-semibold small" style={{ lineHeight: '1.2' }}>
                  {user?.name || user?.username || 'Admin'}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                  {user?.role || 'Administrator'}
                </div>
              </div>
              <i className="bi bi-chevron-down d-none d-md-block text-muted"></i>
            </button>
            {showDropdown && (
              <ul 
                className="dropdown-menu dropdown-menu-end shadow-sm border-0 show"
                style={{ 
                  borderRadius: '8px', 
                  marginTop: '8px', 
                  minWidth: '200px',
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 1050,
                }}
              >
                <li>
                  <div className="px-3 py-2 border-bottom">
                    <div className="fw-semibold small">{user?.name || user?.username || 'Admin'}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user?.email || 'admin@example.com'}</div>
                  </div>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDropdown(false);
                      navigate("/profile");
                    }}
                  >
                    <i className="bi bi-person"></i>
                    Profile
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDropdown(false);
                      navigate("/settings");
                    }}
                  >
                    <i className="bi bi-gear"></i>
                    Settings
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
