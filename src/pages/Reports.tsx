import React, { useEffect, useMemo, useState } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { loadSales, setSales } from '../slices/reportsSlice'
import { Card, Button, Row, Col } from 'react-bootstrap'
import { getSalesReport, ApiError } from '../api/api'
import { toast } from '../utils/toast'
import ApiErrorFallback from '../components/ApiErrorFallback'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14']

const Reports: React.FC = () => {
    const sales = useAppSelector(s => s.reports.sales)
    const dispatch = useAppDispatch()
    const [exportType, setExportType] = React.useState<'excel' | 'pdf' | 'csv'>('excel')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasApiError, setHasApiError] = useState(false)

    // Fetch sales data from API
    const fetchSales = async () => {
        try {
            setLoading(true)
            setError(null)
            setHasApiError(false)
            const data = await getSalesReport()
            
            // Validate API response
            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid API response format')
            }
            
            // Map API response to match Invoice type
            const mappedSales = data.map((sale) => ({
                id: sale.id,
                date: sale.date || new Date().toISOString(),
                total: sale.total || 0,
                paymentMethod: sale.paymentMethod || 'Cash',
                items: sale.items || [],
                subtotal: sale.subtotal || 0,
                tax: sale.tax || 0,
                discount: sale.discount || 0,
                customer: sale.customer || null,
                createdDate: sale.createdDate,
                createdTime: sale.createdTime,
            }))
            
            dispatch(setSales(mappedSales))
            setHasApiError(false)
        } catch (err) {
            console.error('[Reports] Failed to fetch sales:', err)
            setHasApiError(true)
            if (err instanceof ApiError) {
                setError(`Failed to load sales data: ${err.message}`)
                toast.error(`Failed to load sales data: ${err.message}`)
            } else if (err instanceof Error) {
                setError(`Failed to load sales data: ${err.message}`)
                toast.error(`Failed to load sales data: ${err.message}`)
            } else {
                setError('Failed to load sales data. The API response could not be handled.')
                toast.error('Failed to load sales data. Please try again.')
            }
            // Fallback to localStorage if API fails
            try {
                dispatch(loadSales())
            } catch (localError) {
                console.error('[Reports] Failed to load from localStorage:', localError)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSales()
    }, [dispatch])

    // Calculate statistics
    const stats = useMemo(() => {
        const total = sales.reduce((s, x) => s + (x.total || 0), 0)
        const totalInvoices = sales.length
        const avgOrderValue = totalInvoices > 0 ? total / totalInvoices : 0
        const totalTax = sales.reduce((s, x) => s + (x.tax || 0), 0)
        const totalDiscount = sales.reduce((s, x) => s + (x.discount || 0), 0)
        
        return { total, totalInvoices, avgOrderValue, totalTax, totalDiscount }
    }, [sales])

    // Sales over time (daily)
    const dailySalesData = useMemo(() => {
        const map = new Map<string, number>()
        sales.forEach(sale => {
            const date = sale.date ? new Date(sale.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
            map.set(date, (map.get(date) || 0) + (sale.total || 0))
        })
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, sales]) => ({
                date,
                sales: Number(sales.toFixed(2)),
                day: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            }))
    }, [sales])

    // Sales by month
    const monthlySalesData = useMemo(() => {
        const map = new Map<string, number>()
        sales.forEach(sale => {
            const date = sale.date ? new Date(sale.date) : new Date()
            const monthKey = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
            map.set(monthKey, (map.get(monthKey) || 0) + (sale.total || 0))
        })
        return Array.from(map.entries())
            .sort((a, b) => {
                const dateA = new Date(a[0])
                const dateB = new Date(b[0])
                return dateA.getTime() - dateB.getTime()
            })
            .map(([month, sales]) => ({
                month,
                sales: Number(sales.toFixed(2))
            }))
    }, [sales])

    // Sales by payment method
    const paymentMethodData = useMemo(() => {
        const map = new Map<string, number>()
        sales.forEach(sale => {
            const method = sale.paymentMethod || 'Cash'
            map.set(method, (map.get(method) || 0) + (sale.total || 0))
        })
        return Array.from(map.entries())
            .map(([name, value]) => ({
                name,
                value: Number(value.toFixed(2))
            }))
            .sort((a, b) => b.value - a.value)
    }, [sales])

    // Revenue trend (last 7 days)
    const weeklyTrendData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            return date.toISOString().slice(0, 10)
        })
        
        const salesByDate = new Map<string, number>()
        sales.forEach(sale => {
            const date = sale.date ? new Date(sale.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
            if (last7Days.includes(date)) {
                salesByDate.set(date, (salesByDate.get(date) || 0) + (sale.total || 0))
            }
        })

        return last7Days.map(date => ({
            date,
            revenue: Number((salesByDate.get(date) || 0).toFixed(2)),
            day: new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
        }))
    }, [sales])

    const handleExport = () => {
        if (exportType === 'excel' || exportType === 'csv') {
            const ws = XLSX.utils.json_to_sheet(
                sales.map(s => ({
                    Invoice: s.id,
                    Date: new Date(s.date).toLocaleString(),
                    Customer: s.customer?.name || 'N/A',
                    Subtotal: s.subtotal?.toFixed(2) || '0.00',
                    Tax: s.tax?.toFixed(2) || '0.00',
                    Discount: s.discount?.toFixed(2) || '0.00',
                    Total: s.total.toFixed(2),
                    Payment: s.paymentMethod || 'Cash',
                }))
            )
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Sales Report')
            if (exportType === 'excel') {
                XLSX.writeFile(wb, 'sales-report.xlsx')
            } else {
                XLSX.writeFile(wb, 'sales-report.csv')
            }
        } else if (exportType === 'pdf') {
            const doc = new jsPDF()
            doc.text('Sales Report', 14, 15)
            ;(doc as any).autoTable({
                head: [['Invoice', 'Date', 'Customer', 'Total', 'Payment']],
                body: sales.map(s => [
                    s.id,
                    new Date(s.date).toLocaleString(),
                    s.customer?.name || 'N/A',
                    `₹${s.total.toFixed(2)}`,
                    s.paymentMethod || 'Cash',
                ]),
                startY: 20,
            })
            doc.save('sales-report.pdf')
        }
    }

    const renderTooltip = (value: number | string) => {
        const numeric = typeof value === 'number' ? value : Number(value || 0)
        return `₹${numeric.toLocaleString()}`
    }

    if (loading) {
        return (
            <div className="reports-page themed-page py-4 px-3">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Loading sales data...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (hasApiError && error) {
        return (
            <div className="reports-page themed-page py-4 px-3">
                <ApiErrorFallback 
                    error={error}
                    onRetry={fetchSales}
                    title="Unable to Load Sales Reports"
                    icon="bi-graph-up-arrow"
                />
            </div>
        )
    }

    return (
        <div className="reports-page themed-page py-4 px-3">
            {/* Header */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-8">
                    <div className="d-flex flex-column">
                        <h3 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: '1.75rem' }}>
                            <i className="bi bi-graph-up-arrow text-primary" style={{ fontSize: '2rem' }}></i>
                            Sales Reports
                        </h3>
                        <p className="mb-0 text-muted">
                            Comprehensive analytics and insights into your sales performance.
                        </p>
                    </div>
                </div>
                <div className="col-12 col-lg-4 d-flex align-items-start justify-content-lg-end gap-2">
                    <select
                        className="form-select shadow-sm"
                        style={{ width: 'auto', minWidth: '120px' }}
                        value={exportType}
                        onChange={e => setExportType(e.target.value as any)}
                    >
                        <option value="excel">Excel</option>
                        <option value="pdf">PDF</option>
                        <option value="csv">CSV</option>
                    </select>
                    <Button variant="primary" className="shadow-sm" onClick={handleExport}>
                        <i className="bi bi-download me-2"></i>
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <Row className="g-4 mb-4">
                <Col xs={12} sm={6} md={4} lg={3}>
                    <Card className="border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: "20ms", borderRadius: '12px' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-3" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-currency-rupee text-primary" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                                <div>
                                    <div className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                        Total Sales
                                    </div>
                                    <div className="fw-bold text-primary" style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>
                                        ₹{stats.total.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} sm={6} md={4} lg={3}>
                    <Card className="border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: "40ms", borderRadius: '12px' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-success bg-opacity-10 rounded-circle p-3" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-receipt text-success" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                                <div>
                                    <div className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                        Total Invoices
                                    </div>
                                    <div className="fw-bold text-success" style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>
                                        {stats.totalInvoices}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} sm={6} md={4} lg={3}>
                    <Card className="border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: "60ms", borderRadius: '12px' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-info bg-opacity-10 rounded-circle p-3" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-cart-check text-info" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                                <div>
                                    <div className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                        Avg Order Value
                                    </div>
                                    <div className="fw-bold text-info" style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>
                                        ₹{stats.avgOrderValue.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} sm={6} md={4} lg={3}>
                    <Card className="border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: "80ms", borderRadius: '12px' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-warning bg-opacity-10 rounded-circle p-3" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-percent text-warning" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                                <div>
                                    <div className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                        Total Discount
                                    </div>
                                    <div className="fw-bold text-warning" style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>
                                        ₹{stats.totalDiscount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 1 */}
            <Row className="g-4 mb-4">
                <Col xs={12} lg={8}>
                    <Card className="border-0 shadow-sm animate-slide-up" style={{ animationDelay: "100ms", borderRadius: '12px' }}>
                        <Card.Header className="bg-white border-bottom py-3 px-4">
                            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                <i className="bi bi-graph-up text-primary"></i>
                                Sales Over Time
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#d6e0f5" opacity={0.4} />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={renderTooltip} />
                                    <Area type="monotone" dataKey="sales" stroke="#0d6efd" fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} lg={4}>
                    <Card className="border-0 shadow-sm animate-slide-up" style={{ animationDelay: "120ms", borderRadius: '12px' }}>
                        <Card.Header className="bg-white border-bottom py-3 px-4">
                            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                <i className="bi bi-pie-chart text-success"></i>
                                Payment Methods
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={paymentMethodData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(props: any) => {
                                            const { name, percent } = props
                                            return `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                                        }}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {paymentMethodData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={renderTooltip} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 2 */}
            <Row className="g-4 mb-4">
                <Col xs={12} lg={6}>
                    <Card className="border-0 shadow-sm animate-slide-up" style={{ animationDelay: "140ms", borderRadius: '12px' }}>
                        <Card.Header className="bg-white border-bottom py-3 px-4">
                            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                <i className="bi bi-bar-chart text-info"></i>
                                Monthly Sales
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#d6e0f5" opacity={0.4} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={renderTooltip} />
                                    <Bar dataKey="sales" fill="#0d6efd" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} lg={6}>
                    <Card className="border-0 shadow-sm animate-slide-up" style={{ animationDelay: "160ms", borderRadius: '12px' }}>
                        <Card.Header className="bg-white border-bottom py-3 px-4">
                            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                <i className="bi bi-graph-up-arrow text-warning"></i>
                                Weekly Revenue Trend
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#d6e0f5" opacity={0.4} />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={renderTooltip} />
                                    <Line type="monotone" dataKey="revenue" stroke="#ffc107" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Sales Table */}
            <Card className="shadow-sm border-0 animate-slide-up" style={{ animationDelay: "180ms", borderRadius: '12px' }}>
                <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4">
                    <span className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.1rem' }}>
                        <i className="bi bi-list-ul text-primary"></i>
                        Sales Details
                    </span>
                    <span className="badge bg-primary text-white px-3 py-2" style={{ fontSize: '0.85rem', borderRadius: '20px' }}>
                        {stats.totalInvoices} {stats.totalInvoices === 1 ? "invoice" : "invoices"}
                    </span>
                </Card.Header>
                <Card.Body className="p-0">
                    {sales.length === 0 ? (
                        <div className="empty-state text-center py-5 px-4">
                            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
                                <i className="bi bi-receipt fs-1 text-muted"></i>
                            </div>
                            <h5 className="fw-semibold mb-2">No sales data available</h5>
                            <p className="text-muted mb-0">
                                Sales reports will appear here once you start generating invoices.
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th scope="col" className="ps-4 py-3 fw-semibold" style={{ fontSize: '0.9rem' }}>
                                            <i className="bi bi-receipt me-2 text-primary"></i>Invoice
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold" style={{ fontSize: '0.9rem' }}>
                                            <i className="bi bi-calendar me-2 text-primary"></i>Date
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold" style={{ fontSize: '0.9rem' }}>
                                            <i className="bi bi-person me-2 text-primary"></i>Customer
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold" style={{ fontSize: '0.9rem' }}>
                                            <i className="bi bi-currency-rupee me-2 text-primary"></i>Total
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold" style={{ fontSize: '0.9rem' }}>
                                            <i className="bi bi-credit-card me-2 text-primary"></i>Payment
                                        </th>
                        </tr>
                    </thead>
                    <tbody>
                                    {sales.map((sale) => (
                                        <tr key={sale.id} style={{ transition: 'background-color 0.2s ease' }}>
                                            <td className="fw-semibold ps-4 py-3">{sale.id}</td>
                                            <td className="py-3">{new Date(sale.date).toLocaleString()}</td>
                                            <td className="py-3">{sale.customer?.name || 'N/A'}</td>
                                            <td className="py-3 fw-semibold text-primary">₹{sale.total.toFixed(2)}</td>
                                            <td className="py-3">
                                                <span className="badge bg-secondary">{sale.paymentMethod || 'Cash'}</span>
                                            </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    )
}
export default Reports
