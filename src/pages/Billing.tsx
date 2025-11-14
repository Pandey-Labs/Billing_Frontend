import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  clearCart,
  updateQty,
  removeFromCart,
  addToCart,
} from "../slices/cartSlice";
import { addSale } from "../slices/reportsSlice";
import { deductStock } from "../slices/productsSlice";
import { addCustomer } from "../slices/customersSlice";
import { useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import type { Customer, Product, Invoice } from "../types";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: () => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    customerId: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const Billing: React.FC = () => {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const cart = useSelector((state: RootState) => state.cart);
  const products = useSelector((state: RootState) => state.products.items);
  const customers = useAppSelector((state: RootState) => state.customers.items);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [modalMode, setModalMode] = useState<'select' | 'create'>("select");
  const [modalSearch, setModalSearch] = useState("");
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", email: "" });
  const [customerErrors, setCustomerErrors] = useState<{ [key: string]: string }>({});
  const [pendingCustomerKey, setPendingCustomerKey] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 992 : false
  );
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 992);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!pendingCustomerKey) return;
    const [nameKey, emailKey, phoneKey] = pendingCustomerKey.split("||");
    const match = customers.find((c) =>
      c.name.trim().toLowerCase() === nameKey &&
      (c.email ? c.email.trim().toLowerCase() : "") === emailKey &&
      (c.phone ? c.phone.trim() : "") === phoneKey
    );
    if (match) {
      setSelectedCustomer(match);
      setPendingCustomerKey(null);
    }
  }, [customers, pendingCustomerKey]);

  const filteredModalCustomers = useMemo(() => {
    const term = modalSearch.toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.toLowerCase().includes(term))
    );
  }, [customers, modalSearch]);

  // Totals
  const subtotal = cart.items.reduce((sum, i) => {
    const prod = products.find((p) => p.id === i.productId);
    const price = prod ? Number(prod.sellingPrice || prod.price) || 0 : 0;
    return sum + price * (i.qty || 0);
  }, 0);

  const discount = cart.items.reduce((sum, i) => {
    const prod = products.find((p) => p.id === i.productId);
    if (!prod) return sum;
    const qty = i.qty || 0;
    const price = Number(prod.sellingPrice || prod.price) || 0;
    const discountType =
      prod.discountType ||
      (prod.discountAmount || prod.discountValue
        ? 'flat'
        : prod.discount || prod.discountPrice
        ? 'percentage'
        : undefined);
    if (discountType === 'flat') {
      const amount = Number(prod.discountAmount ?? prod.discountValue ?? 0) || 0;
      return sum + Math.max(amount, 0) * qty;
    }
    const percent = Number(
      prod.discount ?? prod.discountPrice ?? prod.discountValue ?? 0,
    );
    const percentageDiscount = ((price * Math.max(percent, 0)) / 100) * qty;
    return sum + percentageDiscount;
  }, 0);

  const tax = cart.items.reduce((sum, i) => {
    const prod = products.find((p) => p.id === i.productId);
    if (!prod) return sum;
    const qty = i.qty || 0;
    const price = Number(prod.sellingPrice || prod.price) || 0;
    const discountType =
      prod.discountType ||
      (prod.discountAmount || prod.discountValue
        ? 'flat'
        : prod.discount || prod.discountPrice
        ? 'percentage'
        : undefined);
    const discountPerUnit =
      discountType === 'flat'
        ? Math.max(Number(prod.discountAmount ?? prod.discountValue ?? 0) || 0, 0)
        : (price * Math.max(Number(prod.discount ?? prod.discountPrice ?? prod.discountValue ?? 0) || 0, 0)) / 100;
    const priceAfterDiscount = Math.max(price - discountPerUnit, 0);
    const taxPercent = Number(prod.taxRate || prod.taxPercent) || 0;
    return sum + (taxPercent * priceAfterDiscount * qty) / 100;
  }, 0);

  const effectiveDiscount = Math.min(discount, subtotal);
  const total = Math.max(subtotal - effectiveDiscount, 0) + tax;
  const totalItemsInCart = cart.items.reduce((sum, item) => sum + (item.qty || 0), 0);
  const uniqueItemsInCart = cart.items.length;
  const averageItemValue = totalItemsInCart ? total / totalItemsInCart : 0;
  const billingStats = useMemo(
    () => [
      {
        label: "Cart Value",
        value: `₹${total.toFixed(2)}`,
        accent: "text-warning",
      },
      {
        label: "Items in Cart",
        value: `${totalItemsInCart}`,
        accent: "text-info",
      },
      {
        label: "Unique Products",
        value: `${uniqueItemsInCart}`,
        accent: "text-success",
      },
      {
        label: "Customers",
        value: `${customers.length}`,
        accent: "text-light",
      },
    ],
    [customers.length, total, totalItemsInCart, uniqueItemsInCart]
  );

  const addProductToCart = (product: Product) => {
    const variantInfo = product.parentProductId 
      ? [product.size, product.color].filter(Boolean).join(', ') 
      : null;
    const displayName = variantInfo ? `${product.name} (${variantInfo})` : product.name;
    dispatch(
      addToCart({
        productId: product.id,
        name: displayName,
        price: Number(product.sellingPrice || product.price) || 0,
        qty: 1,
        taxPercent: Number(product.taxRate || product.taxPercent) || 0,
      })
    );
  };

  const updateItemQty = (itemId: string, qty: number) => {
    if (qty < 1) return;
    dispatch(updateQty({ id: itemId, qty }));
  };

  const increaseQty = (itemId: string, currentQty: number) =>
    updateItemQty(itemId, currentQty + 1);

  const decreaseQty = (itemId: string, currentQty: number) =>
    updateItemQty(itemId, Math.max(currentQty - 1, 1));

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const finalizeCheckout = () => {
    if (cart.items.length === 0) return;
    const now = new Date();
    const invoiceId = now.getTime().toString();
    const invoice = {
      id: invoiceId,
      date: now.toISOString(),
      createdDate: now.toLocaleDateString(),
      createdTime: now.toLocaleTimeString(),
      items: cart.items,
      subtotal,
      discount: effectiveDiscount,
      tax,
      total,
      customer: selectedCustomer || null,
    };

    dispatch(addSale(invoice));
    printInvoice(invoice);
    dispatch(deductStock(cart.items.map((i) => ({ productId: i.productId, qty: i.qty }))));
    dispatch(clearCart());
    nav(`/invoice/${invoiceId}`);
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0 || processingPayment) return;

    if (total <= 0) {
      finalizeCheckout();
      return;
    }

    setProcessingPayment(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      alert("Unable to load Razorpay checkout. Please try again.");
      setProcessingPayment(false);
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      alert("Razorpay key not configured. Set VITE_RAZORPAY_KEY_ID in your environment.");
      setProcessingPayment(false);
      return;
    }

    const amountInPaise = Math.round(total * 100);

    let orderId: string | undefined;
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            customer: selectedCustomer?.id ?? "guest",
            items: cart.items.length,
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        orderId = data?.id || data?.orderId;
      }
    } catch (error) {
      console.warn("Unable to create Razorpay order from API.", error);
    }

    const paymentOptions = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: "Billing Sphere",
      description: `Invoice ${new Date().toLocaleString()}`,
      order_id: orderId,
      handler: () => {
        finalizeCheckout();
        setProcessingPayment(false);
      },
      prefill: {
        name: selectedCustomer?.name || "Guest Customer",
        email: selectedCustomer?.email || "guest@example.com",
        contact: selectedCustomer?.phone || "",
      },
      notes: {
        customerId: selectedCustomer?.id ?? "guest",
      },
      theme: {
        color: "#0d6efd",
      },
      modal: {
        ondismiss: () => {
          setProcessingPayment(false);
        },
      },
    };

    try {
      const razorpayInstance = new window.Razorpay(paymentOptions);
      razorpayInstance.on("payment.failed", (response: unknown) => {
        console.error("Payment failed", response);
        alert("Payment failed or cancelled. Please try again.");
        setProcessingPayment(false);
      });
      razorpayInstance.open();
    } catch (error) {
      console.error("Failed to start Razorpay checkout", error);
      alert("Unable to start payment. Please try again.");
      setProcessingPayment(false);
    }
  };

  const printInvoice = (invoice: Invoice) => {
    const win = window.open('', 'PRINT', 'height=600,width=800');
    if (!win) return;
    win.document.write('<html><head><title>Invoice #' + invoice.id + '</title>');
    win.document.write('</head><body>');
    win.document.write('<h2>Invoice #' + invoice.id + '</h2>');
    win.document.write('<div>Date: ' + (invoice.date ? new Date(invoice.date).toLocaleString() : '') + '</div>');
    if (invoice.customer) {
      win.document.write('<div>Customer: ' + invoice.customer.name + (invoice.customer.phone ? ' (' + invoice.customer.phone + ')' : '') + (invoice.customer.email ? ' (' + invoice.customer.email + ')' : '') + '</div>');
    }
    win.document.write('<hr/>');
    win.document.write('<table border="1" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;">');
    win.document.write('<thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>');
    invoice.items.forEach((item) => {
      win.document.write('<tr>');
      win.document.write('<td>' + item.name + '</td>');
      win.document.write('<td>' + item.qty + '</td>');
      win.document.write('<td>' + item.price + '</td>');
      win.document.write('<td>' + (item.price * item.qty).toFixed(2) + '</td>');
      win.document.write('</tr>');
    });
    win.document.write('</tbody></table>');
    win.document.write('<hr/>');
    win.document.write('<div>Subtotal: ₹' + invoice.subtotal.toFixed(2) + '</div>');
    win.document.write('<div>Discount: -₹' + invoice.discount.toFixed(2) + '</div>');
    win.document.write('<div>Tax: ₹' + invoice.tax.toFixed(2) + '</div>');
    win.document.write('<div><b>Total: ₹' + invoice.total.toFixed(2) + '</b></div>');
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="billing-page themed-page py-4">
      <div className="page-header card border-0 gradient-bg text-white mb-4 overflow-hidden">
        <div className="card-body d-flex flex-column flex-xl-row justify-content-between align-items-start align-items-xl-center gap-4">
          <div>
            <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <span role="img" aria-label="billing">
                🧾
              </span>
              Billing
            </h3>
            <p className="mb-0 text-white-50">
              Scan, add, and bill products faster with real-time stock updates.
            </p>
          </div>
          <div
            className="d-flex gap-3 justify-content-start w-100"
            style={{
              flexWrap: isMobile ? "nowrap" : "wrap",
              overflowX: isMobile ? "auto" : "visible",
              paddingBottom: isMobile ? "0.5rem" : 0,
            }}
          >
            {billingStats.map((stat, index) => (
              <div
                key={stat.label}
                className="stat-chip surface-chip animate-slide-up flex-shrink-0"
                style={{
                  animationDelay: `${index * 70}ms`,
                  minWidth: isMobile ? 140 : undefined,
                }}
              >
                <span className="chip-label">{stat.label}</span>
                <span className={`chip-value ${stat.accent}`}>{stat.value}</span>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-light btn-lg shadow-sm animate-slide-up"
              style={{ animationDelay: `${billingStats.length * 70}ms` }}
              onClick={() => {
                setModalMode(selectedCustomer ? "select" : "create");
                setModalSearch("");
                setShowCustomerModal(true);
              }}
            >
              <i className="bi bi-person-plus-fill me-2"></i>
              Manage Customer
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 align-items-stretch">
        {/* LEFT: Products */}
        <div className="col-lg-6">
          <div
            className="card h-100 shadow-sm themed-card animate-slide-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="card-header fw-bold d-flex justify-content-between align-items-center">
              <span>Products</span>
              <span className="badge bg-light text-dark">
                {products.length} available
              </span>
            </div>
            <div className="card-body d-flex flex-column">
              <input
                className="form-control glow-control mb-3"
                placeholder="Search or scan SKU"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div
                className="list-group flex-grow-1 overflow-auto scroll-shadow"
                style={{ maxHeight: isMobile ? "45vh" : "65vh" }}
              >
                {products
                  .filter(
                    (p) =>
                      p.name.toLowerCase().includes(search.toLowerCase()) ||
                      p.sku?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((p, index) => {
                    const variantInfo = p.parentProductId
                      ? [p.size, p.color].filter(Boolean).join(", ")
                      : null;
                    const displayName = variantInfo ? `${p.name} (${variantInfo})` : p.name;
                    return (
                      <div
                        key={p.id}
                        className="list-group-item d-flex justify-content-between align-items-center hover-list-item animate-slide-up"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div>
                          <div className="fw-semibold">{displayName}</div>
                          <div className="small text-muted">
                            {p.sku} | Stock: {p.stock} | ₹{p.sellingPrice || p.price}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-primary shadow-sm"
                          onClick={() => addProductToCart(p)}
                          disabled={p.stock <= 0}
                        >
                          Add
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Cart + Customer */}
        <div className="col-lg-6 d-flex flex-column gap-3">
          {/* Cart */}
          <div
            className="card shadow-sm themed-card animate-slide-up"
            style={{ animationDelay: "180ms" }}
          >
            <div className="card-header fw-bold d-flex justify-content-between align-items-center">
              <span>Cart</span>
              <span className="badge bg-primary-subtle text-primary">
                {cart.items.length} item{cart.items.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="card-body">
              {cart.items.length === 0 ? (
                <div className="empty-state text-center py-4">
                  <i className="bi bi-cart-x fs-2 mb-2 d-block text-muted"></i>
                  <p className="text-muted mb-0">Cart is empty</p>
                </div>
              ) : (
                <div
                  className="cart-lines scroll-shadow"
                  style={{ maxHeight: isMobile ? "30vh" : "35vh" }}
                >
                  {cart.items.map((i, index) => (
                    <div
                      key={i.id}
                      className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom fade-in-row"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div>
                        <div className="fw-semibold">{i.name}</div>
                        <div className="small text-muted">
                          {i.qty} x ₹{i.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center quantity-control">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm quantity-btn"
                            onClick={() => decreaseQty(i.id, i.qty || 1)}
                          >
                            <i className="bi bi-dash"></i>
                          </button>
                          <span className="mx-2 fw-semibold">{i.qty}</span>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm quantity-btn"
                            onClick={() => increaseQty(i.id, i.qty || 0)}
                          >
                            <i className="bi bi-plus"></i>
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn btn-link text-danger ms-2 p-0"
                          onClick={() => dispatch(removeFromCart(i.id))}
                          title="Remove item"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <hr />
              <div className="d-flex justify-content-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Discount</span>
                <span>-₹{effectiveDiscount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Tax</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="small text-muted mt-1">
                Avg item value: ₹{averageItemValue.toFixed(2)}
              </div>

              <div className="mt-4 d-flex gap-2">
                <button
                  className="btn btn-success flex-fill shadow-sm"
                  onClick={handleCheckout}
                  disabled={cart.items.length === 0 || processingPayment}
                >
                  {processingPayment ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Processing...
                    </span>
                  ) : (
                    "Checkout"
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => dispatch(clearCart())}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Customer */}
          {/* <div
            className="card shadow-sm themed-card animate-slide-up"
            style={{ animationDelay: "240ms" }}
          >
            <div className="card-header fw-bold d-flex justify-content-between align-items-center">
              <span>Customer</span>
              <span className="badge bg-light text-dark">{customers.length} saved</span>
            </div>
            <div className="card-body d-flex flex-column gap-2">
              {selectedCustomer ? (
                <>
                  <div className="info-tile">
                    <span className="info-label">Name</span>
                    <span className="info-value">{selectedCustomer.name}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="info-tile">
                      <span className="info-label">Email</span>
                      <span className="info-value">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="info-tile">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{selectedCustomer.phone}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state text-center py-3">
                  <i className="bi bi-person-circle fs-2 mb-2 d-block text-muted"></i>
                  <p className="text-muted mb-0">No customer selected</p>
                </div>
              )}
              <button
                type="button"
                className="btn btn-outline-primary w-100"
                onClick={() => {
                  setModalMode("select");
                  setModalSearch("");
                  setShowCustomerModal(true);
                }}
              >
                Choose or Add Customer
              </button>
            </div>
          </div> */}
        </div>
      </div>

      <div className={`modal fade ${showCustomerModal ? "show d-block" : ""}`} tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title d-flex align-items-center gap-2">
                <i className="bi bi-people"></i>
                {modalMode === "select" ? "Select Customer" : "Create Customer"}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowCustomerModal(false);
                  setCustomerErrors({});
                }}
              ></button>
            </div>
            <div className="modal-body">
              <div className="btn-group mb-4" role="group">
                <button
                  type="button"
                  className={`btn ${modalMode === "select" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setModalMode("select")}
                >
                  Existing Customer
                </button>
                <button
                  type="button"
                  className={`btn ${modalMode === "create" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setModalMode("create")}
                >
                  New Customer
                </button>
              </div>

              {modalMode === "select" ? (
                <div className="select-customer-pane">
                  <input
                    className="form-control glow-control mb-3"
                    placeholder="Search by name, email, or phone"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
                  <div className="scroll-shadow" style={{ maxHeight: "320px" }}>
                    {filteredModalCustomers.length === 0 ? (
                      <div className="empty-state text-center py-4">
                        <i className="bi bi-search fs-2 mb-2 d-block text-muted"></i>
                        <p className="text-muted mb-0">No customers matched your search.</p>
                      </div>
                    ) : (
                      filteredModalCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerModal(false);
                          }}
                        >
                          <div>
                            <div className="fw-semibold">{customer.name}</div>
                            <div className="small text-muted">
                              {[customer.email, customer.phone].filter(Boolean).join(" · ") || "—"}
                            </div>
                          </div>
                          <i className="bi bi-check-circle text-primary"></i>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="create-customer-pane">
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      className={`form-control glow-control${customerErrors.name ? " is-invalid" : ""}`}
                      name="name"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter customer name"
                    />
                    {customerErrors.name && <div className="invalid-feedback d-block">{customerErrors.name}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      className={`form-control glow-control${customerErrors.email ? " is-invalid" : ""}`}
                      name="email"
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="name@example.com"
                    />
                    {customerErrors.email && <div className="invalid-feedback d-block">{customerErrors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      className={`form-control glow-control${customerErrors.phone ? " is-invalid" : ""}`}
                      name="phone"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Optional phone number"
                    />
                    {customerErrors.phone && <div className="invalid-feedback d-block">{customerErrors.phone}</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowCustomerModal(false);
                  setCustomerErrors({});
                }}
              >
                Close
              </button>
              {modalMode === "create" ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const trimmedName = customerForm.name.trim();
                    const trimmedEmail = customerForm.email.trim();
                    const trimmedPhone = customerForm.phone.trim();
                    const errs: { [key: string]: string } = {};
                    if (!trimmedName) errs.name = "Customer name is required";
                    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                      errs.email = "Enter a valid email";
                    }
                    if (trimmedPhone && trimmedPhone.length < 6) {
                      errs.phone = "Enter a valid phone number";
                    }
                    setCustomerErrors(errs);
                    if (Object.keys(errs).length > 0) return;
                    setPendingCustomerKey(`${trimmedName.toLowerCase()}||${trimmedEmail.toLowerCase()}||${trimmedPhone}`);
                    dispatch(
                      addCustomer({
                        name: trimmedName,
                        email: trimmedEmail || undefined,
                        phone: trimmedPhone || undefined,
                      })
                    );
                    setCustomerForm({ name: "", email: "", phone: "" });
                    setCustomerErrors({});
                    setModalMode("select");
                    setModalSearch("");
                  }}
                >
                  Save Customer
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!selectedCustomer}
                  onClick={() => setShowCustomerModal(false)}
                >
                  Use Selected Customer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showCustomerModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default Billing;
