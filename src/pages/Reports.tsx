import React, { useEffect, useMemo, useState, Suspense } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { loadSales, setSales } from '../slices/reportsSlice'
import { Card, Button } from 'react-bootstrap'
import { getSalesReport, ApiError } from '../api/api.js'
import { toast } from '../utils/toast'
import ApiErrorFallback from '../components/ApiErrorFallback'
import FilterModal from '../components/FilterModal'
import type { EnhancedInvoice } from '../types'
const ReportsCharts = React.lazy(() => import('./ReportsCharts'))

const Reports: React.FC = () => {
    const sales = useAppSelector(s => s.reports.sales)
    const token = useAppSelector(s => s.auth.token) || undefined
    const dispatch = useAppDispatch()
    const [exportType, setExportType] = React.useState<'excel' | 'pdf' | 'csv'>('excel')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasApiError, setHasApiError] = useState(false)
    
    // Filter states
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'custom'>('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
    const [showFilterModal, setShowFilterModal] = useState(false)

    // Fetch sales data from API
    const fetchSales = async () => {
        try {
            setLoading(true)
            setError(null)
            setHasApiError(false)
            const data = await getSalesReport({ token })
            
            // Validate API response
            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid API response format')
            }
            
            // Map API response to match EnhancedInvoice type with calculated values
            const mappedSales: EnhancedInvoice[] = data.map((sale) => {
                const refund = sale.refundTotal || 0
                const netTotal = (sale.total || 0) - refund
                // Calculate profit (assuming 70% cost margin - you can adjust this)
                const profit = netTotal * 0.7
                
                return {
                    ...sale,
                    refund: refund,
                    netTotal: netTotal,
                    profit: profit,
                    status: refund > 0 ? (refund >= sale.total ? 'refunded' : 'partial_refund') : 'completed',
                }
            })
            
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

    // Get unique payment methods for filter dropdown
    const uniquePaymentMethods = useMemo(() => {
        const methods = new Set<string>()
        sales.forEach(sale => {
            if (sale.paymentMethod) {
                methods.add(sale.paymentMethod)
            }
        })
        return Array.from(methods).sort()
    }, [sales])

    // Filter sales data based on selected filters
    const filteredSales = useMemo(() => {
        let filtered = [...sales]
        
        // Date filtering
        if (dateFilter !== 'all') {
            const now = new Date()
            let start: Date
            let end: Date
            
            switch (dateFilter) {
                case 'today':
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                    break
                case 'weekly':
                    start = new Date(now)
                    start.setDate(now.getDate() - 7)
                    end = new Date()
                    break
                case 'monthly':
                    start = new Date(now.getFullYear(), now.getMonth(), 1)
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    break
                case 'custom':
                    if (startDate && endDate) {
                        start = new Date(startDate)
                        end = new Date(endDate)
                        end.setHours(23, 59, 59, 999) // Include full end date
                    } else {
                        return [] // Return empty if custom dates not set
                    }
                    break
                default:
                    return filtered
            }
            
            filtered = filtered.filter(sale => {
                const saleDate = new Date(sale.date)
                return saleDate >= start && saleDate <= end
            })
        }
        
        // Payment method filtering
        if (paymentMethodFilter !== 'all') {
            filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter)
        }
        
        return filtered
    }, [sales, dateFilter, startDate, endDate, paymentMethodFilter])

    // Calculate statistics based on filtered data
    const stats = useMemo(() => {
        const total = filteredSales.reduce((s, x: EnhancedInvoice) => s + (x.total || 0), 0)
        const totalInvoices = filteredSales.length
        const avgOrderValue = totalInvoices > 0 ? total / totalInvoices : 0
        const totalTax = filteredSales.reduce((s, x: EnhancedInvoice) => s + (x.tax || 0), 0)
        const totalDiscount = filteredSales.reduce((s, x: EnhancedInvoice) => s + (x.discount || 0), 0)
        const totalRefund = filteredSales.reduce((s, x: EnhancedInvoice) => s + (x.refund || 0), 0)
        const totalNet = filteredSales.reduce((s, x: EnhancedInvoice) => s + (x.netTotal || 0), 0)
        const totalProfit = filteredSales.reduce((s, x: EnhancedInvoice) => s + (x.profit || 0), 0)
        
        return { 
            total, 
            totalInvoices, 
            avgOrderValue, 
            totalTax, 
            totalDiscount, 
            totalRefund, 
            totalNet, 
            totalProfit 
        }
    }, [filteredSales])

    // Filter functions
    const handleApplyFilters = () => {
        // Filters are already applied through state updates
        toast.success('Filters applied successfully')
    }

    const handleResetFilters = () => {
        setDateFilter('all')
        setStartDate('')
        setEndDate('')
        setPaymentMethodFilter('all')
        toast.success('Filters reset successfully')
    }

    // Profit over time (daily) - based on filtered data
    const dailyProfitData = useMemo(() => {
        const map = new Map<string, number>()
        filteredSales.forEach(sale => {
            const date = sale.date ? new Date(sale.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
            map.set(date, (map.get(date) || 0) + (sale.profit || 0))
        })
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, profit]) => ({
                date,
                profit: Number(profit.toFixed(2)),
                day: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            }))
    }, [filteredSales])

    // Sales by month - based on filtered data
    const monthlySalesData = useMemo(() => {
        const map = new Map<string, number>()
        filteredSales.forEach(sale => {
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
    }, [filteredSales])

    // Sales by payment method - based on filtered data
    const paymentMethodData = useMemo(() => {
        const map = new Map<string, number>()
        filteredSales.forEach(sale => {
            const method = sale.paymentMethod || 'Cash'
            map.set(method, (map.get(method) || 0) + (sale.total || 0))
        })
        return Array.from(map.entries())
            .map(([name, value]) => ({
                name,
                value: Number(value.toFixed(2))
            }))
            .sort((a, b) => b.value - a.value)
    }, [filteredSales])

    // Revenue trend (last 7 days) - based on filtered data
    const weeklyTrendData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            return date.toISOString().slice(0, 10)
        })
        
        const salesByDate = new Map<string, number>()
        const profitByDate = new Map<string, number>()
        
        filteredSales.forEach(sale => {
            const date = sale.date ? new Date(sale.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
            if (last7Days.includes(date)) {
                salesByDate.set(date, (salesByDate.get(date) || 0) + (sale.netTotal || 0))
                profitByDate.set(date, (profitByDate.get(date) || 0) + (sale.profit || 0))
            }
        })

        return last7Days.map(date => ({
            date,
            revenue: Number((salesByDate.get(date) || 0).toFixed(2)),
            profit: Number((profitByDate.get(date) || 0).toFixed(2)),
            day: new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
        }))
    }, [filteredSales])

    const handleExport = async () => {
        if (exportType === 'excel' || exportType === 'csv') {
            const XLSX = await import('xlsx')
            
            // Prepare data for export
            const exportData = filteredSales.map((s: EnhancedInvoice) => ({
                Invoice: s.id,
                Date: new Date(s.date).toLocaleString(),
                Customer: s.customer?.name || 'N/A',
                Subtotal: s.subtotal?.toFixed(2) || '0.00',
                Tax: s.tax?.toFixed(2) || '0.00',
                Discount: s.discount?.toFixed(2) || '0.00',
                Total: s.total.toFixed(2),
                Refund: s.refund?.toFixed(2) || '0.00',
                'Net Total': s.netTotal.toFixed(2),
                Profit: s.profit.toFixed(2),
                Status: s.status.charAt(0).toUpperCase() + s.status.slice(1).replace('_', ' '),
                Payment: s.paymentMethod || 'Cash',
            }))
            
            // Add total row
            exportData.push({
                Invoice: 'TOTAL',
                Date: '',
                Customer: '',
                Subtotal: stats.totalTax.toFixed(2),
                Tax: stats.totalTax.toFixed(2),
                Discount: stats.totalDiscount.toFixed(2),
                Total: stats.total.toFixed(2),
                Refund: stats.totalRefund.toFixed(2),
                'Net Total': stats.totalNet.toFixed(2),
                Profit: stats.totalProfit.toFixed(2),
                Status: '',
                Payment: '',
            })
            
            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Sales Report')
            
            // Add profit summary sheet
            const profitSummary = [
                { Metric: 'Total Revenue', Amount: stats.total.toFixed(2) },
                { Metric: 'Total Refund', Amount: stats.totalRefund.toFixed(2) },
                { Metric: 'Net Revenue', Amount: stats.totalNet.toFixed(2) },
                { Metric: 'Total Profit', Amount: stats.totalProfit.toFixed(2) },
                { Metric: 'Profit Margin', Amount: `${stats.totalNet > 0 ? ((stats.totalProfit / stats.totalNet) * 100).toFixed(2) : 0}%` },
                { Metric: 'Total Invoices', Amount: stats.totalInvoices.toString() },
                { Metric: 'Average Order Value', Amount: stats.avgOrderValue.toFixed(2) },
            ]
            const profitWs = XLSX.utils.json_to_sheet(profitSummary)
            XLSX.utils.book_append_sheet(wb, profitWs, 'Profit Summary')
            
            if (exportType === 'excel') {
                XLSX.writeFile(wb, 'sales-report.xlsx')
            } else {
                XLSX.writeFile(wb, 'sales-report.csv')
            }
        } else if (exportType === 'pdf') {
            const jsPDFModule = await import('jspdf')
            const { default: jsPDF } = jsPDFModule
            const jspdfAutotable = await import('jspdf-autotable')
            
            const doc = new jsPDF()
            
            // Add title
            doc.setFontSize(16)
            doc.text('Sales Report', 14, 15)
            
            doc.setFontSize(12)
            doc.text(`Total Revenue: ₹${stats.total.toFixed(2)}`, 14, 25)
            doc.text(`Total Profit: ₹${stats.totalProfit.toFixed(2)}`, 14, 32)
            doc.text(`Total Invoices: ${stats.totalInvoices}`, 14, 39)
            
            // Prepare table data
            const tableData = filteredSales.map((s: EnhancedInvoice) => [
                s.id,
                new Date(s.date).toLocaleDateString(),
                s.customer?.name || 'N/A',
                `₹${s.total.toFixed(2)}`,
                `₹${s.refund.toFixed(2)}`,
                `₹${s.netTotal.toFixed(2)}`,
                `₹${s.profit.toFixed(2)}`,
                s.status.charAt(0).toUpperCase() + s.status.slice(1).replace('_', ' '),
                s.paymentMethod || 'Cash',
            ])
            
            // Add total row
            tableData.push([
                'TOTAL',
                '',
                '',
                `₹${stats.total.toFixed(2)}`,
                `₹${stats.totalRefund.toFixed(2)}`,
                `₹${stats.totalNet.toFixed(2)}`,
                `₹${stats.totalProfit.toFixed(2)}`,
                '',
                '',
            ])
            
            // Add table
            jspdfAutotable.default(doc, {
                head: [['Invoice', 'Date', 'Customer', 'Total', 'Refund', 'Net', 'Profit', 'Status', 'Payment']],
                body: tableData,
                startY: 50,
                foot: [['', '', '', '₹' + stats.total.toFixed(2), '₹' + stats.totalRefund.toFixed(2), '₹' + stats.totalNet.toFixed(2), '₹' + stats.totalProfit.toFixed(2), '', '']],
                footStyles: { fillColor: [200, 200, 200], textColor: 0 },
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246], textColor: 255 },
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
            <style>{`
                .sticky-header .sticky-top {
                    top: 0;
                    z-index: 10;
                    background-color: #f8f9fa !important;
                }
                .table-responsive {
                    border: 1px solid #dee2e6;
                    border-radius: 0.375rem;
                }
            `}</style>
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
                    <Button 
                        variant="outline-primary" 
                        className="shadow-sm d-flex align-items-center gap-2"
                        onClick={() => setShowFilterModal(true)}
                    >
                        <i className="bi bi-funnel"></i>
                        Filter
                    </Button>
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

            <div className="row g-3 mb-4">
                <div className="col-12">
                    <Suspense fallback={<div style={{ minHeight: 240 }}><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
                        <ReportsCharts
                            monthlySalesData={monthlySalesData}
                            paymentMethodData={paymentMethodData}
                            weeklyTrendData={weeklyTrendData}
                            dailyProfitData={dailyProfitData}
                            renderTooltip={renderTooltip}
                        />
                    </Suspense>
                </div>
            </div>

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
                        <div className="table-responsive" style={{ maxHeight: '500px' }}>
                            <table className="table table-hover align-middle mb-0 sticky-header">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th scope="col" className="ps-4 py-3 fw-semibold" style={{ fontSize: '0.9rem', minWidth: '100px' }}>
                                            <i className="bi bi-receipt me-2 text-primary"></i>Invoice
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold" style={{ fontSize: '0.9rem', minWidth: '140px' }}>
                                            <i className="bi bi-calendar me-2 text-primary"></i>Date
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold" style={{ fontSize: '0.9rem', minWidth: '150px' }}>
                                            <i className="bi bi-person me-2 text-primary"></i>Customer
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold text-end" style={{ fontSize: '0.9rem', minWidth: '100px' }}>
                                            <i className="bi bi-currency-rupee me-2 text-primary"></i>Total
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold text-end" style={{ fontSize: '0.9rem', minWidth: '100px' }}>
                                            <i className="bi bi-arrow-counterclockwise me-2 text-warning"></i>Refund
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold text-end" style={{ fontSize: '0.9rem', minWidth: '100px' }}>
                                            <i className="bi bi-cash-coin me-2 text-success"></i>Net Total
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold text-end" style={{ fontSize: '0.9rem', minWidth: '100px' }}>
                                            <i className="bi bi-graph-up me-2 text-info"></i>Profit
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold text-center" style={{ fontSize: '0.9rem', minWidth: '120px' }}>
                                            <i className="bi bi-flag me-2 text-primary"></i>Status
                                        </th>
                                        <th scope="col" className="py-3 fw-semibold text-center" style={{ fontSize: '0.9rem', minWidth: '120px' }}>
                                            <i className="bi bi-credit-card me-2 text-primary"></i>Payment
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.map((sale: EnhancedInvoice) => (
                                        
                                        <tr key={sale.id} style={{ transition: 'background-color 0.2s ease' }}>
                                            <td className="fw-semibold ps-4 py-3">{sale.id}</td>
                                            <td className="py-3">{new Date(sale.date).toLocaleString()}</td>
                                            <td className="py-3">{sale.customer?.name || 'N/A'}</td>
                                            <td className="py-3 fw-semibold text-end">₹{sale.total.toFixed(2)}</td>
                                            <td className="py-3 fw-semibold text-end text-warning">₹{sale.refund.toFixed(2)}</td>
                                            <td className="py-3 fw-semibold text-end text-success">₹{sale.netTotal.toFixed(2)}</td>
                                            <td className="py-3 fw-semibold text-end text-info">₹{sale.profit.toFixed(2)}</td>
                                            <td className="py-3 text-center">
                                                <span className={`badge ${
                                                    sale.status === 'completed' ? 'bg-success' : 
                                                    sale.status === 'refunded' ? 'bg-danger' : 
                                                    sale.status === 'partial_refund' ? 'bg-warning' : 
                                                    'bg-secondary'
                                                }`}>
                                                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1).replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className="badge bg-secondary">{sale.paymentMethod || 'Cash'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Total Row */}
                                    <tr className="table-primary fw-bold">
                                        <td className="ps-4 py-3">TOTAL</td>
                                        <td className="py-3"></td>
                                        <td className="py-3"></td>
                                        <td className="py-3 text-end">₹{stats.total.toFixed(2)}</td>
                                        <td className="py-3 text-end text-warning">₹{stats.totalRefund.toFixed(2)}</td>
                                        <td className="py-3 text-end text-success">₹{stats.totalNet.toFixed(2)}</td>
                                        <td className="py-3 text-end text-info">₹{stats.totalProfit.toFixed(2)}</td>
                                        <td className="py-3 text-center"></td>
                                        <td className="py-3 text-center"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>
            
            {/* Filter Modal */}
            <FilterModal
                show={showFilterModal}
                onHide={() => setShowFilterModal(false)}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                paymentMethodFilter={paymentMethodFilter}
                setPaymentMethodFilter={setPaymentMethodFilter}
                uniquePaymentMethods={uniquePaymentMethods}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
            />
        </div>
    )
}
export default Reports
