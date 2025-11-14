import React from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const invoice = useSelector((s: RootState) =>
    s.reports.sales.find((inv: any) => inv.id === id)
  );

  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div>
      <h3>Invoice #{invoice.id}</h3>
      <p>Date: {new Date(invoice.date).toLocaleString()}</p>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Tax %</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((i: any) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>{i.qty}</td>
              <td>{i.price}</td>
              <td>{i.taxPercent || 0}</td>
              <td>{(i.qty * i.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />
      <div>Subtotal: {invoice.subtotal.toFixed(2)}</div>
      <div>Discount: {invoice.discount.toFixed(2)}</div>
      <div>Tax: {invoice.tax.toFixed(2)}</div>
      <h4>Total: {invoice.total.toFixed(2)}</h4>

      <Link to="/billing" className="btn btn-primary mt-3">Back to Billing</Link>
    </div>
  );
};

export default InvoiceDetail;
