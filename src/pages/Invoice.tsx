import React from 'react'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'


const Invoice: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const sales = useAppSelector(s => s.reports.sales)
    const inv = sales.find(s => s.id === id)
    if (!inv) return <div>Invoice not found</div>
    return (
        <div className="card p-3">
            <div className="d-flex justify-content-between">
                <div>
                    <h4>MyShop</h4>
                    <div>Invoice: {inv.id}</div>
                    <div>Date: {new Date(inv.date).toLocaleString()}</div>
                </div>
            </div>
            <hr />
            <table className="table">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                    {inv.items.map(i => (
                        <tr key={i.id}><td>{i.name}</td><td>{i.qty}</td><td>{i.price}</td><td>{(i.qty * i.price).toFixed(2)}</td></tr>
                    ))}
                </tbody>
            </table>
            <div className="d-flex justify-content-end">
                <div className="w-50">
                    <div className="d-flex justify-content-between"><div>Subtotal</div><div>{inv.subtotal.toFixed(2)}</div></div>
                    <div className="d-flex justify-content-between"><div>Tax</div><div>{inv.tax.toFixed(2)}</div></div>
                    <div className="d-flex justify-content-between fw-bold"><div>Total</div><div>{inv.total.toFixed(2)}</div></div>
                </div>
            </div>
        </div>
    )
}
export default Invoice