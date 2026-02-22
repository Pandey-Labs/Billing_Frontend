import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const NotFound: React.FC = () => {
  useEffect(() => {
    // Prevent scrolling on the 404 page
    document.body.style.overflow = 'hidden'
    
    // Cleanup: restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div 
      className="d-flex flex-column justify-content-center align-items-center" 
      style={{ 
        minHeight: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f8f9fa',
        zIndex: 9999
      }}
    >
      <div className="text-center">
        <div className="mb-4">
          <i className="bi bi-exclamation-triangle display-1 text-warning"></i>
        </div>
        <h1 className="display-1 fw-bold text-muted">404</h1>
        <h2 className="h3 mb-3 text-muted">Page Not Found</h2>
        <p className="lead text-muted mb-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <Link to="/dashboard" className="btn btn-primary">
            <i className="bi bi-house me-2"></i>
            Go to Dashboard
          </Link>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => window.history.back()}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
