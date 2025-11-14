import React, { useState, useMemo } from "react";
import { Card, Row, Col, Form } from "react-bootstrap";
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
import { useAppSelector } from "../store/hooks";

const paymentModes = ["All", "Cash", "UPI", "Card", "Wallet"];
const dateRanges = ["Today", "Yesterday", "Weekly", "Monthly", "Custom"];

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
  const sales = useAppSelector((s) => s.reports.sales) ?? [];
  const products = useAppSelector((s) => s.products.items) ?? [];

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
      default:
        break;
    }
    return filtered;
  }, [sales, dateFilter, paymentFilter, todayStr, yesterdayStr]);

  const totalFilteredSales = useMemo(
    () => filteredSales.reduce((sum, d) => sum + (d.total || 0), 0),
    [filteredSales]
  );

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

  return (
    <div className="dashboard-page themed-page py-4">
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
          <div className="d-flex flex-column flex-md-row gap-3 filter-group">
            <Form.Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="glow-control"
            >
              {dateRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </Form.Select>
            <Form.Select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="glow-control"
            >
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </Form.Select>
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

      <Row className="mb-4 g-3">
        {quickStats.map((stat, index) => (
          <Col md={3} sm={6} key={stat.label}>
            <Card
              className="dashboard-card floating-card animate-slide-up text-center"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <h6 className="text-muted text-uppercase small tracking-wide">{stat.label}</h6>
              <h4 className={`fw-bold mt-2 ${stat.accent}`}>{stat.value}</h4>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="p-3 mb-4 shadow-sm rounded-4 themed-card animate-slide-up" style={{ animationDelay: "180ms" }}>
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
    </div>
  );
};

export default Dashboard;
