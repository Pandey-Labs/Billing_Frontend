import React, { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { loadSales } from '../slices/reportsSlice'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const Reports: React.FC = () => {
    const sales = useAppSelector(s => s.reports.sales)
    const dispatch = useAppDispatch()
    useEffect(() => { dispatch(loadSales()) }, [dispatch])

    const total = sales.reduce((s, x) => s + (x.total || 0), 0)
    const [exportType, setExportType] = React.useState<'excel' | 'pdf' | 'csv'>('excel')

    const handleExport = () => {
        if (exportType === 'excel' || exportType === 'csv') {
            const ws = XLSX.utils.json_to_sheet(
                sales.map(s => ({
                    Invoice: s.id,
                    Date: new Date(s.date).toLocaleString(),
                    Total: s.total.toFixed(2),
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
                head: [['Invoice', 'Date', 'Total']],
                body: sales.map(s => [
                    s.id,
                    new Date(s.date).toLocaleString(),
                    s.total.toFixed(2),
                ]),
                startY: 20,
            })
            doc.save('sales-report.pdf')
        }
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Reports</h3>
                <div className="d-flex align-items-center gap-2">
                    <select
                        className="form-select"
                        style={{ width: 120 }}
                        value={exportType}
                        onChange={e => setExportType(e.target.value as any)}
                    >
                        <option value="excel">Excel</option>
                        <option value="pdf">PDF</option>
                        <option value="csv">CSV</option>
                    </select>
                    <button className="btn btn-outline-primary" onClick={handleExport}>
                        Export
                    </button>
                </div>
            </div>
            <div>Total Sales: {total.toFixed(2)}</div>
            <div className="mt-3" style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Date</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(s => (
                            <tr key={s.id}>
                                <td>{s.id}</td>
                                <td>{new Date(s.date).toLocaleString()}</td>
                                <td>{s.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
export default Reports
