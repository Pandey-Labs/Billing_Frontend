import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form } from 'react-bootstrap';
import { toast } from '../utils/toast';
import type { RootState } from '../store/store';
import {
  togglePaymentGateway,
  setDefaultTaxRate,
  setInvoicePrefix,
  setAutoDeductStock,
  resetSettings,
} from '../slices/settingsSlice';

const OPTIONS = [
  { id: 'dashboard', label: 'Dashboard Settings', icon: 'bi-speedometer2' },
  { id: 'products', label: 'Product Settings', icon: 'bi-box-seam' },
  { id: 'billing', label: 'Billing Settings', icon: 'bi-receipt' },
  { id: 'customers', label: 'Customer Settings', icon: 'bi-people' },
  { id: 'reports', label: 'Reports Settings', icon: 'bi-graph-up' },
];

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const [active, setActive] = useState<string>('billing');
  const [localTaxRate, setLocalTaxRate] = useState(settings.defaultTaxRate.toString());
  const [localInvoicePrefix, setLocalInvoicePrefix] = useState(settings.invoicePrefix);

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const razorpayConfigured = !!razorpayKey;

  const handleTogglePaymentGateway = () => {
    if (!razorpayConfigured && !settings.paymentGatewayEnabled) {
      toast.error('Razorpay key not configured. Set VITE_RAZORPAY_KEY_ID in your .env file.');
      return;
    }
    dispatch(togglePaymentGateway());
    toast.success(
      settings.paymentGatewayEnabled
        ? 'Payment gateway disabled. Bills will be created directly.'
        : 'Payment gateway enabled.'
    );
  };

  const handleTaxRateChange = () => {
    const rate = parseFloat(localTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Please enter a valid tax rate between 0 and 100');
      return;
    }
    dispatch(setDefaultTaxRate(rate));
    toast.success('Default tax rate updated');
  };

  const handleInvoicePrefixChange = () => {
    if (!localInvoicePrefix.trim()) {
      toast.error('Invoice prefix cannot be empty');
      return;
    }
    dispatch(setInvoicePrefix(localInvoicePrefix.trim()));
    toast.success('Invoice prefix updated');
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      dispatch(resetSettings());
      setLocalTaxRate('18');
      setLocalInvoicePrefix('INV');
      toast.success('Settings reset to default');
    }
  };

  return (
    <div className="themed-page p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <div 
            className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: '50px', height: '50px' }}
          >
            <i className="bi bi-gear-fill text-primary" style={{ fontSize: '1.5rem' }}></i>
          </div>
          <div>
            <h2 className="mb-0 fw-bold">Settings</h2>
            <p className="mb-0 text-muted small">Configure your application preferences</p>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Sidebar */}
        <aside className="col-lg-3 col-md-4 mb-4">
          <div className="card shadow-sm border-0">
            <div className="list-group list-group-flush">
              {OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActive(option.id)}
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-3 border-0 ${
                    active === option.id ? 'active' : ''
                  }`}
                  style={{
                    transition: 'all 0.2s ease',
                    borderRadius: active === option.id ? '8px' : '0',
                  }}
                >
                  <i className={`bi ${option.icon}`} style={{ fontSize: '1.2rem' }}></i>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-lg-9 col-md-8">
          {active === 'dashboard' && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard Settings
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted">Configure dashboard widgets, default date range, and layout preferences.</p>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Dashboard customization coming soon!
                </div>
              </div>
            </div>
          )}

          {active === 'products' && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-box-seam me-2"></i>
                  Product Settings
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted">Configure product SKU rules, default tax, and inventory thresholds.</p>
                
                {/* Default Tax Rate */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Default Tax Rate (%)</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      value={localTaxRate}
                      onChange={(e) => setLocalTaxRate(e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <button className="btn btn-primary" onClick={handleTaxRateChange}>
                      Update
                    </button>
                  </div>
                  <small className="text-muted">Current: {settings.defaultTaxRate}%</small>
                </div>

                {/* Auto Deduct Stock */}
                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="auto-deduct-stock"
                    label="Automatically deduct stock on sale"
                    checked={settings.autoDeductStock}
                    onChange={(e) => {
                      dispatch(setAutoDeductStock(e.target.checked));
                      toast.success(
                        e.target.checked
                          ? 'Auto stock deduction enabled'
                          : 'Auto stock deduction disabled'
                      );
                    }}
                  />
                  <small className="text-muted d-block mt-1">
                    When enabled, stock will be automatically reduced when a sale is completed.
                  </small>
                </div>
              </div>
            </div>
          )}

          {active === 'billing' && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-receipt me-2"></i>
                  Billing Settings
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-4">Configure invoice defaults, payment gateway, and receipt templates.</p>

                {/* Payment Gateway Toggle */}
                <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h6 className="fw-semibold mb-2">
                        <i className="bi bi-credit-card me-2 text-primary"></i>
                        Payment Gateway (Razorpay)
                      </h6>
                      <p className="text-muted small mb-2">
                        {settings.paymentGatewayEnabled
                          ? 'Payment gateway is currently enabled. Customers will be prompted to pay via Razorpay.'
                          : 'Payment gateway is currently disabled. Bills will be created directly without payment processing.'}
                      </p>
                      
                      {/* Razorpay Status */}
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="small fw-semibold">Status:</span>
                        {razorpayConfigured ? (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i>
                            Configured
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Not Configured
                          </span>
                        )}
                      </div>

                      {!razorpayConfigured && (
                        <div className="alert alert-warning mb-0 py-2 px-3">
                          <small>
                            <i className="bi bi-info-circle me-2"></i>
                            To enable payment gateway, add <code>VITE_RAZORPAY_KEY_ID</code> to your .env file.
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Toggle Switch */}
                    <Form.Check
                      type="switch"
                      id="payment-gateway-toggle"
                      checked={settings.paymentGatewayEnabled}
                      onChange={handleTogglePaymentGateway}
                      style={{ fontSize: '1.5rem' }}
                      disabled={!razorpayConfigured && !settings.paymentGatewayEnabled}
                    />
                  </div>

                  {/* Current State Info */}
                  <div className={`p-2 rounded ${settings.paymentGatewayEnabled ? 'bg-success bg-opacity-10 border border-success' : 'bg-secondary bg-opacity-10 border border-secondary'}`}>
                    <small className={`fw-semibold ${settings.paymentGatewayEnabled ? 'text-success' : 'text-secondary'}`}>
                      <i className={`bi ${settings.paymentGatewayEnabled ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
                      {settings.paymentGatewayEnabled
                        ? 'Checkout will open Razorpay payment gateway'
                        : 'Checkout will create bill directly (no payment processing)'}
                    </small>
                  </div>
                </div>

                {/* Invoice Prefix */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Invoice Prefix</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={localInvoicePrefix}
                      onChange={(e) => setLocalInvoicePrefix(e.target.value)}
                      placeholder="e.g., INV, BILL"
                      maxLength={10}
                    />
                    <button className="btn btn-primary" onClick={handleInvoicePrefixChange}>
                      Update
                    </button>
                  </div>
                  <small className="text-muted">Current: {settings.invoicePrefix}</small>
                </div>

                {/* Info Box */}
                <div className="alert alert-info">
                  <h6 className="alert-heading">
                    <i className="bi bi-lightbulb me-2"></i>
                    How it works
                  </h6>
                  <ul className="mb-0 small">
                    <li><strong>Gateway Enabled:</strong> Clicking checkout will open Razorpay payment modal</li>
                    <li><strong>Gateway Disabled:</strong> Clicking checkout will immediately create the invoice</li>
                    <li>You can toggle this setting anytime based on your business needs</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {active === 'customers' && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Customer Settings
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted">Configure customer fields, default currency, and import/export options.</p>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Customer settings coming soon!
                </div>
              </div>
            </div>
          )}

          {active === 'reports' && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  Reports Settings
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted">Configure default report ranges, export formats, and scheduled reports.</p>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Report customization coming soon!
                </div>
              </div>
            </div>
          )}

          {/* Reset Settings Button */}
          <div className="mt-4">
            <button className="btn btn-outline-danger" onClick={handleResetSettings}>
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Reset All Settings to Default
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;