import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { removeProduct, fetchProducts } from "../slices/productsSlice";
import { Link } from "react-router-dom";
import BulkUploadModal from "../components/BulkUploadModal";

const placeholder = "—";

const formatText = (value?: string | number | null) =>
  value !== undefined && value !== null && String(value).trim() !== "" ? String(value) : placeholder;

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return placeholder;
  }
  return `₹${Number(value).toFixed(2)}`;
};

const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return placeholder;
  }
  return `${Number(value)}%`;
};

const Products: React.FC = () => {
  const { items: productsRaw, status, error: productsError } = useAppSelector((s) => s.products);
  const products = productsRaw ?? [];
  const dispatch = useAppDispatch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const masterProductCount = products.filter((product) => !product.parentProductId).length;
  const variantCount = products.length - masterProductCount;
  const columnsCount = 15;
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  const variantsByParent = useMemo(() => {
    const map = new Map<string, any[]>();
    products.forEach((product) => {
      if (product.parentProductId) {
        const existing = map.get(product.parentProductId) || [];
        existing.push(product);
        map.set(product.parentProductId, existing);
      }
    });
    return map;
  }, [products]);

  // Helper to get variant display text
  const getVariantDisplay = (product: any) => {
    if (product.parentProductId) {
      const parts = [];
      if (product.size) parts.push(`Size: ${product.size}`);
      if (product.color) parts.push(`Color: ${product.color}`);
      return parts.length > 0 ? parts.join(", ") : placeholder;
    }
    return placeholder;
  };

  // Helper to get display name with variant indicator
  const getDisplayName = (product: any) => {
    if (product.parentProductId) {
      const name = formatText(product.name);
      return name !== placeholder ? `${name} (Variant)` : `Variant ${placeholder}`;
    }
    return formatText(product.name);
  };

  const getDiscountDisplay = (product: any) => {
    const inferredType =
      product.discountType ||
      (product.discountAmount || product.discountValue
        ? "flat"
        : product.discount || product.discountPrice
        ? "percentage"
        : null);

    if (!inferredType) {
      return "—";
    }

    if (inferredType === "flat") {
      const amount = Number(product.discountAmount ?? product.discountValue ?? 0) || 0;
      return amount ? `₹${amount.toFixed(2)} flat` : "—";
    }

    const percent =
      Number(product.discount ?? product.discountPrice ?? product.discountValue ?? 0) || 0;
    return `${percent}%`;
  };

  const getPurchaseDisplay = (product: any) =>
    formatCurrency(
      product.purchasePrice !== undefined && product.purchasePrice !== null
        ? product.purchasePrice
        : product.mrp,
    );

  const getSellingDisplay = (product: any) =>
    formatCurrency(
      product.sellingPrice !== undefined && product.sellingPrice !== null
        ? product.sellingPrice
        : product.price,
    );

  const getTaxDisplay = (product: any) =>
    formatPercent(
      product.taxRate !== undefined && product.taxRate !== null
        ? product.taxRate
        : product.taxPercent,
    );

  const renderStockBadge = (stockValue?: number | null) => {
    if (stockValue === undefined || stockValue === null || Number.isNaN(Number(stockValue))) {
      return <span className="badge bg-secondary">{placeholder}</span>;
    }
    const safeStock = Number(stockValue);
    const badgeClass = safeStock > 10 ? "bg-success" : safeStock > 0 ? "bg-warning" : "bg-danger";
    return <span className={`badge ${badgeClass}`}>{safeStock}</span>;
  };

  const selectedVariants = productToDelete
    ? variantsByParent.get(productToDelete.id) || []
    : [];

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setDeleteError(null);
    setDeleteLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      if (!productToDelete.parentProductId) {
        const children = variantsByParent.get(productToDelete.id) || [];
        for (const child of children) {
          await dispatch(removeProduct(child.id)).unwrap();
        }
      }
      await dispatch(removeProduct(productToDelete.id)).unwrap();
      handleCloseModal();
    } catch (err) {
      if (typeof err === "string") {
        setDeleteError(err);
      } else if (err instanceof Error) {
        setDeleteError(err.message || "Failed to delete product");
      } else {
        setDeleteError("Failed to delete product");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="products-page d-flex flex-column" style={{ minHeight: "100vh" }}>
      <div className="container-fluid flex-grow-1 d-flex flex-column py-4">
        {/* Header */}
        <div className="page-header card border gradient-bg text-white overflow-hidden flex-shrink-0 mb-4 shadow-sm border-light-subtle">
          <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h3 className="fw-bold mb-1">
                <i className="bi bi-box-seam me-2"></i>
                Products
              </h3>
              <p className="mb-0 text-white-50">
                Keep an eye on your catalog, variants, and stock movement in one place.
              </p>
            </div>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="stat-chip shadow-sm border border-light-subtle">
                <span className="chip-label">Total Items</span>
                <span className="chip-value">{products.length}</span>
              </div>
              <div className="stat-chip shadow-sm border border-light-subtle">
                <span className="chip-label">Master Products</span>
                <span className="chip-value">{masterProductCount}</span>
              </div>
              <div className="stat-chip shadow-sm border border-light-subtle">
                <span className="chip-label">Variants</span>
                <span className="chip-value">{variantCount}</span>
              </div>
              <button 
                className="btn btn-outline-light btn-lg shadow-sm"
                onClick={() => setShowBulkUploadModal(true)}
              >
                <i className="bi bi-cloud-upload me-1"></i>
                Bulk Upload
              </button>
              <Link to="/products/new" className="btn btn-light btn-lg shadow-sm">
                <i className="bi bi-plus-circle me-1"></i>
                Add Product
              </Link>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="card shadow-sm products-table-card border border-light-subtle flex-grow-1 d-flex flex-column overflow-hidden">
          <div className="card-body p-0 d-flex flex-column overflow-hidden">
            <div
              className="table-responsive products-table-wrapper flex-grow-1"
              style={{ overflowY: "auto", overflowX: "auto" }}
            >
              <table className="table table-hover table-bordered table-striped align-middle mb-0 text-nowrap">
                <thead className="table-dark sticky-top">
                  <tr>
                    <th scope="col" className="text-center" style={{ width: "50px" }}>#</th>
                    <th scope="col">Name</th>
                    <th scope="col">SKU</th>
                    <th scope="col">Unit</th>
                    <th scope="col" className="text-end">Purchase Price</th>
                    <th scope="col" className="text-end">Selling Price</th>
                    <th scope="col" className="text-center">Tax (%)</th>
                    <th scope="col" className="text-center">Stock</th>
                    <th scope="col">Barcode</th>
                    <th scope="col" className="text-center">Discount (%)</th>
                    <th scope="col">HSN/SAC</th>
                    <th scope="col">Highlights</th>
                    <th scope="col">Variant</th>
                    <th scope="col">Category</th>
                    <th scope="col" className="text-center" style={{ width: "120px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {status === "loading" ? (
                    <tr>
                      <td colSpan={columnsCount} className="text-center text-muted py-5">
                        <div className="spinner-border text-primary me-2" role="status" aria-hidden="true"></div>
                        Loading products...
                      </td>
                    </tr>
                  ) : productsError ? (
                    <tr>
                      <td colSpan={columnsCount} className="text-center text-danger py-4">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {productsError}
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={columnsCount} className="text-center text-muted py-5">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        No products available
                      </td>
                    </tr>
                  ) : (
                    products.map((p, index) => (
                      <tr
                        key={p.id}
                        className={`products-row ${p.parentProductId ? 'table-info' : ''}`}
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <td className="text-center fw-semibold">{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            {p.parentProductId && (
                              <i className="bi bi-diagram-3 text-info me-2" title="Variant"></i>
                            )}
                            <span>{getDisplayName(p)}</span>
                          </div>
                        </td>
                        <td><code className="text-dark">{formatText(p.sku)}</code></td>
                        <td>{formatText(p.unit)}</td>
                        <td className="text-end">{getPurchaseDisplay(p)}</td>
                        <td className="text-end fw-semibold">{getSellingDisplay(p)}</td>
                        <td className="text-center">{getTaxDisplay(p)}</td>
                        <td className="text-center">
                          {renderStockBadge(p.stock)}
                        </td>
                        <td><small className="text-muted">{formatText(p.barcode)}</small></td>
                        <td className="text-center">{getDiscountDisplay(p)}</td>
                        <td><small className="text-muted">{p.hsn || "-"}</small></td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            {p.isFavorite && (
                              <span className="badge highlight-badge favorite">
                                <i className="bi bi-star-fill me-1"></i>
                                Favorite
                              </span>
                            )}
                            {p.isBestSeller && (
                              <span className="badge highlight-badge bestseller">
                                <i className="bi bi-graph-up-arrow me-1"></i>
                                Best Seller
                              </span>
                            )}
                            {!p.isFavorite && !p.isBestSeller && (
                              <span className="badge highlight-badge neutral">Standard</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <small className="text-info">{getVariantDisplay(p)}</small>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{p.category || "-"}</span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group" role="group">
                            <Link
                              to={`/products/edit/${p.id}`}
                              className="btn btn-sm btn-outline-primary"
                              title="Edit Product"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteClick(p)}
                              title="Delete Product"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`modal fade ${showDeleteModal ? "show d-block" : ""}`} tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Delete Product
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
            </div>
            <div className="modal-body">
              {productToDelete ? (
                <>
                  <p className="mb-3">
                    Are you sure you want to remove <strong>{productToDelete.name}</strong> from your catalog?
                  </p>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="info-tile">
                        <span className="info-label">SKU</span>
                        <span className="info-value">{productToDelete.sku || "—"}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="info-tile">
                        <span className="info-label">Category</span>
                        <span className="info-value">{productToDelete.category || "—"}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="info-tile">
                        <span className="info-label">Stock</span>
                        <span className="info-value">{productToDelete.stock ?? 0}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="info-tile">
                        <span className="info-label">Selling Price</span>
                        <span className="info-value">
                          ₹{(productToDelete.sellingPrice || productToDelete.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="info-tile">
                        <span className="info-label">Tax (%)</span>
                        <span className="info-value">{productToDelete.taxRate || productToDelete.taxPercent || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {!productToDelete.parentProductId && selectedVariants.length > 0 && (
                    <div className="mt-4">
                      <div className="alert alert-warning d-flex align-items-start gap-2">
                        <i className="bi bi-diagram-3 fs-4"></i>
                        <div>
                          <h6 className="fw-semibold mb-1">Variants detected</h6>
                          <p className="mb-2">
                            Deleting this master product will also remove its {selectedVariants.length} variant
                            {selectedVariants.length > 1 ? "s" : ""}.
                          </p>
                          <div className="variant-list">
                            {selectedVariants.map((variant) => (
                              <div className="variant-item" key={variant.id}>
                                <div className="variant-name">{variant.name}</div>
                                <div className="variant-meta">
                                  <span>SKU: {variant.sku || "—"}</span>
                                  <span>Stock: {variant.stock ?? 0}</span>
                                  <span>Price: ₹{(variant.sellingPrice || variant.price || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {productToDelete.parentProductId && (
                    <div className="mt-4 alert alert-info d-flex align-items-center gap-2">
                      <i className="bi bi-node-plus fs-4"></i>
                      <div>
                        <h6 className="fw-semibold mb-1">Variant product</h6>
                        <p className="mb-0">This action will only remove this variant. The master product will stay untouched.</p>
                      </div>
                    </div>
                  )}

                  {deleteError && (
                    <div className="alert alert-danger mt-3 mb-0">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {deleteError}
                    </div>
                  )}
                </>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={deleteLoading}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={deleteLoading}>
                {deleteLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && <div className="modal-backdrop fade show"></div>}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        show={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={() => {
          dispatch(fetchProducts());
          setShowBulkUploadModal(false);
        }}
      />
    </div>
  );
};

export default Products;
