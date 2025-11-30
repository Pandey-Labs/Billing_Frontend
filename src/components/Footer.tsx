import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="bg-light border-top mt-auto py-3"
      style={{
        marginTop: 'auto',
        paddingTop: '1rem',
        paddingBottom: '1rem',
      }}
    >
      <div className="container-fluid px-4">
        <div className="row align-items-center">
          <div className="col-12 col-md-6 text-center text-md-start mb-2 mb-md-0">
            <p className="mb-0 text-muted small">
              © {currentYear} <strong>Billing Sphere</strong>. All rights reserved.
            </p>
          </div>
          <div className="col-12 col-md-6 text-center text-md-end">
            <p className="mb-0 text-muted small">
              Powered by <strong>MyShop</strong> | Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

