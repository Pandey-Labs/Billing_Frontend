import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store/store';
import { getBillingHistory, ApiError } from '../api/api';
import { toast } from '../utils/toast';

interface BillingHistoryItem {
  id: string;
  invoiceId: string;
  orgId?: string;
  items: Array<any>;
  total: number;
  createdAt: string;
  meta?: Record<string, unknown>;
}

const BillingHistory: React.FC = () => {
  const token = useAppSelector((state: RootState) => state.auth.token) || undefined;
  const [history, setHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
                    <th>Billing ID</th>
                    <th>Invoice ID</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.map((entry) => (
                    <tr key={entry.id} className="align-middle">
                      <td>
                        <code className="small text-primary">{entry.id.substring(0, 12)}...</code>
                      </td>
                      <td>
                        <code className="small">{entry.invoiceId.substring(0, 16)}...</code>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {entry.items ? entry.items.length : 0} item(s)
                        </span>
                      </td>
                      <td>
                        <strong>₹{(entry.total || 0).toFixed(2)}</strong>
                      </td>
                      <td className="text-muted small">
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleString()
                          : 'N/A'}
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
    </div>
  );
};

export default BillingHistory;
