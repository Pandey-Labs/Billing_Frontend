import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store/store';
import { createRefund } from '../slices/refundsSlice';
import { toast } from '../utils/toast';
import type { Invoice } from '../types';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onRefundSuccess?: () => void;
}

interface RefundItem {
    productId: string;
    name: string;
    price: number;
    qty: number;
    refundQty: number;
    taxPercent?: number;
}

const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, invoice, onRefundSuccess }) => {
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state: RootState) => state.refunds);
    const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
    const [reason, setReason] = useState('');
    const [refundMethod, setRefundMethod] = useState('Cash');
    const [restock, setRestock] = useState(true);

    useEffect(() => {
        if (invoice) {
            // Initialize refund items with a refundQty of 0
            const initialRefundItems: RefundItem[] = invoice.items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                qty: item.qty,
                refundQty: 0,
                taxPercent: item.taxPercent || 0,
            }));
            setRefundItems(initialRefundItems);
            setReason('');
            setRefundMethod('Cash');
            setRestock(true);
        }
    }, [invoice]);

    // Calculate refund totals
    const refundCalculations = useMemo(() => {
        const selectedItems = refundItems.filter(item => item.refundQty > 0);
        const subtotal = selectedItems.reduce((sum, item) => {
            return sum + (item.price * item.refundQty);
        }, 0);
        const tax = selectedItems.reduce((sum, item) => {
            const itemSubtotal = item.price * item.refundQty;
            const itemTax = itemSubtotal * (item.taxPercent || 0) / 100;
            return sum + itemTax;
        }, 0);
        const total = subtotal + tax;
        return { subtotal, tax, total, selectedItems };
    }, [refundItems]);

    if (!isOpen || !invoice) {
        return null;
    }

    const handleQtyChange = (productId: string, newQty: number) => {
        const updatedItems = refundItems.map(item => {
            if (item.productId === productId) {
                // Validate: refund quantity cannot exceed original quantity
                const maxQty = item.qty;
                const refundQty = Math.max(0, Math.min(newQty, maxQty));
                return { ...item, refundQty };
            }
            return item;
        });
        setRefundItems(updatedItems);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a refund reason');
            return;
        }

        if (refundCalculations.selectedItems.length === 0) {
            toast.error('Please select at least one item to refund');
            return;
        }

        // Prepare items for API (matching backend expected format)
        const items = refundCalculations.selectedItems.map(item => ({
            productId: item.productId,
            quantity: item.refundQty,
            price: item.price,
            total: item.price * item.refundQty,
        }));

        try {
            // BillingHistory objects have 'id' field (UUID), not 'invoiceId'
            // Use invoice.id which is the BillingHistory record ID
            const invoiceIdToUse = invoice?.id;
            
            if (!invoiceIdToUse) {
                toast.error('Invalid invoice: missing invoice ID');
                return;
            }

            console.log('[RefundModal] Creating refund with invoiceId:', invoiceIdToUse);
            console.log('[RefundModal] Invoice object:', invoice);
            console.log('[RefundModal] Refund items:', items);

            const result = await dispatch(createRefund({
                invoiceId: invoiceIdToUse,
                items,
                reason: reason.trim(),
                refundMethod,
                restock,
            })).unwrap();

            toast.success('Refund processed successfully');
            onRefundSuccess?.();
            onClose();
        } catch (err: any) {
            // Extract error message from API response
            const errorMessage = err?.message || err?.details?.message || err || 'Failed to process refund';
            console.error('[RefundModal] Refund error:', err);
            toast.error(errorMessage);
        }
    };

    const refundableBalance = (invoice.total || 0) - (invoice.refundTotal || 0);

    return (
        <div 
            className="modal fade show d-block" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            tabIndex={-1}
            role="dialog"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Process Refund</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="modal-body">
                        {/* Section 1: Invoice Summary */}
                        <div className="mb-4">
                            <h6 className="fw-semibold mb-3">Invoice Summary</h6>
                            <div className="row g-2 small">
                                <div className="col-6">
                                    <strong>Invoice No:</strong> {invoice.id}
                                </div>
                                <div className="col-6">
                                    <strong>Customer:</strong> {invoice.customerId || 'Guest'}
                                </div>
                                <div className="col-6">
                                    <strong>Original Total:</strong> ₹{(invoice.total || 0).toFixed(2)}
                                </div>
                                <div className="col-6">
                                    <strong>Already Refunded:</strong> ₹{(invoice.refundTotal || 0).toFixed(2)}
                                </div>
                                <div className="col-12">
                                    <strong className="text-success">Refundable Balance:</strong> ₹{refundableBalance.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Item Selection */}
                        <div className="mb-4">
                            <h6 className="fw-semibold mb-3">Item Selection</h6>
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Item</th>
                                            <th>Price</th>
                                            <th>Original Qty</th>
                                            <th>Refund Qty</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refundItems.map((item) => (
                                            <tr key={item.productId}>
                                                <td>{item.name}</td>
                                                <td>₹{item.price.toFixed(2)}</td>
                                                <td>{item.qty}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.qty}
                                                        value={item.refundQty}
                                                        onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0)}
                                                        className="form-control form-control-sm"
                                                        style={{ width: '80px' }}
                                                    />
                                                </td>
                                                <td>₹{(item.price * item.refundQty).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 3: Refund Details */}
                        <div className="mb-4">
                            <h6 className="fw-semibold mb-3">Refund Details</h6>
                            <div className="mb-3">
                                <label className="form-label">Refund Reason <span className="text-danger">*</span></label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter reason for refund..."
                                    className="form-control"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Refund Method</label>
                                <select
                                    value={refundMethod}
                                    onChange={(e) => setRefundMethod(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank">Bank</option>
                                    <option value="Card">Card</option>
                                </select>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={restock}
                                    onChange={(e) => setRestock(e.target.checked)}
                                    id="restockCheck"
                                />
                                <label className="form-check-label" htmlFor="restockCheck">
                                    Restock items in inventory
                                </label>
                            </div>
                        </div>

                        {/* Section 4: Refund Summary */}
                        <div className="mb-4 p-3 bg-light rounded">
                            <h6 className="fw-semibold mb-3">Refund Summary</h6>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <strong>₹{refundCalculations.subtotal.toFixed(2)}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Tax:</span>
                                <strong>₹{refundCalculations.tax.toFixed(2)}</strong>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold">Total Refund:</span>
                                <strong className="text-danger fs-5">₹{refundCalculations.total.toFixed(2)}</strong>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleSubmit}
                            disabled={loading || refundCalculations.selectedItems.length === 0}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Processing...
                                </>
                            ) : (
                                'Process Refund'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundModal;
