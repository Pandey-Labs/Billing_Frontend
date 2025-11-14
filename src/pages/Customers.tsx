import React, { useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Link } from "react-router-dom";
import { removeCustomer } from "../slices/customersSlice";

const placeholder = "—";

const Customers: React.FC = () => {
  const dispatch = useAppDispatch();
  const customers = useAppSelector((s) => s.customers.items ?? []);

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

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      dispatch(removeCustomer(id));
    }
  };

  return (
    <div className="customers-page themed-page py-4">
      <div className="page-header card border-0 gradient-bg text-white mb-4 overflow-hidden">
        <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-4">
          <div>
            <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-people-fill"></i>
              Customers
            </h3>
            <p className="mb-0 text-white-50">
              Manage your customers, their contact details, and billing history in one view.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-3">
            <Link to="/customers/new" className="btn btn-light btn-lg shadow-sm">
              <i className="bi bi-person-plus-fill me-2"></i>
              Add Customer
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="stat-chip surface-chip animate-slide-up w-100" style={{ animationDelay: "20ms" }}>
            <span className="chip-label">Total Customers</span>
            <span className="chip-value text-info">{totalCustomers}</span>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="stat-chip surface-chip animate-slide-up w-100" style={{ animationDelay: "40ms" }}>
            <span className="chip-label">With Email</span>
            <span className="chip-value text-warning">{customersWithEmail}</span>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="stat-chip surface-chip animate-slide-up w-100" style={{ animationDelay: "60ms" }}>
            <span className="chip-label">With Phone</span>
            <span className="chip-value text-success">{customersWithPhone}</span>
          </div>
        </div>
      </div>

      <div className="card shadow-sm themed-card animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Customer Directory</span>
          <span className="badge bg-light text-dark">
            {totalCustomers} customer{totalCustomers === 1 ? "" : "s"}
          </span>
        </div>
        <div className="card-body p-0">
          {customers.length === 0 ? (
            <div className="empty-state text-center py-5">
              <i className="bi bi-people fs-1 mb-2 d-block text-muted"></i>
              <p className="text-muted mb-0">
                No customers found. Click “Add Customer” to create your first entry.
              </p>
            </div>
          ) : (
            <div className="table-responsive customers-table-wrapper">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Email</th>
                    <th scope="col" style={{ width: "160px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.id}>
                      <td className="fw-semibold">
                        {customer.name?.trim() || `${placeholder} #${index + 1}`}
                      </td>
                      <td>{customer.phone?.trim() || placeholder}</td>
                      <td>{customer.email?.trim() || placeholder}</td>
                      <td>
                          <div className="d-flex flex-wrap gap-2">
                            <Link
                              to={`/customers/edit/${customer.id}`}
                              className="btn btn-outline-primary btn-sm flex-fill flex-md-grow-0"
                            >
                              <i className="bi bi-pencil-square me-1"></i>
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm flex-fill flex-md-grow-0"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <i className="bi bi-trash3 me-1"></i>
                              Delete
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

      {topCustomers.length > 0 && (
        <div className="card shadow-sm themed-card mt-4 animate-slide-up" style={{ animationDelay: "140ms" }}>
          <div className="card-header fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-star-fill text-warning"></i>
            Frequent Customers
          </div>
          <div className="card-body">
            <div className="row g-3">
              {topCustomers.map((customer) => (
                <div className="col-12 col-sm-6 col-lg-3" key={customer.id}>
                  <div className="floating-card h-100">
                    <h6 className="fw-semibold mb-1">{customer.name || placeholder}</h6>
                    <small className="text-muted d-block mb-2">
                      {customer.email || placeholder} · {customer.phone || placeholder}
                    </small>
                    <div className="d-flex flex-wrap gap-2">
                      <Link
                        to={`/customers/edit/${customer.id}`}
                        className="btn btn-sm btn-outline-primary flex-fill"
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger flex-fill"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <i className="bi bi-trash3 me-1"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;