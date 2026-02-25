import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// removed unused `useNavigate` import
import { Modal, Button } from "react-bootstrap";
import { toast } from "../utils/toast";
import {
  clearCart,
  updateQty,
  removeFromCart,
  addToCart,
} from "../slices/cartSlice";
import { addSale } from "../slices/reportsSlice";
import { deductStock } from "../slices/productsSlice";
import { setCustomers } from "../slices/customersSlice";
import { useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import type { Customer, Product } from "../types";
import {
  getCustomers,
  createCustomer,
  getProductByBarcode,
  createInvoice,
  getMyProfile,
  ApiError,
} from "../api/api.js";
import ApiErrorFallback from "../components/ApiErrorFallback";
import PaymentMethodModal from "../components/PaymentMethodModal";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: (...args: any[]) => void | Promise<void>;
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
  const cart = useSelector((state: RootState) => state.cart);
  const products = useSelector((state: RootState) => state.products.items);
  const customers = useAppSelector((state: RootState) => state.customers.items);
  const token =
    useAppSelector((state: RootState) => state.auth.token) || undefined;
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [modalMode, setModalMode] = useState<"select" | "create">("select");
  const [modalSearch, setModalSearch] = useState("");
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [customerErrors, setCustomerErrors] = useState<{
    [key: string]: string;
  }>({});
  const [pendingCustomerKey, setPendingCustomerKey] = useState<string | null>(
    null
  );
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 992 : false
  );
  const [processingPayment, setProcessingPayment] = useState(false);
  const [dbRazorpayKeyId, setDbRazorpayKeyId] = useState<string>("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [apiCustomers, setApiCustomers] = useState<Customer[]>([]);
  const [customerApiError, setCustomerApiError] = useState<string | null>(null);
  const [hasCustomerApiError, setHasCustomerApiError] = useState(false);
  const [recentlyCreatedCustomers, setRecentlyCreatedCustomers] = useState<
    Customer[]
  >([]);
  const paymentGatewayEnabled = useAppSelector(
    (state: RootState) => state.settings.paymentGatewayEnabled
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadRazorpayKey = async () => {
      if (!token) {
        if (mounted) setDbRazorpayKeyId("");
        return;
      }
      try {
        const res = await getMyProfile({ token });
        if (!mounted) return;
        const key = String(res?.user?.razorpayKeyId || "");
        setDbRazorpayKeyId(key);
      } catch (e) {
        if (!mounted) return;
        setDbRazorpayKeyId("");
      }
    };
    loadRazorpayKey();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Fetch customers from API on mount
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setCustomerApiError(null);
      setHasCustomerApiError(false);
      const data = await getCustomers({ token });

      // Validate API response
      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid API response format");
      }

      setApiCustomers(data || []);
      dispatch(setCustomers(data || []));
      setHasCustomerApiError(false);
    } catch (error) {
      console.error("[Billing] Failed to fetch customers:", error);
      setHasCustomerApiError(true);
      if (error instanceof ApiError) {
        setCustomerApiError(`Failed to load customers: ${error.message}`);
      } else if (error instanceof Error) {
        setCustomerApiError(`Failed to load customers: ${error.message}`);
      } else {
        setCustomerApiError(
          "Failed to load customers. The API response could not be handled."
        );
      }
      // Fallback to Redux store if API fails
      setApiCustomers(customers);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [dispatch]);

  // Search customers from API when modalSearch changes
  useEffect(() => {
    if (!showCustomerModal || modalMode !== "select") return;

    const searchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const data = await getCustomers({ token, search: modalSearch });
        setApiCustomers(data || []);
      } catch (error) {
        console.error("[Billing] Failed to search customers:", error);
        // Fallback to local filtering
        const term = modalSearch.toLowerCase();
        if (!term) {
          setApiCustomers(customers);
        } else {
          setApiCustomers(
            customers.filter(
              (c) =>
                c.name.toLowerCase().includes(term) ||
                (c.email && c.email.toLowerCase().includes(term)) ||
                (c.phone && c.phone.toLowerCase().includes(term))
            )
          );
        }
      } finally {
        setLoadingCustomers(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchCustomers();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [modalSearch, showCustomerModal, modalMode, customers]);

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
    const match = apiCustomers.find(
      (c) =>
        c.name.trim().toLowerCase() === nameKey &&
        (c.email ? c.email.trim().toLowerCase() : "") === emailKey &&
        (c.phone ? c.phone.trim() : "") === phoneKey
    );
    if (match) {
      setSelectedCustomer(match);
      setPendingCustomerKey(null);
    }
  }, [apiCustomers, pendingCustomerKey]);

  const filteredModalCustomers = useMemo(() => {
    return apiCustomers;
  }, [apiCustomers]);

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
        ? "flat"
        : prod.discount || prod.discountPrice
          ? "percentage"
          : undefined);
    if (discountType === "flat") {
      const amount =
        Number(prod.discountAmount ?? prod.discountValue ?? 0) || 0;
      return sum + Math.max(amount, 0) * qty;
    }
    const percent = Number(
      prod.discount ?? prod.discountPrice ?? prod.discountValue ?? 0
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
        ? "flat"
        : prod.discount || prod.discountPrice
          ? "percentage"
          : undefined);
    const discountPerUnit =
      discountType === "flat"
        ? Math.max(
          Number(prod.discountAmount ?? prod.discountValue ?? 0) || 0,
          0
        )
        : (price *
          Math.max(
            Number(
              prod.discount ?? prod.discountPrice ?? prod.discountValue ?? 0
            ) || 0,
            0
          )) /
        100;
    const priceAfterDiscount = Math.max(price - discountPerUnit, 0);
    const taxPercent = Number(prod.taxRate || prod.taxPercent) || 0;
    return sum + (taxPercent * priceAfterDiscount * qty) / 100;
  }, 0);

  const effectiveDiscount = Math.min(discount, subtotal);
  const total = Math.max(subtotal - effectiveDiscount, 0) + tax;
  const totalItemsInCart = cart.items.reduce(
    (sum, item) => sum + (item.qty || 0),
    0
  );
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
      ? [product.size, product.color].filter(Boolean).join(", ")
      : null;
    const displayName = variantInfo
      ? `${product.name} (${variantInfo})`
      : product.name;
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

  const handleBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    setBarcodeLoading(true);
    setBarcodeError(null);

    try {
      const product = await getProductByBarcode(barcode, { token });
      if (product) {
        addProductToCart(product);
        toast.success(`Added ${product.name} to cart`);
        setBarcodeInput("");
      } else {
        setBarcodeError("Product not found");
        toast.error("No product found with this barcode");
      }
    } catch (error) {
      console.error("[Billing] Barcode search error:", error);
      if (error instanceof ApiError) {
        setBarcodeError(error.message);
        toast.error(error.message);
      } else {
        setBarcodeError("Failed to search product");
        toast.error("Failed to search product by barcode");
      }
    } finally {
      setBarcodeLoading(false);
    }
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
      if (
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        )
      ) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const finalizeCheckout = async (paymentMethod: 'cash' | 'card' | 'online') => {
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
      paymentMethod,
      paymentStatus: 'paid',
      transactionId: `TXN-${Date.now()}`,
      refund: 0,
      netTotal: total,
      profit: 0,
      status: 'completed' as const,
    };

    // Persist invoice to backend so DB stock is decremented there.
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(invoice),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      const savedInvoice = result.invoice || invoice;

      // Backend persisted invoice and decremented DB stock — update UI to match
      dispatch(addSale(savedInvoice));
      dispatch(
        deductStock(cart.items.map((i) => ({ productId: i.productId, qty: i.qty })))
      );
      dispatch(clearCart());
      toast.success('Payment completed successfully');
      return;
    } catch (e) {
      console.error('[Billing] Failed to persist invoice to backend:', e);
      toast.error('Failed to create invoice. Please check your connection and try again.');
      // Don't proceed with local-only invoice as it creates stock inconsistency
      return;
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0 || processingPayment) return;

    // Create invoice object upfront for use in handlers
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
      refund: 0,
      netTotal: total,
      profit: 0,
      status: 'completed' as const,
    };

    // Get settings from Redux

    const razorpayKey = dbRazorpayKeyId;

    // Check if payment gateway is disabled in settings
    if (!paymentGatewayEnabled) {
      console.log(
        "Payment gateway disabled in settings. Showing payment method selection."
      );
      setShowPaymentModal(true);
      return;
    }

    // If no Razorpay key, proceed with direct checkout
    if (!razorpayKey) {
      console.warn("Razorpay not configured. Proceeding with direct checkout.");
      toast.info("Payment gateway not configured. Processing order directly.");
      setShowPaymentModal(true);
      return;
    }

    if (total <= 0) {
      setShowPaymentModal(true);
      return;
    }

    setProcessingPayment(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      toast.error("Unable to load Razorpay checkout. Please try again.");
      setProcessingPayment(false);
      return;
    }

    const amountInPaise = Math.round(total * 100);

    let orderId: string | undefined;
    try {
      const { default: axios } = await import("axios");
      const { data } = await axios.post(
        "/api/payments/create-order",
        {
          amount: amountInPaise,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            customer: selectedCustomer?.id ?? "guest",
            items: cart.items.length,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      orderId = data?.id || data?.orderId;
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
      handler: async (response: any) => {
        try {
          setProcessingPayment(true);
          // Attach payment details to invoice payload
          const serverPayload = {
            ...invoice,
            payment: {
              paymentId: response?.razorpay_payment_id,
              orderId: response?.razorpay_order_id,
              signature: response?.razorpay_signature,
              method: response?.method || 'razorpay',
            },
            paymentStatus: 'paid',
            paymentMethod: 'razorpay',
            transactionId: response?.razorpay_payment_id,
          };

          // Persist invoice on backend (this will decrement stock server-side)
          try {
            await createInvoice(serverPayload, { token });
            toast.success('Payment successful and invoice recorded');
          } catch (err) {
            console.error('[Billing] Failed to create invoice on server:', err);
            toast.error('Payment succeeded but failed to record invoice on server');
          }

          // Update frontend state (local stock and cart)
          dispatch(
            deductStock(
              cart.items.map((i) => ({ productId: i.productId, qty: i.qty }))
            )
          );
          dispatch(clearCart());
          dispatch(addSale(invoice));
        } finally {
          setProcessingPayment(false);
        }
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
        toast.error("Payment failed or cancelled. Please try again.");
        setProcessingPayment(false);
      });
      razorpayInstance.open();
    } catch (error) {
      console.error("Failed to start Razorpay checkout", error);
      toast.error("Unable to start payment. Please try again.");
      setProcessingPayment(false);
    }
  };

  const handlePaymentMethodSelect = async (method: 'cash' | 'card' | 'online') => {
    setShowPaymentModal(false);
    await finalizeCheckout(method);
  };

  const handlePaymentModalHide = () => {
    setShowPaymentModal(false);
  };

  // Show error fallback if customer API failed and no customers available
  if (
    hasCustomerApiError &&
    customerApiError &&
    apiCustomers.length === 0 &&
    customers.length === 0
  ) {
    return (
      <div className="billing-page themed-page py-4 px-3">
        <ApiErrorFallback
          error={customerApiError}
          onRetry={fetchCustomers}
          title="Unable to Load Customers"
          icon="bi-people-fill"
        />
      </div>
    );
  }

  return (
    <div className="billing-page themed-page py-3 px-2">
      {/* Redesigned Header Section */}
      <div className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: "50px", height: "50px" }}
            >
              <i
                className="bi bi-cart-check text-primary"
                style={{ fontSize: "1.5rem" }}
              ></i>
            </div>
            <div>
              <h4 className="mb-0 fw-bold text-dark">Quick Billing</h4>
              <p className="mb-0 small text-muted">
                Fast checkout and invoice generation
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary shadow-sm"
            onClick={() => {
              setModalMode(selectedCustomer ? "select" : "create");
              setModalSearch("");
              setShowCustomerModal(true);
            }}
            style={{ borderRadius: "10px" }}
          >
            <i className="bi bi-person-plus-fill me-2"></i>
            {selectedCustomer ? "Change Customer" : "Select Customer"}
          </button>
        </div>

        {/* Stats Row */}
        <div className="row g-3">
          {billingStats.map((stat, index) => (
            <div key={stat.label} className="col-6 col-md-3">
              <div
                className="card border-0 shadow-sm h-100 animate-slide-up"
                style={{
                  animationDelay: `${index * 50}ms`,
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                }}
              >
                <div className="card-body p-3">
                  <div
                    className="small text-muted mb-1"
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    className={`fw-bold ${stat.accent}`}
                    style={{ fontSize: "1.5rem" }}
                  >
                    {stat.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              {/* Barcode Scanner Input */}
              <form onSubmit={handleBarcodeSearch} className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-primary text-white">
                    <i className="bi bi-upc-scan"></i>
                  </span>
                  <input
                    className={`form-control glow-control ${barcodeError ? "is-invalid" : ""
                      }`}
                    placeholder="Scan or enter barcode..."
                    value={barcodeInput}
                    onChange={(e) => {
                      setBarcodeInput(e.target.value);
                      setBarcodeError(null);
                    }}
                    disabled={barcodeLoading}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={barcodeLoading || !barcodeInput.trim()}
                  >
                    {barcodeLoading ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      <i className="bi bi-search"></i>
                    )}
                  </button>
                </div>
                {barcodeError && (
                  <div className="text-danger small mt-1">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {barcodeError}
                  </div>
                )}
              </form>

              <input
                className="form-control glow-control mb-3"
                placeholder="Search by name or SKU"
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
                      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
                      p.barcode?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((p, index) => {
                    const variantInfo = p.parentProductId
                      ? [p.size, p.color].filter(Boolean).join(", ")
                      : null;
                    const displayName = variantInfo
                      ? `${p.name} (${variantInfo})`
                      : p.name;
                    return (
                      <div
                        key={p.id}
                        className="list-group-item d-flex justify-content-between align-items-center hover-list-item animate-slide-up"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div>
                          <div className="fw-semibold">{displayName}</div>
                          <div className="small text-muted">
                            {p.sku} | Stock: {p.stock} | ₹
                            {p.sellingPrice || p.price}
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
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
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

          {/* Selected Customer */}
          <div
            className="card shadow-sm themed-card animate-slide-up border-0"
            style={{
              animationDelay: "240ms",
              background: selectedCustomer
                ? "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)"
                : "#ffffff",
              border: selectedCustomer
                ? "2px solid #0d6efd"
                : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div
              className="card-header fw-bold d-flex justify-content-between align-items-center border-0 pb-2"
              style={{
                background: selectedCustomer
                  ? "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)"
                  : "transparent",
                color: selectedCustomer ? "#ffffff" : "#212529",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <span className="d-flex align-items-center gap-2">
                <i
                  className={`bi ${selectedCustomer ? "bi-person-check-fill" : "bi-person"
                    } ${selectedCustomer ? "" : "text-primary"}`}
                  style={{ fontSize: "1.2rem" }}
                ></i>
                Selected Customer
              </span>
              {selectedCustomer && (
                <span
                  className="badge bg-light text-primary"
                  style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                >
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Active
                </span>
              )}
            </div>
            <div className="card-body d-flex flex-column gap-3 p-4">
              {selectedCustomer ? (
                <>
                  {/* Customer Avatar and Name */}
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{
                        width: "60px",
                        height: "60px",
                        background:
                          "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)",
                        fontSize: "1.5rem",
                        boxShadow: "0 4px 12px rgba(13, 110, 253, 0.3)",
                      }}
                    >
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-0 fw-bold text-primary">
                        {selectedCustomer.name}
                      </h5>
                      <p className="mb-0 small text-muted">
                        Customer Information
                      </p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="d-flex flex-column gap-2">
                    {selectedCustomer.email && (
                      <div
                        className="d-flex align-items-center gap-2 p-2 rounded"
                        style={{ backgroundColor: "#f8f9fa" }}
                      >
                        <i
                          className="bi bi-envelope-fill text-primary"
                          style={{ fontSize: "1.1rem", width: "24px" }}
                        ></i>
                        <div className="flex-grow-1">
                          <div
                            className="small text-muted mb-0"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Email
                          </div>
                          <div className="fw-semibold small">
                            {selectedCustomer.email}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div
                        className="d-flex align-items-center gap-2 p-2 rounded"
                        style={{ backgroundColor: "#f8f9fa" }}
                      >
                        <i
                          className="bi bi-telephone-fill text-primary"
                          style={{ fontSize: "1.1rem", width: "24px" }}
                        ></i>
                        <div className="flex-grow-1">
                          <div
                            className="small text-muted mb-0"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Phone
                          </div>
                          <div className="fw-semibold small">
                            {selectedCustomer.phone}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm flex-fill"
                      onClick={() => {
                        setModalMode("select");
                        setModalSearch("");
                        setShowCustomerModal(true);
                      }}
                    >
                      <i className="bi bi-pencil me-2"></i>
                      Change
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        setSelectedCustomer(null);
                        toast.info("Customer selection cleared");
                      }}
                      style={{ minWidth: "100px" }}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Clear
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state text-center py-4">
                  <div
                    className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i
                      className="bi bi-person-circle text-primary"
                      style={{ fontSize: "3rem" }}
                    ></i>
                  </div>
                  <h6 className="fw-semibold mb-2">No Customer Selected</h6>
                  <p className="text-muted mb-3 small">
                    Select a customer to associate with this invoice
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setModalMode("select");
                      setModalSearch("");
                      setShowCustomerModal(true);
                    }}
                    style={{ borderRadius: "8px" }}
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Select Customer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recently Created Customers */}
          {recentlyCreatedCustomers.length > 0 && (
            <div
              className="card shadow-sm themed-card animate-slide-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="card-header fw-bold d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-clock-history me-2"></i>
                  Recently Created
                </span>
                <span className="badge bg-info">
                  {recentlyCreatedCustomers.length}
                </span>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  {recentlyCreatedCustomers.map((customer, index) => (
                    <div
                      key={customer.id}
                      className="list-group-item px-0 py-2 border-bottom"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        toast.success(`Customer "${customer.name}" selected`);
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold small">
                            {customer.name}
                            {selectedCustomer?.id === customer.id && (
                              <span className="badge bg-success ms-2">
                                Selected
                              </span>
                            )}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {customer.phone && (
                              <span>
                                <i className="bi bi-telephone me-1"></i>
                                {customer.phone}
                              </span>
                            )}
                            {customer.email && (
                              <span className={customer.phone ? " ms-2" : ""}>
                                <i className="bi bi-envelope me-1"></i>
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            toast.success(
                              `Customer "${customer.name}" selected`
                            );
                          }}
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        show={showCustomerModal}
        onHide={() => {
          setShowCustomerModal(false);
          setCustomerErrors({});
        }}
        centered
        size="lg"
        className="customer-modal"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center gap-2">
            <i className="bi bi-person-plus-fill"></i>
            {modalMode === "select" ? "Select Customer" : "Create New Customer"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {/* Mode Toggle Buttons */}
          <div className="d-flex gap-2 mb-4" role="group">
            <button
              type="button"
              className={`btn flex-fill ${modalMode === "select" ? "btn-primary" : "btn-outline-primary"
                }`}
              onClick={() => setModalMode("select")}
              style={{
                transition: "all 0.3s ease",
                borderRadius: "8px",
                fontWeight: modalMode === "select" ? "600" : "400",
              }}
            >
              <i
                className={`bi ${modalMode === "select" ? "bi-check-circle-fill" : "bi-people"
                  } me-2`}
              ></i>
              Existing Customer
            </button>
            <button
              type="button"
              className={`btn flex-fill ${modalMode === "create" ? "btn-primary" : "btn-outline-primary"
                }`}
              onClick={() => setModalMode("create")}
              style={{
                transition: "all 0.3s ease",
                borderRadius: "8px",
                fontWeight: modalMode === "create" ? "600" : "400",
              }}
            >
              <i
                className={`bi ${modalMode === "create"
                    ? "bi-check-circle-fill"
                    : "bi-person-plus"
                  } me-2`}
              ></i>
              New Customer
            </button>
          </div>

          {/* Select Customer Pane */}
          <div
            className={`select-customer-pane ${modalMode === "select" ? "active" : ""
              }`}
            style={{
              display: modalMode === "select" ? "block" : "none",
              animation:
                modalMode === "select" ? "slideInRight 0.4s ease-out" : "none",
            }}
          >
            <div className="position-relative mb-3">
              <i
                className="bi bi-search position-absolute"
                style={{
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                  zIndex: 10,
                }}
              ></i>
              <input
                className="form-control glow-control ps-5"
                placeholder="Search by name, email, or phone"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                style={{ borderRadius: "8px" }}
              />
            </div>
            <div
              className="scroll-shadow"
              style={{ maxHeight: "350px", borderRadius: "8px" }}
            >
              {loadingCustomers ? (
                <div className="empty-state text-center py-5">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mb-0 small">Loading customers...</p>
                </div>
              ) : filteredModalCustomers.length === 0 ? (
                <div className="empty-state text-center py-5">
                  <div
                    className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i className="bi bi-search fs-2 text-muted"></i>
                  </div>
                  <h6 className="fw-semibold mb-2">No customers found</h6>
                  <p className="text-muted mb-0 small">
                    Try a different search term or create a new customer.
                  </p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredModalCustomers.map((customer, index) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 py-3 customer-item"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerModal(false);
                        toast.success(`Customer "${customer.name}" selected`);
                      }}
                      style={{
                        animation: `fadeInUp 0.3s ease-out ${index * 0.05
                          }s both`,
                        borderRadius: "8px",
                        marginBottom: "4px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: "45px",
                            height: "45px",
                            minWidth: "45px",
                          }}
                        >
                          <i className="bi bi-person-fill text-primary"></i>
                        </div>
                        <div>
                          <div className="fw-semibold">{customer.name}</div>
                          <div className="small text-muted">
                            {[customer.email, customer.phone]
                              .filter(Boolean)
                              .join(" · ") || "No contact info"}
                          </div>
                        </div>
                      </div>
                      <i className="bi bi-chevron-right text-primary"></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create Customer Pane */}
          <div
            className={`create-customer-pane ${modalMode === "create" ? "active" : ""
              }`}
            style={{
              display: modalMode === "create" ? "block" : "none",
              animation:
                modalMode === "create" ? "slideInLeft 0.4s ease-out" : "none",
            }}
          >
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <i className="bi bi-person text-primary"></i>
                  Full Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className={`form-control glow-control${customerErrors.name ? " is-invalid" : ""
                    }`}
                  name="name"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter customer full name"
                  style={{
                    borderRadius: "8px",
                    animation: "fadeInUp 0.3s ease-out 0.1s both",
                  }}
                />
                {customerErrors.name && (
                  <div
                    className="invalid-feedback d-block animate-fade-in"
                    style={{ animation: "fadeIn 0.3s ease-out" }}
                  >
                    {customerErrors.name}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <i className="bi bi-envelope text-primary"></i>
                  Email Address
                </label>
                <input
                  className={`form-control glow-control${customerErrors.email ? " is-invalid" : ""
                    }`}
                  name="email"
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="name@example.com"
                  style={{
                    borderRadius: "8px",
                    animation: "fadeInUp 0.3s ease-out 0.2s both",
                  }}
                />
                {customerErrors.email && (
                  <div
                    className="invalid-feedback d-block animate-fade-in"
                    style={{ animation: "fadeIn 0.3s ease-out" }}
                  >
                    {customerErrors.email}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <i className="bi bi-telephone text-primary"></i>
                  Phone Number
                </label>
                <input
                  className={`form-control glow-control${customerErrors.phone ? " is-invalid" : ""
                    }`}
                  name="phone"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Optional phone number"
                  maxLength={15}
                  style={{
                    borderRadius: "8px",
                    animation: "fadeInUp 0.3s ease-out 0.3s both",
                  }}
                />
                {customerErrors.phone && (
                  <div
                    className="invalid-feedback d-block animate-fade-in"
                    style={{ animation: "fadeIn 0.3s ease-out" }}
                  >
                    {customerErrors.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button
            variant="secondary"
            onClick={() => {
              setShowCustomerModal(false);
              setCustomerErrors({});
            }}
            style={{ borderRadius: "8px" }}
          >
            Cancel
          </Button>
          {modalMode === "create" ? (
            <Button
              variant="primary"
              disabled={loadingCustomers}
              onClick={async () => {
                const trimmedName = customerForm.name.trim();
                const trimmedEmail = customerForm.email.trim();
                const trimmedPhone = customerForm.phone.trim();
                const errs: { [key: string]: string } = {};
                if (!trimmedName) errs.name = "Customer name is required";
                if (
                  trimmedEmail &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
                ) {
                  errs.email = "Enter a valid email";
                }
                if (trimmedPhone && trimmedPhone.length < 6) {
                  errs.phone = "Enter a valid phone number";
                }
                setCustomerErrors(errs);
                if (Object.keys(errs).length > 0) return;

                try {
                  setLoadingCustomers(true);
                  const newCustomer = await createCustomer(
                    {
                      name: trimmedName,
                      email: trimmedEmail || undefined,
                      phone: trimmedPhone || undefined,
                    },
                    { token }
                  );

                  // Update local state and Redux
                  setApiCustomers([...apiCustomers, newCustomer]);
                  // Note: addCustomer in slice expects Omit<Customer, 'id'>, but we have full Customer from API
                  // So we'll use setCustomers to update the full list instead
                  const updatedCustomers = [...apiCustomers, newCustomer];
                  dispatch(setCustomers(updatedCustomers));
                  setSelectedCustomer(newCustomer);

                  // Add to recently created customers (keep last 5)
                  setRecentlyCreatedCustomers((prev) => {
                    const updated = [
                      newCustomer,
                      ...prev.filter((c) => c.id !== newCustomer.id),
                    ];
                    return updated.slice(0, 5);
                  });

                  toast.success(
                    `Customer "${newCustomer.name}" created successfully!`
                  );

                  setCustomerForm({ name: "", email: "", phone: "" });
                  setCustomerErrors({});
                  setModalMode("select");
                  setModalSearch("");
                  setShowCustomerModal(false);
                } catch (error) {
                  console.error("[Billing] Failed to create customer:", error);
                  if (error instanceof ApiError) {
                    if (
                      error.details &&
                      typeof error.details === "object" &&
                      "details" in error.details
                    ) {
                      const validationErrors =
                        (error.details as any).details || [];
                      const errs: { [key: string]: string } = {};
                      validationErrors.forEach((err: any) => {
                        if (err.path) {
                          errs[err.path] = err.message;
                        }
                      });
                      setCustomerErrors(errs);
                    } else {
                      toast.error(
                        `Failed to create customer: ${error.message}`
                      );
                    }
                  } else {
                    toast.error("Failed to create customer. Please try again.");
                  }
                } finally {
                  setLoadingCustomers(false);
                }
              }}
              style={{ borderRadius: "8px" }}
            >
              {loadingCustomers ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Save Customer
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!selectedCustomer}
              onClick={() => setShowCustomerModal(false)}
              style={{ borderRadius: "8px" }}
            >
              <i className="bi bi-check-circle me-2"></i>
              Use Selected Customer
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <PaymentMethodModal
        show={showPaymentModal}
        onHide={handlePaymentModalHide}
        onSelectPaymentMethod={handlePaymentMethodSelect}
        processing={processingPayment}
      />
    </div>
  );
};

export default Billing;
