import React, { useState, useMemo, useEffect } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../slices/authSlice";
import { setSales } from "../slices/reportsSlice";
import { fetchProducts } from "../slices/productsSlice";
import { getDashboard, ApiError } from "../api/api.js";
import ApiErrorFallback from "../components/ApiErrorFallback";
import DashboardFilterModal from "../components/DashboardFilterModal";
import { toast } from "../utils/toast";

const chartTypes = [
  { label: "Line", value: "line" },
  { label: "Bar", value: "bar" },
  { label: "Histogram", value: "hist" },
] as const;

type ChartType = (typeof chartTypes)[number]["value"];

const Dashboard: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<string>("Today");
  const [paymentFilter, setPaymentFilter] = useState<string>("All");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiError, setHasApiError] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const sales = useAppSelector((s) => s.reports.sales) ?? [];
  const products = useAppSelector((s) => s.products.items) ?? [];
  const token = useAppSelector((s) => s.auth.token) || undefined;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasApiError(false);
      console.log('[Dashboard] Fetching dashboard data from API...');
      const data = await getDashboard({ token });
      console.log('[Dashboard] Data received:', data);
      
      // Validate API response
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }
        
        // Update sales in Redux store - map to ensure all required fields are present
        if (data && data.sales && Array.isArray(data.sales)) {
          const mappedSales = data.sales.map((sale) => ({
            id: sale.id,
            date: sale.date,
            total: sale.total || 0,
            paymentMethod: sale.paymentMethod || "Cash",
            items: sale.items || [],
            subtotal: sale.subtotal || 0,
            tax: sale.tax || 0,
            discount: sale.discount || 0,
            customer: (sale.customer && typeof sale.customer === 'object' && 'id' in sale.customer && 'name' in sale.customer) 
              ? sale.customer as { id: string; name: string; phone?: string; email?: string }
              : null,
          }));
          dispatch(setSales(mappedSales));
          console.log('[Dashboard] Sales updated in Redux:', mappedSales.length, 'items');
        } else {
          console.warn('[Dashboard] No sales data in response');
          dispatch(setSales([]));
        }
        
        // Update products in Redux store (if not already loaded)
        if (data && data.products && Array.isArray(data.products)) {
          console.log('[Dashboard] Products data received:', data.products.length, 'items');
          // Check if products are already loaded, if not fetch them
          if (products.length === 0) {
            console.log('[Dashboard] Fetching products...');
            dispatch(fetchProducts());
          }
        } else {
          console.warn('[Dashboard] No products data in response');
        }
        setHasApiError(false);
      } catch (err) {
        console.error("[Dashboard] Failed to fetch dashboard data:", err);
        setHasApiError(true);
        if (err instanceof ApiError) {
          console.error("[Dashboard] API Error:", err.status, err.message);
          setError(`API Error (${err.status}): ${err.message}`);
        } else if (err instanceof Error) {
          console.error("[Dashboard] Error:", err.message);
          setError(`Failed to load dashboard data: ${err.message}`);
        } else {
          setError("Failed to load dashboard data. The API response could not be handled.");
        }
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchDashboardData();
  }, [dispatch, products.length]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);

  const filteredSales = useMemo(() => {
    let filtered = sales;
    if (paymentFilter !== "All") {
      filtered = filtered.filter(
        (d) => (d.paymentMethod || "Cash") === paymentFilter
      );
    }
    switch (dateFilter) {
      case "Today":
        filtered = filtered.filter(
          (d) => (d.date || "").slice(0, 10) === todayStr
        );
        break;
      case "Yesterday":
        filtered = filtered.filter(
          (d) => (d.date || "").slice(0, 10) === yesterdayStr
        );
        break;
      case "Weekly":
        filtered = filtered.slice(-7);
        break;
      case "Monthly":
        filtered = filtered.filter(
          (d) => (d.date || "").slice(0, 7) === todayStr.slice(0, 7)
        );
        break;
      case "Custom":
        if (startDate && endDate) {
          filtered = filtered.filter((d) => {
            const saleDate = (d.date || "").slice(0, 10);
            return saleDate >= startDate && saleDate <= endDate;
          });
        }
        break;
      default:
        break;
    }
    return filtered;
  }, [sales, dateFilter, paymentFilter, todayStr, yesterdayStr, startDate, endDate]);

  const totalFilteredSales = useMemo(
    () => filteredSales.reduce((sum, d) => sum + (d.total || 0), 0),
   [filteredSales]);

  // Filter functions
  const handleApplyFilters = () => {
    toast.success('Dashboard filters applied successfully')
  }

  const handleResetFilters = () => {
    setDateFilter('Today')
    setPaymentFilter('All')
    setStartDate('')
    setEndDate('')
    toast.success('Dashboard filters reset successfully')
  }

  const chartData = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        sales: number;
      }
    >();

    filteredSales.forEach((inv) => {
      const sourceDate = inv.date ? new Date(inv.date) : new Date();
      const key = sourceDate.toISOString().slice(0, 10);

      if (!map.has(key)) {
        map.set(key, {
          date: key,
          sales: 0,
        });
      }

      const record = map.get(key);
      if (record) {
        record.sales += inv.total || 0;
      }
    });

    return Array.from(map.values())
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((entry) => {
        const parsed = new Date(entry.date);
        return {
          ...entry,
          day: parsed.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
        };
      });
  }, [filteredSales]);

  const productSales: {
    [id: string]: { name: string; units: number; revenue: number };
  } = {};
  sales.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSales[item.productId]) {
        const prod = products.find((p) => p.id === item.productId);
        productSales[item.productId] = {
          name: prod ? prod.name : item.name,
          units: 0,
          revenue: 0,
        };
      }
      productSales[item.productId].units += item.qty;
      productSales[item.productId].revenue += item.price * item.qty;
    });
  });

  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStock = products.filter((p) => (p.stock || 0) <= 10).length;

  const renderTooltip = () => (
    <Tooltip
      formatter={(value: number | string) => {
        const numeric = typeof value === "number" ? value : Number(value || 0);
        return [`₹${numeric.toLocaleString()}`, "Sales"];
      }}
      labelFormatter={(_, payload) => {
        if (payload && payload.length > 0) {
          const entry = payload[0].payload as { date?: string; day?: string };
          if (entry?.date) {
            return new Date(entry.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }
          return entry?.day || "";
        }
        return "";
      }}
    />
  );

  const renderActiveChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 24, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d6e0f5" opacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            {renderTooltip()}
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#0d6efd"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d6e0f5" opacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            {renderTooltip()}
            <Bar dataKey="sales" fill="#0d6efd" radius={[6, 6, 0, 0]} />
          </BarChart>
        );
      case "hist":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#d6e0f5" opacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            {renderTooltip()}
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#0d6efd"
              fill="url(#colorSales)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  const quickStats = useMemo(
    () => [
      {
        label: "Filtered Sales",
        value: `₹${totalFilteredSales.toLocaleString()}`,
        accent: "text-primary",
      },
      {
        label: "Bills",
        value: `${filteredSales.length}`,
        accent: "text-success",
      },
      {
        label: "Products in Stock",
        value: totalStock.toLocaleString(),
        accent: "text-info",
      },
      {
        label: "Low Stock Alerts",
        value: `${lowStock}`,
        accent: "text-danger",
      },
    ],
    [filteredSales.length, lowStock, totalFilteredSales, totalStock]
  );

  if (loading) {
    return (
      <div className="dashboard-page themed-page py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasApiError && error) {
    return (
      <div className="dashboard-page themed-page py-4 px-3">
        <ApiErrorFallback 
          error={error}
          onRetry={fetchDashboardData}
          title="Unable to Load Dashboard"
          icon="bi-speedometer2"
        />
      </div>
    );
  }

  if (error && !hasApiError) {
    return (
      <div className="dashboard-page themed-page py-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Warning</h4>
          <p>{error}</p>
          <hr />
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page themed-page pt-3 pb-1 px-2">
      <div className="page-header card border-0 gradient-bg text-white mb-4 overflow-hidden">
        <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-4">
          <div>
            <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <span role="img" aria-label="dashboard">
                📊
              </span>
              Dashboard
            </h3>
            <p className="mb-0 text-white-50">
              Monitor sales momentum, stock levels, and billing performance at a glance.
            </p>
          </div>
          <div className="d-flex flex-column flex-md-row gap-3 align-items-start align-items-md-center">
            <Button
              variant="light"
              size="lg"
              onClick={handleLogout}
              className="d-flex align-items-center justify-content-center shadow-sm logout-btn"
              style={{
                width: '48px',
                height: '48px',
                padding: 0,
                borderRadius: '50%',
                transition: 'all 0.2s ease',
              }}
              title="Logout"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <i className="bi bi-box-arrow-right" style={{ fontSize: '1.2rem' }}></i>
            </Button>
            <div className="d-flex flex-column flex-md-row gap-3 filter-group">
            <Button 
              variant="outline-primary" 
              className="glow-control d-flex align-items-center gap-2"
              onClick={() => setShowFilterModal(true)}
            >
              <i className="bi bi-funnel"></i>
              Filter
            </Button>
            <Form.Select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="glow-control"
            >
              {chartTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} chart
                </option>
              ))}
            </Form.Select>
            </div>
          </div>
        </div>
      </div>

      <Row className="mb-3 g-3">
        {quickStats.map((stat, index) => (
          <Col md={3} sm={6} key={stat.label}>
            <Card
              className="dashboard-card floating-card animate-slide-up text-center p-3"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <h6 className="text-muted text-uppercase small tracking-wide">{stat.label}</h6>
              <h4 className={`fw-bold mt-2 ${stat.accent}`}>{stat.value}</h4>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="p-3 shadow-sm rounded-4 themed-card animate-slide-up" style={{ animationDelay: "180ms" }}>
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <h6 className="fw-semibold mb-0">
            Sales ({dateFilter}, {paymentFilter})
          </h6>
          <span className="badge bg-light text-dark">
            {chartData.length} {chartData.length === 1 ? "day" : "days"} tracked
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          {renderActiveChart() || <div>No chart data available</div>}
        </ResponsiveContainer>
      </Card>

      {/* <Row className="g-3">
        <Col md={6}>
          <Card
            className="p-3 shadow-sm rounded-4 themed-card animate-slide-up h-100"
            style={{ animationDelay: "240ms" }}
          >
            <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
              <span role="img" aria-label="top products">
                🏆
              </span>
              Top-Selling Products
            </h6>
            <div className="scroll-shadow" style={{ maxHeight: "260px" }}>
              <Table striped bordered hover size="sm" className="themed-table">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>S.No</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No sales yet
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p, i) => (
                      <tr
                        key={`${p.name}-${i}`}
                        className="fade-in-row"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <td>{i + 1}</td>
                        <td>{p.name}</td>
                        <td>{p.units}</td>
                        <td>₹{p.revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
        <Col md={6}>
          <Card
            className="p-3 shadow-sm rounded-4 themed-card animate-slide-up h-100"
            style={{ animationDelay: "300ms" }}
          >
            <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
              <span role="img" aria-label="recent invoices">
                🧾
              </span>
              Recent Invoices
            </h6>
            <div className="scroll-shadow" style={{ maxHeight: "260px" }}>
              <Table striped bordered hover size="sm" className="themed-table">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>S.No</th>
                    <th>Invoice ID</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No invoices
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((d, i) => (
                      <tr
                        key={`${d.id}-${i}`}
                        className="fade-in-row"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <td>{i + 1}</td>
                        <td>{d.id}</td>
                        <td>₹{d.total?.toLocaleString()}</td>
                        <td>{d.paymentMethod || "Cash"}</td>
                        <td>{d.date ? new Date(d.date).toLocaleString() : ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row> */}
      
      {/* Dashboard Filter Modal */}
      <DashboardFilterModal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};

export default Dashboard;
