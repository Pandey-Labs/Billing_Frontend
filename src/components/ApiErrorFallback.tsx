import React from 'react';
import { Card, Button } from 'react-bootstrap';

interface ApiErrorFallbackProps {
  error: string;
  onRetry?: () => void;
  title?: string;
  icon?: string;
}

const ApiErrorFallback: React.FC<ApiErrorFallbackProps> = ({ 
  error, 
  onRetry, 
  title = "Unable to Load Data",
  icon = "bi-exclamation-triangle"
}) => {
  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px', padding: '2rem' }}>
      <Card className="border-0 shadow-sm" style={{ maxWidth: '500px', width: '100%', borderRadius: '12px' }}>
        <Card.Body className="text-center p-5">
          <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
               style={{ width: '100px', height: '100px' }}>
            <i className={`bi ${icon} text-danger`} style={{ fontSize: '3rem' }}></i>
          </div>
          <h4 className="fw-bold mb-3">{title}</h4>
          <p className="text-muted mb-4">{error}</p>
          <div className="d-flex gap-3 justify-content-center">
            <Button 
              variant="primary" 
              onClick={handleRefresh}
              className="px-4"
              style={{ borderRadius: '8px' }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh Page
            </Button>
            {onRetry && (
              <Button 
                variant="outline-primary" 
                onClick={onRetry}
                className="px-4"
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-arrow-repeat me-2"></i>
                Retry
              </Button>
            )}
          </div>
          <p className="text-muted small mt-4 mb-0">
            If the problem persists, please check your internet connection or contact support.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ApiErrorFallback;

