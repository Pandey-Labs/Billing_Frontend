
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addProduct, updateProduct } from '../slices/productsSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/api';

const initialForm = {
  name: '',
  category: '',
  sku: '',
  unit: '',
  purchasePrice: '',
  sellingPrice: '',
  taxRate: '',
  stock: '',
  reorderLevel: '',
  barcode: '',
  brand: '',
  hsn: '',
  discount: '',
  discountType: 'percentage' as 'percentage' | 'flat',
  supplier: '',
  batch: '',
  expiry: '',
  mfg: '',
  image: '',
  description: '',
  location: '',
  weight: '',
  color: '',
  size: '',
  status: 'active',
  isFavorite: false,
  isBestSeller: false,
};

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const products = useAppSelector((state) => state.products.items);
  const editing = Boolean(id);
  const existing = editing ? products.find((p) => p.id === id) : undefined;

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isVariant, setIsVariant] = useState(false);
  const [parentProductId, setParentProductId] = useState('');
  const [parentProductSearch, setParentProductSearch] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing) {
      setIsVariant(Boolean(existing.parentProductId));
      setParentProductId(existing.parentProductId || '');
      const parent = existing.parentProductId ? products.find((p) => p.id === existing.parentProductId) : null;
      setParentProductSearch(parent?.name || existing.name);
      setForm({
        name: existing.name || '',
        category: existing.category || '',
        sku: existing.sku || '',
        unit: existing.unit || '',
        purchasePrice: existing.purchasePrice?.toString() || existing.mrp?.toString() || '',
        sellingPrice: existing.sellingPrice?.toString() || existing.price?.toString() || '',
        taxRate: existing.taxRate?.toString() || existing.taxPercent?.toString() || '',
        stock: existing.stock?.toString() || '',
        reorderLevel: '',
        barcode: existing.barcode || '',
        brand: existing.brand || '',
        hsn: existing.hsn || '',
        discount: (() => {
          if (existing.discountType === 'flat') {
            return existing.discountAmount?.toString() || existing.discountValue?.toString() || '';
          }
          return (
            existing.discount?.toString() ||
            existing.discountPrice?.toString() ||
            existing.discountValue?.toString() ||
            ''
          );
        })(),
        discountType: existing.discountType || (existing.discount || existing.discountPrice ? 'percentage' : 'percentage'),
        supplier: '',
        batch: '',
        expiry: '',
        mfg: existing.mfg || '',
        image: existing.image || '',
        description: existing.description || '',
        location: existing.location || '',
        weight: existing.weight || '',
        color: existing.color || '',
        size: existing.size || '',
        status: existing.status || 'active',
        isFavorite: existing.isFavorite || false,
        isBestSeller: existing.isBestSeller || false,
      });
    }
  }, [existing, products]);

  const availableProducts = products.filter((p) => !p.parentProductId);
  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(parentProductSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(parentProductSearch.toLowerCase())
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, files, checked } = e.target as any;
    setForm((f) => {
      const nextValue = type === 'file' ? files[0] : type === 'checkbox' ? checked : value;
      if (name === 'discountType') {
        return {
          ...f,
          discountType: nextValue as 'percentage' | 'flat',
          discount: '',
        };
      }
      return {
        ...f,
        [name]: nextValue,
      };
    });
    if (name === 'discountType') {
      setErrors((prev) => {
        const { discount: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleParentProductSelect = (productId: string) => {
    const parent = products.find((p) => p.id === productId);
    if (parent) {
      setParentProductId(productId);
      setParentProductSearch(parent.name);
      setForm((f) => ({
        ...f,
        name: parent.name,
        category: parent.category || '',
        brand: parent.brand || '',
        hsn: parent.hsn || '',
        unit: parent.unit || '',
        discountType:
          parent.discountType ||
          (parent.discount || parent.discountPrice ? 'percentage' : parent.discountAmount ? 'flat' : f.discountType),
        discount: (() => {
          if (parent.discountType === 'flat') {
            return parent.discountAmount?.toString() || parent.discountValue?.toString() || '';
          }
          if (parent.discount || parent.discountPrice || parent.discountValue) {
            return (
              parent.discount?.toString() ||
              parent.discountPrice?.toString() ||
              parent.discountValue?.toString() ||
              ''
            );
          }
          return '';
        })(),
      }));
    }
  };

  const required: Array<keyof typeof initialForm> = [
    'name',
    'sku',
    'category',
    'unit',
    'purchasePrice',
    'sellingPrice',
    'taxRate',
    'stock',
  ];

  const validate = () => {
    const errs: { [key: string]: string } = {};
    required.forEach((field) => {
      const value = form[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        errs[field] = 'Required';
      }
    });
    if (isVariant && !parentProductId) {
      errs.parentProduct = 'Please select a parent product';
    }
    if (form.discount) {
      const discountValue = Number(form.discount);
      if (Number.isNaN(discountValue) || discountValue < 0) {
        errs.discount = 'Enter a valid discount';
      } else if (form.discountType === 'percentage' && discountValue > 100) {
        errs.discount = 'Percentage discount cannot exceed 100';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    if (editing && !existing) {
      setApiError('Product details are still loading. Please try again in a moment.');
      return;
    }

    const imageValue = form.image;
    const processSubmission = (imageUrl?: string) => {
      submitProduct(imageUrl)
        .then(() => {
          setSubmitting(false);
          navigate('/products');
        })
        .catch(() => {
          setSubmitting(false);
          // errors handled inside submitProduct
        });
    };

    setApiError(null);

    if (imageValue && typeof imageValue !== 'string') {
      const file = imageValue as unknown as File;
      if (file instanceof File) {
        setSubmitting(true);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.error) {
            return;
          }
          processSubmission(reader.result as string);
        };
        reader.onerror = () => {
          setApiError('Failed to read image file. Please try again.');
          setSubmitting(false);
        };
        reader.readAsDataURL(file);
      } else {
        setSubmitting(true);
        processSubmission(undefined);
      }
    } else {
      setSubmitting(true);
      processSubmission((imageValue as string) || undefined);
    }
  };

  const submitProduct = async (imageUrl?: string) => {
    const productData = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || undefined,
      price: Number(form.sellingPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      mrp: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      discount: form.discount && form.discountType === 'percentage' ? Number(form.discount) : undefined,
      discountPrice:
        form.discount && form.discountType === 'percentage' ? Number(form.discount) : undefined,
      discountAmount:
        form.discount && form.discountType === 'flat' ? Number(form.discount) : undefined,
      discountValue: form.discount ? Number(form.discount) : undefined,
      discountType: form.discount ? form.discountType : undefined,
      taxPercent: form.taxRate ? Number(form.taxRate) : undefined,
      taxRate: form.taxRate ? Number(form.taxRate) : undefined,
      stock: Number(form.stock) || 0,
      category: form.category.trim() || undefined,
      unit: form.unit.trim() || undefined,
      brand: form.brand.trim() || undefined,
      hsn: form.hsn.trim() || undefined,
      size: form.size.trim() || undefined,
      color: form.color.trim() || undefined,
      weight: form.weight.trim() || undefined,
      mfg: form.mfg || undefined,
      image:
        imageUrl !== undefined
          ? imageUrl
          : typeof form.image === 'string'
          ? form.image
          : undefined,
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
      status: form.status as 'active' | 'inactive',
      parentProductId: isVariant ? parentProductId : undefined,
      isFavorite: Boolean(form.isFavorite),
      isBestSeller: Boolean(form.isBestSeller),
    };

    try {
      if (editing && existing) {
        await dispatch(updateProduct({ id: existing.id, data: productData })).unwrap();
      } else {
        await dispatch(addProduct(productData)).unwrap();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else if (typeof error === 'string') {
        setApiError(error);
      } else if (error instanceof Error) {
        setApiError(error.message || 'Failed to save product');
      } else {
        setApiError('Failed to save product');
      }
      throw error;
    }
  };

  const pageTitle = editing
    ? isVariant
      ? 'Edit Product Variant'
      : 'Edit Product'
    : isVariant
    ? 'Add Product Variant'
    : 'Add Product';

  return (
    <div className="products-page themed-page py-4">
      <div className="page-header card border-0 gradient-bg text-white mb-4 overflow-hidden">
        <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-4">
          <div>
            <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-boxes"></i>
              {pageTitle}
            </h3>
            <p className="mb-0 text-white-50">
              Organize your catalog with quick variant creation, enriched product details, and smart highlights.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-3 justify-content-start">
            <div className="stat-chip surface-chip animate-slide-up" style={{ animationDelay: '80ms' }}>
              <span className="chip-label">Mode</span>
              <span className="chip-value text-primary">{editing ? 'Editing' : 'Creating'}</span>
            </div>
            <div className="stat-chip surface-chip animate-slide-up" style={{ animationDelay: '140ms' }}>
              <span className="chip-label">Variant</span>
              <span className="chip-value">{isVariant ? 'Enabled' : 'Standard'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-lg">
        <div className="card shadow-sm themed-card animate-slide-up form-shell" style={{ animationDelay: '200ms' }}>
          <div className="card-body">
            <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input accent-switch"
                  type="checkbox"
                  id="isVariant"
                  checked={isVariant}
                  disabled={editing && Boolean(existing?.parentProductId)}
                  onChange={(e) => {
                    if (!editing || !existing?.parentProductId) {
                      setIsVariant(e.target.checked);
                      if (!e.target.checked) {
                        setParentProductId('');
                        setParentProductSearch('');
                      }
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="isVariant">
                  {editing && existing?.parentProductId
                    ? 'This is a variant (locked)'
                    : 'Create as variant of existing product'}
                </label>
              </div>
              <div className="badge bg-light text-dark px-3 py-2 shadow-sm">
                {isVariant ? 'Variant mode on' : 'Standard product'}
              </div>
            </div>

            {isVariant && (
              <div className="mb-4">
                <label className="form-label fw-semibold">Select Parent Product</label>
                <div className="position-relative">
                  <input
                    className={`form-control glow-control${errors.parentProduct ? ' is-invalid' : ''}`}
                    type="text"
                    placeholder="Search for product name or SKU..."
                    value={parentProductSearch}
                    onChange={(e) => setParentProductSearch(e.target.value)}
                    onFocus={() => setParentProductSearch('')}
                  />
                  {parentProductSearch && filteredProducts.length > 0 && (
                    <div className="list-group position-absolute w-100 shadow-lg variant-suggestions scroll-shadow">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="list-group-item list-group-item-action"
                          onClick={() => handleParentProductSelect(p.id)}
                        >
                          <div className="fw-semibold">{p.name}</div>
                          <small className="text-muted">{p.sku} | {p.category}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.parentProduct && <div className="invalid-feedback d-block">{errors.parentProduct}</div>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="row g-3 form-grid" noValidate>
              <div className="col-md-6">
                <label className="form-label">Product Name</label>
                <input
                  className={`form-control glow-control${errors.name ? ' is-invalid' : ''}`}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  disabled={isVariant && Boolean(parentProductId)}
                  placeholder={isVariant && !parentProductId ? 'Select parent product first' : ''}
                />
                {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <input
                  className={`form-control glow-control${errors.category ? ' is-invalid' : ''}`}
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  disabled={isVariant && Boolean(parentProductId)}
                />
                {errors.category && <div className="invalid-feedback d-block">{errors.category}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">SKU / Product Code</label>
                <input
                  className={`form-control glow-control${errors.sku ? ' is-invalid' : ''}`}
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  required
                />
                {errors.sku && <div className="invalid-feedback d-block">{errors.sku}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Unit</label>
                <input
                  className={`form-control glow-control${errors.unit ? ' is-invalid' : ''}`}
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  required
                />
                {errors.unit && <div className="invalid-feedback d-block">{errors.unit}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Purchase Price</label>
                <input
                  className={`form-control glow-control${errors.purchasePrice ? ' is-invalid' : ''}`}
                  name="purchasePrice"
                  value={form.purchasePrice}
                  onChange={handleChange}
                  type="number"
                  required
                />
                {errors.purchasePrice && <div className="invalid-feedback d-block">{errors.purchasePrice}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Selling Price</label>
                <input
                  className={`form-control glow-control${errors.sellingPrice ? ' is-invalid' : ''}`}
                  name="sellingPrice"
                  value={form.sellingPrice}
                  onChange={handleChange}
                  type="number"
                  required
                />
                {errors.sellingPrice && <div className="invalid-feedback d-block">{errors.sellingPrice}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Tax Rate (%)</label>
                <input
                  className={`form-control glow-control${errors.taxRate ? ' is-invalid' : ''}`}
                  name="taxRate"
                  value={form.taxRate}
                  onChange={handleChange}
                  type="number"
                  required
                />
                {errors.taxRate && <div className="invalid-feedback d-block">{errors.taxRate}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Stock Quantity</label>
                <input
                  className={`form-control glow-control${errors.stock ? ' is-invalid' : ''}`}
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  type="number"
                  required
                />
                {errors.stock && <div className="invalid-feedback d-block">{errors.stock}</div>}
              </div>

              {isVariant && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">Size</label>
                    <input
                      className="form-control glow-control"
                      name="size"
                      value={form.size}
                      onChange={handleChange}
                      placeholder="e.g., S, M, L, XL"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Color</label>
                    <input
                      className="form-control glow-control"
                      name="color"
                      value={form.color}
                      onChange={handleChange}
                      placeholder="e.g., Red, Blue, Black"
                    />
                  </div>
                </>
              )}

              <div className="col-md-6">
                <label className="form-label">Reorder Level</label>
                <input
                  className="form-control glow-control"
                  name="reorderLevel"
                  value={form.reorderLevel}
                  onChange={handleChange}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Barcode / QR Code</label>
                <input
                  className="form-control glow-control"
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Brand</label>
                <input
                  className="form-control glow-control"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  disabled={isVariant && Boolean(parentProductId)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">HSN / SAC Code</label>
                <input
                  className="form-control glow-control"
                  name="hsn"
                  value={form.hsn}
                  onChange={handleChange}
                  disabled={isVariant && Boolean(parentProductId)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Discount Type</label>
                <select
                  className="form-select glow-control"
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Discount {form.discountType === 'flat' ? '(₹ per item)' : '(%)'}
                </label>
                <input
                  className={`form-control glow-control${errors.discount ? ' is-invalid' : ''}`}
                  name="discount"
                  value={form.discount}
                  onChange={handleChange}
                  type="number"
                  min={0}
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  placeholder={form.discountType === 'flat' ? 'Enter flat discount amount' : 'Enter percentage'}
                />
                {errors.discount && <div className="invalid-feedback d-block">{errors.discount}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Supplier / Vendor Name</label>
                <input
                  className="form-control glow-control"
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Batch Number</label>
                <input
                  className="form-control glow-control"
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Expiry Date</label>
                <input
                  className="form-control glow-control"
                  name="expiry"
                  value={form.expiry}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Manufacturing Date</label>
                <input
                  className="form-control glow-control"
                  name="mfg"
                  value={form.mfg}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Product Image / Thumbnail</label>
                <input
                  className="form-control glow-control"
                  name="image"
                  onChange={handleChange}
                  type="file"
                  accept="image/*"
                />
              </div>
              <div className="col-md-12">
                <label className="form-label">Description / Notes</label>
                <textarea
                  className="form-control glow-control"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Storage Location / Shelf / Rack No.</label>
                <input
                  className="form-control glow-control"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Weight / Dimensions</label>
                <input
                  className="form-control glow-control"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                />
              </div>
              {!isVariant && (
                <div className="col-md-6">
                  <label className="form-label">Color / Size / Variant</label>
                  <input
                    className="form-control glow-control"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                  />
                </div>
              )}
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select
                  className="form-select glow-control"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-center flex-wrap gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input accent-switch"
                    type="checkbox"
                    id="isFavorite"
                    name="isFavorite"
                    checked={form.isFavorite}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isFavorite">
                    Mark as favorite item
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input accent-switch"
                    type="checkbox"
                    id="isBestSeller"
                    name="isBestSeller"
                    checked={form.isBestSeller}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isBestSeller">
                    Flag as best-selling
                  </label>
                </div>
              </div>

              {apiError && (
                <div className="col-12">
                  <div className="alert alert-danger">{apiError}</div>
                </div>
              )}

              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => navigate('/products')}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button className="btn btn-success shadow-sm" type="submit" disabled={submitting}>
                  {submitting
                    ? 'Saving...'
                    : editing
                    ? 'Update Product'
                    : isVariant
                    ? 'Add Variant'
                    : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;