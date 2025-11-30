import React, { useMemo, useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { removeCustomer, addCustomer, updateCustomer, setCustomers } from "../slices/customersSlice";
import { Modal, Button, Card } from "react-bootstrap";
import { toast } from "../utils/toast";
import type { Customer } from "../types";
import { getCustomers, createCustomer, updateCustomer as updateCustomerAPI, deleteCustomer, ApiError } from "../api/api";
import ApiErrorFallback from "../components/ApiErrorFallback";

const placeholder = "—";

const Customers: React.FC = () => {
  const dispatch = useAppDispatch();
  const customers = useAppSelector((s) => s.customers.items ?? []);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasApiError, setHasApiError] = useState(false);

  // Fetch customers from API on mount
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setApiError(null);
      setHasApiError(false);
      const data = await getCustomers();
      
      // Validate API response
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid API response format');
      }
      
      dispatch(setCustomers(data || []));
      setHasApiError(false);
    } catch (error) {
      console.error('[Customers] Failed to fetch customers:', error);
      setHasApiError(true);
      if (error instanceof ApiError) {
        setApiError(`Failed to load customers: ${error.message}`);
        toast.error(`Failed to load customers: ${error.message}`);
      } else if (error instanceof Error) {
        setApiError(`Failed to load customers: ${error.message}`);
        toast.error(`Failed to load customers: ${error.message}`);
      } else {
        setApiError('Failed to load customers. The API response could not be handled.');
        toast.error('Failed to load customers. Please try again.');
      }
      // Keep existing Redux state if API fails
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [dispatch]);

  const totalCustomers = customers.length;
  const customersWithEmail = customers.filter((c) => c.email && c.email.trim()).length;
  const customersWithPhone = customers.filter((c) => c.phone && c.phone.trim()).length;
  const topCustomers = useMemo(() => {
    if (customers.length === 0) return [];
    return customers
      .slice()
      .sort((a, b) => (b.name || "").localeCompare(a.name || ""))
      .slice(0, Math.min(customers.length, 4));
  }, [customers]);

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const validate = () => {
    const errs: { phone?: string; email?: string; name?: string } = {};
    if (!form.name.trim()) {
      errs.name = 'Name is required';
    }
    if (!(form.phone || '').trim()) {
      errs.phone = 'Phone is required';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test((form.phone || '').trim())) {
      errs.phone = 'Enter a valid phone number';
    }
    if (!(form.email || '').trim()) {
      errs.email = 'Email is required';
    } else if (!/^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/.test((form.email || '').trim())) {
      errs.email = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setForm({ name: customer.name || '', phone: customer.phone || '', email: customer.email || '' });
    } else {
      setEditingCustomer(null);
      setForm({ name: '', phone: '', email: '' });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setForm({ name: '', phone: '', email: '' });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      const customerData = { 
        name: capitalizeFirst(form.name.trim()),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      };
      
      if (editingCustomer) {
        // Update customer via API
        const updated = await updateCustomerAPI(editingCustomer.id, customerData);
        dispatch(updateCustomer(updated));
      } else {
        // Create customer via API
        const created = await createCustomer(customerData);
        dispatch(addCustomer(created));
      }
      handleCloseModal();
    } catch (error) {
      console.error('[Customers] Failed to save customer:', error);
      if (error instanceof ApiError) {
        if (error.details && typeof error.details === 'object' && 'details' in error.details) {
          const validationErrors = (error.details as any).details || [];
          const errs: { [key: string]: string } = {};
          validationErrors.forEach((err: any) => {
            if (err.path) {
              errs[err.path] = err.message;
            }
          });
          setErrors(errs);
        } else {
          toast.error(`Failed to save customer: ${error.message}`);
        }
      } else {
        toast.error('Failed to save customer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteCustomer(id);
      dispatch(removeCustomer(id));
    } catch (error) {
      console.error('[Customers] Failed to delete customer:', error);
      if (error instanceof ApiError) {
        toast.error(`Failed to delete customer: ${error.message}`);
      } else {
        toast.error('Failed to delete customer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show error fallback if API failed and no customers in store
  if (hasApiError && apiError && customers.length === 0) {
    return (
      <div className="customers-page themed-page py-4 px-3">
        <ApiErrorFallback 
          error={apiError}
          onRetry={fetchCustomers}
          title="Unable to Load Customers"
          icon="bi-people-fill"
        />
      </div>
    );
  }

  return (
    <div className="customers-page themed-page py-4 px-3">
      {/* Compact Header with Stats */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div className="d-flex flex-column">
            <h3 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: '1.75rem' }}>
              <i className="bi bi-people-fill text-primary" style={{ fontSize: '2rem' }}></i>
              Customers
            </h3>
            <p className="mb-0 text-muted">
              Manage your customers, their contact details, and billing history in one view.
            </p>
          </div>
        </div>
        <div className="col-12 col-lg-4 d-flex align-items-start justify-content-lg-end">
          <Button
            variant="primary"
            size="lg"
            className="shadow-sm fw-semibold w-100 w-lg-auto"
            onClick={() => handleOpenModal()}
            style={{
              transition: 'all 0.3s ease',
              borderRadius: '8px',
              minWidth: '160px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <i className="bi bi-person-plus-fill me-2"></i>
            Add Customer
          </Button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <Card className="border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: "20ms", borderRadius: '12px', overflow: 'hidden' }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-people-fill text-info" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                      Total Customers
                    </div>
                    <div className="fw-bold text-info" style={{ fontSize: '2rem', lineHeight: '1.2' }}>
                      {totalCustomers}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-12 col-md-4">
          <Card className="border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: "40ms", borderRadius: '12px', overflow: 'hidden' }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-envelope-fill text-warning" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                      With Email
                    </div>
                    <div className="fw-bold text-warning" style={{ fontSize: '2rem', lineHeight: '1.2' }}>
                      {customersWithEmail}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-12 col-md-4">
          <Card className="border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: "60ms", borderRadius: '12px', overflow: 'hidden' }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-telephone-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                      With Phone
                    </div>
                    <div className="fw-bold text-success" style={{ fontSize: '2rem', lineHeight: '1.2' }}>
                      {customersWithPhone}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm border-0 animate-slide-up" style={{ animationDelay: "100ms", borderRadius: '12px', overflow: 'hidden' }}>
        <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4">
          <span className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-list-ul text-primary"></i>
            Customer Directory
          </span>
          <span className="badge bg-primary text-white px-3 py-2" style={{ fontSize: '0.85rem', borderRadius: '20px' }}>
            {totalCustomers} {totalCustomers === 1 ? "customer" : "customers"}
          </span>
        </Card.Header>
        <Card.Body className="p-0">
          {loadingCustomers ? (
            <div className="empty-state text-center py-5 px-4">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="empty-state text-center py-5 px-4">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
                <i className="bi bi-people fs-1 text-muted"></i>
              </div>
              <h5 className="fw-semibold mb-2">No customers yet</h5>
              <p className="text-muted mb-4">
                Get started by adding your first customer to the system.
              </p>
              <Button variant="primary" size="lg" onClick={() => handleOpenModal()} className="shadow-sm">
                <i className="bi bi-person-plus-fill me-2"></i>
                Add Your First Customer
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4 py-3 fw-semibold" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-person me-2 text-primary"></i>Name
                    </th>
                    <th scope="col" className="py-3 fw-semibold" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-telephone me-2 text-primary"></i>Phone
                    </th>
                    <th scope="col" className="py-3 fw-semibold" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-envelope me-2 text-primary"></i>Email
                    </th>
                    <th scope="col" style={{ width: "200px", fontSize: '0.9rem' }} className="text-center py-3 fw-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.id} className="customer-row" style={{ transition: 'background-color 0.2s ease' }}>
                      <td className="fw-semibold ps-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                            <i className="bi bi-person-fill text-primary"></i>
                          </div>
                          <span>{customer.name?.trim() || `${placeholder} #${index + 1}`}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        {customer.phone?.trim() ? (
                          <a href={`tel:${customer.phone}`} className="text-decoration-none text-primary">
                            <i className="bi bi-telephone me-1"></i>
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="text-muted">{placeholder}</span>
                        )}
                      </td>
                      <td className="py-3">
                        {customer.email?.trim() ? (
                          <a href={`mailto:${customer.email}`} className="text-decoration-none text-primary">
                            <i className="bi bi-envelope me-1"></i>
                            {customer.email}
                          </a>
                        ) : (
                          <span className="text-muted">{placeholder}</span>
                        )}
                      </td>
                      <td className="py-3">
                          <div className="d-flex flex-wrap gap-2 justify-content-center">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleOpenModal(customer)}
                              title="Edit customer"
                              style={{ borderRadius: '6px' }}
                            >
                              <i className="bi bi-pencil-square"></i>
                              <span className="d-none d-md-inline ms-1">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDelete(customer.id)}
                              title="Delete customer"
                              style={{ borderRadius: '6px' }}
                            >
                              <i className="bi bi-trash3"></i>
                              <span className="d-none d-md-inline ms-1">Delete</span>
                            </button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {topCustomers.length > 0 && (
        <Card className="shadow-sm border-0 mt-4 animate-slide-up" style={{ animationDelay: "140ms", borderRadius: '12px', overflow: 'hidden' }}>
          <Card.Header className="bg-white border-bottom py-3 px-4">
            <span className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.1rem' }}>
              <i className="bi bi-star-fill text-warning"></i>
              Frequent Customers
            </span>
          </Card.Header>
          <Card.Body className="p-4">
            <div className="row g-3">
              {topCustomers.map((customer) => (
                <div className="col-12 col-sm-6 col-lg-3" key={customer.id}>
                  <Card className="h-100 border shadow-sm" style={{ borderRadius: '10px', transition: 'transform 0.2s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', minWidth: '45px' }}>
                          <i className="bi bi-person-fill text-primary"></i>
                        </div>
                        <h6 className="fw-semibold mb-0">{customer.name || placeholder}</h6>
                      </div>
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">
                          <i className="bi bi-envelope me-1"></i>
                          {customer.email || placeholder}
                        </small>
                        <small className="text-muted d-block">
                          <i className="bi bi-telephone me-1"></i>
                          {customer.phone || placeholder}
                        </small>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary flex-fill"
                          onClick={() => handleOpenModal(customer)}
                          style={{ borderRadius: '6px' }}
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger flex-fill"
                          onClick={() => handleDelete(customer.id)}
                          style={{ borderRadius: '6px' }}
                        >
                          <i className="bi bi-trash3 me-1"></i>
                          Delete
                        </button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Customer Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center gap-2">
            <i className="bi bi-person-plus-fill"></i>
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </Modal.Title>
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-12">
                <label className="form-label">
                  Full Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  className={`form-control glow-control${errors.name ? ' is-invalid' : ''}`}
                  placeholder="Enter customer full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Phone Number <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  className={`form-control glow-control${errors.phone ? ' is-invalid' : ''}`}
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  maxLength={15}
                  required
                />
                {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Email Address <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  className={`form-control glow-control${errors.email ? ' is-invalid' : ''}`}
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {editingCustomer ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;