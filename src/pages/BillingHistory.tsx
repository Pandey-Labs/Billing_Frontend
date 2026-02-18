import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store/store';
import { getBillingHistory, ApiError } from '../api/api.js';
import { toast } from '../utils/toast';
import RefundModal from '../components/RefundModal';
import type { Invoice } from '../types';

const BillingHistory: React.FC = () => {
  const token = useAppSelector((state: RootState) => state.auth.token) || undefined;
  const [history, setHistory] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const openRefundModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsRefundModalOpen(true);
  };

  const closeRefundModal = () => {
    setSelectedInvoice(null);
    setIsRefundModalOpen(false);
  };

  const openViewModal = (invoice: Invoice) => {
    setViewInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewInvoice(null);
  };

  const fetchBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBillingHistory({ token });
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[BillingHistory] Failed to fetch:', err);
      if (err instanceof ApiError) {
        setError(`Failed to load billing history: ${err.message}`);
        toast.error(`Failed to load billing history: ${err.message}`);
      } else if (err instanceof Error) {
        setError(`Failed to load billing history: ${err.message}`);
        toast.error(`Failed to load billing history: ${err.message}`);
      } else {
        setError('Failed to load billing history');
        toast.error('Failed to load billing history');
      }
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, [token]);

  // Calculate pagination
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = history.slice(startIndex, endIndex);

  return (
    <div className="billing-history-page themed-page py-4 px-3">
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: '50px', height: '50px' }}
            >
              <i
                className="bi bi-receipt text-primary"
                style={{ fontSize: '1.5rem' }}
              ></i>
            </div>
            <div>
              <h4 className="mb-0 fw-bold text-dark">Billing History</h4>
              <p className="mb-0 small text-muted">
                All recorded invoices and transactions
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="alert"
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading billing history...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && !error && (
          <div className="card shadow-sm themed-card">
            <div className="card-body text-center py-5">
              <i className="bi bi-inbox fs-2 mb-3 d-block text-muted"></i>
              <p className="text-muted mb-3">No billing history found</p>
              <button className="btn btn-primary btn-sm" onClick={fetchBillingHistory}>
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && history.length > 0 && (
          <div className="card shadow-sm themed-card">
            <div className="card-header fw-bold d-flex justify-content-between align-items-center">
              <span>Billing Records</span>
              <span className="badge bg-primary-subtle text-primary">
                {history.length} records
              </span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Invoice ID</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Refunded Amount</th>
                    <th>Net Total</th>
                    <th>Payment Status</th>
                    <th>Refund Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.map((entry) => (
                    <tr key={entry.id} className="align-middle">
                      <td>
                        <code
                          className="small"
                          title={entry.id}
                          aria-label={entry.id}
                        >
                          {entry.id.substring(0, 16)}...
                        </code>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {entry.items ? entry.items.length : 0} item(s)
                        </span>
                      </td>
                      <td>
                        <strong>₹{(entry.total || 0).toFixed(2)}</strong>
                      </td>
                      <td>
                        <strong>₹{(entry.refundTotal || 0).toFixed(2)}</strong>
                      </td>
                      <td>
                        <strong>₹{((entry.total || 0) - (entry.refundTotal || 0)).toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`badge bg-${entry?.paymentStatus === 'paid' ? 'success' :  'warning' }`}>
                          {entry?.paymentStatus || 'none'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${entry.refundStatus === 'full' ? 'danger' : entry.refundStatus === 'partial' ? 'warning' : 'success'}`}>
                          {entry.refundStatus || 'none'}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {entry.createdDate || entry.date
                          ? new Date(entry.createdDate || entry.date).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => openViewModal(entry)}
                          >
                            View
                          </button>
                        {entry.paymentStatus === 'paid' && entry.refundStatus !== 'full' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => openRefundModal(entry)}
                          >
                            Refund
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="card-footer bg-light d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              <div className="small text-muted">
                Showing {history.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, history.length)} of {history.length} records
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </button>

                <div className="d-flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>

              <button
                className="btn btn-sm btn-outline-primary"
                onClick={fetchBillingHistory}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={closeRefundModal}
        invoice={selectedInvoice}
        onRefundSuccess={fetchBillingHistory}
      />

      <Modal
        show={isViewModalOpen}
        onHide={closeViewModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Purchased Items</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">
            <div className="text-muted small">Invoice ID</div>
            <div className="fw-semibold">{viewInvoice?.id || '-'}</div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Item</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {(viewInvoice?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-3">
                      No items
                    </td>
                  </tr>
                ) : (
                  (viewInvoice?.items || []).map((it: any, idx: number) => (
                    <tr key={String(it?.id || it?.productId || idx)}>
                      <td>{it?.name || '-'}</td>
                      <td className="text-end">{Number(it?.qty || 0)}</td>
                      <td className="text-end">₹{Number(it?.price || 0).toFixed(2)}</td>
                      <td className="text-end">
                        ₹{(Number(it?.qty || 0) * Number(it?.price || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <hr />

          <div className="d-flex justify-content-end">
            <div style={{ minWidth: 260 }}>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Subtotal</span>
                <span className="fw-semibold">₹{Number(viewInvoice?.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Discount</span>
                <span className="fw-semibold">-₹{Number(viewInvoice?.discount || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Tax</span>
                <span className="fw-semibold">₹{Number(viewInvoice?.tax || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <span className="fw-bold">Total</span>
                <span className="fw-bold">₹{Number(viewInvoice?.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeViewModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BillingHistory;
