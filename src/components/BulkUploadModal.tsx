import React, { useState, useRef } from 'react';
import { downloadBulkTemplate, bulkUploadProducts, ApiError } from '../api/api';
import type { BulkUploadResult } from '../api/api';
import { useAppSelector } from '../store/hooks';
import { toast } from '../utils/toast';

interface BulkUploadModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type OperationType = 'create' | 'update' | 'upsert';

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ show, onClose, onSuccess }) => {
  const token = useAppSelector((state) => state.auth.token) || undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [operation, setOperation] = useState<OperationType>('upsert');
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        setError('Only Excel files (.xlsx, .xls) are allowed');
        setSelectedFile(null);
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await downloadBulkTemplate({ token });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_upload_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded successfully');
    } catch (err) {
      console.error('Failed to download template:', err);
      toast.error('Failed to download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await bulkUploadProducts(selectedFile, operation, { token });
      setUploadResult(result);
      
      const { summary } = result;
      if (summary.errors === 0) {
        toast.success(`Successfully processed ${summary.processed} products`);
        onSuccess();
      } else {
        toast.warning(`Processed with ${summary.errors} errors`);
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload products');
      }
      toast.error('Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    setOperation('upsert');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const allowedExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        setError('Only Excel files (.xlsx, .xls) are allowed');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="bi bi-cloud-upload me-2"></i>
                Bulk Product Upload
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleClose}
                disabled={uploading}
              ></button>
            </div>
            
            <div className="modal-body">
              {/* Template Download Section */}
              <div className="alert alert-info d-flex align-items-center mb-4">
                <i className="bi bi-info-circle-fill me-3 fs-4"></i>
                <div className="flex-grow-1">
                  <strong>Need a template?</strong>
                  <p className="mb-0 small">Download our Excel template with sample data and correct column headers.</p>
                </div>
                <button
                  className="btn btn-outline-primary btn-sm ms-3"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                >
                  {downloadingTemplate ? (
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  ) : (
                    <i className="bi bi-download me-1"></i>
                  )}
                  Download Template
                </button>
              </div>

              {/* Operation Selection */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  <i className="bi bi-gear me-1"></i>
                  Operation Type
                </label>
                <div className="row g-2">
                  <div className="col-md-4">
                    <div 
                      className={`card h-100 cursor-pointer ${operation === 'upsert' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                      onClick={() => setOperation('upsert')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body p-3">
                        <div className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            checked={operation === 'upsert'}
                            onChange={() => setOperation('upsert')}
                          />
                          <label className="form-check-label fw-semibold">
                            Upsert
                            <span className="badge bg-success ms-2">Recommended</span>
                          </label>
                        </div>
                        <small className="text-muted d-block mt-1">
                          Creates new products, updates existing ones
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div 
                      className={`card h-100 ${operation === 'create' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                      onClick={() => setOperation('create')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body p-3">
                        <div className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            checked={operation === 'create'}
                            onChange={() => setOperation('create')}
                          />
                          <label className="form-check-label fw-semibold">Create Only</label>
                        </div>
                        <small className="text-muted d-block mt-1">
                          Only creates new products
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div 
                      className={`card h-100 ${operation === 'update' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                      onClick={() => setOperation('update')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body p-3">
                        <div className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            checked={operation === 'update'}
                            onChange={() => setOperation('update')}
                          />
                          <label className="form-check-label fw-semibold">Update Only</label>
                        </div>
                        <small className="text-muted d-block mt-1">
                          Only updates existing products
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Select Excel File
                </label>
                <div
                  className={`border-2 border-dashed rounded p-4 text-center ${selectedFile ? 'border-success bg-success bg-opacity-10' : 'border-secondary'}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{ borderStyle: 'dashed' }}
                >
                  {selectedFile ? (
                    <div>
                      <i className="bi bi-file-earmark-check text-success fs-1 mb-2"></i>
                      <p className="mb-1 fw-semibold">{selectedFile.name}</p>
                      <p className="text-muted small mb-2">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadResult(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <i className="bi bi-cloud-arrow-up text-muted fs-1 mb-2"></i>
                      <p className="mb-1">Drag & drop your Excel file here</p>
                      <p className="text-muted small mb-3">or</p>
                      <label className="btn btn-primary">
                        <i className="bi bi-folder2-open me-1"></i>
                        Browse Files
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          className="d-none"
                        />
                      </label>
                      <p className="text-muted small mt-2 mb-0">
                        Max file size: 10MB | Formats: .xlsx, .xls
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {/* Upload Results */}
              {uploadResult && (
                <div className="mt-4">
                  <h6 className="fw-semibold mb-3">
                    <i className="bi bi-clipboard-data me-1"></i>
                    Upload Results
                  </h6>
                  
                  {/* Summary Cards */}
                  <div className="row g-2 mb-3">
                    <div className="col-6 col-md-3">
                      <div className="card bg-light">
                        <div className="card-body p-2 text-center">
                          <div className="small text-muted">Total Rows</div>
                          <div className="fw-bold fs-5">{uploadResult.summary.total}</div>
                        </div>
                      </div>
                    </div>
                    {uploadResult.summary.created !== undefined && (
                      <div className="col-6 col-md-3">
                        <div className="card bg-success bg-opacity-10">
                          <div className="card-body p-2 text-center">
                            <div className="small text-success">Created</div>
                            <div className="fw-bold fs-5 text-success">{uploadResult.summary.created}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {uploadResult.summary.updated !== undefined && (
                      <div className="col-6 col-md-3">
                        <div className="card bg-info bg-opacity-10">
                          <div className="card-body p-2 text-center">
                            <div className="small text-info">Updated</div>
                            <div className="fw-bold fs-5 text-info">{uploadResult.summary.updated}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="col-6 col-md-3">
                      <div className={`card ${uploadResult.summary.errors > 0 ? 'bg-danger bg-opacity-10' : 'bg-light'}`}>
                        <div className="card-body p-2 text-center">
                          <div className={`small ${uploadResult.summary.errors > 0 ? 'text-danger' : 'text-muted'}`}>Errors</div>
                          <div className={`fw-bold fs-5 ${uploadResult.summary.errors > 0 ? 'text-danger' : ''}`}>
                            {uploadResult.summary.errors}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {uploadResult.results.errors && uploadResult.results.errors.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-danger mb-2">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        Errors ({uploadResult.results.errors.length})
                      </h6>
                      <div className="table-responsive" style={{ maxHeight: '200px' }}>
                        <table className="table table-sm table-bordered mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '80px' }}>Row</th>
                              <th>Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResult.results.errors.slice(0, 20).map((err, idx) => (
                              <tr key={idx}>
                                <td className="text-center">{err.row}</td>
                                <td className="text-danger small">{err.error}</td>
                              </tr>
                            ))}
                            {uploadResult.results.errors.length > 20 && (
                              <tr>
                                <td colSpan={2} className="text-center text-muted">
                                  ... and {uploadResult.results.errors.length - 20} more errors
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={uploading}
              >
                {uploadResult ? 'Close' : 'Cancel'}
              </button>
              {!uploadResult && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-upload me-1"></i>
                      Upload Products
                    </>
                  )}
                </button>
              )}
              {uploadResult && uploadResult.summary.errors === 0 && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleClose}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkUploadModal;
