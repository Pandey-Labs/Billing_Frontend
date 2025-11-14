import React from 'react';
import './ReceiptCommon.css';

type Item = { name: string; qty: number; price: number; taxPercent?: number };
type Props = {
  shopName?: string;
  shopAddress?: string;
  phone?: string;
  invoiceId?: string;
  date?: string;
  items: Item[];
  paymentMethod?: string;
  footerNote?: string;
};

/**
 * 80mm thermal paper width ≈ 80mm. We request print size using @media print rules inline below.
 */
const Receipt80: React.FC<Props> = ({
  shopName = 'MyShop',
  shopAddress = '123 Market St, City',
  phone = '+91 99999 99999',
  invoiceId = 'INV-1001',
  date = new Date().toLocaleString(),
  items = [],
  paymentMethod = 'CASH',
  footerNote = 'Thank you. Visit again!'
}) => {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = items.reduce((s, it) => s + ((it.taxPercent || 0) / 100) * it.price * it.qty, 0);
  const total = subtotal + tax;

  return (
    <div>
      <div className="print-controls">
        <button className="btn btn-sm btn-primary" onClick={() => window.print()}>Print (80mm)</button>
      </div>

      {/* wrapper requests print page size 80mm */}
      <div className="print-wrapper">
        <style>{`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body * { visibility: hidden; }
            .receipt-80, .receipt-80 * { visibility: visible; }
            .receipt-80 { position: absolute; left: 0; top: 0; }
          }
        `}</style>

        <div className="receipt receipt-80" style={{ width: '80mm' }}>
          {/* header */}
          <div style={{ textAlign: 'center' }}>
            <div className="shop-name">{shopName}</div>
            <div className="shop-meta small">{shopAddress}</div>
            <div className="shop-meta small">Phone: {phone}</div>
            <div style={{ marginTop: 6 }} className="small">Invoice: {invoiceId}</div>
            <div className="small">Date: {date}</div>
          </div>

          <div className="sep" />

          {/* items */}
          <table className="items">
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ width: '58%' }}>
                    <div className="item-name">{it.name}</div>
                    <div className="small">{it.taxPercent ? `GST ${it.taxPercent}%` : ''}</div>
                  </td>
                  <td style={{ width: '12%' }} className="small text-right">{it.qty}</td>
                  <td style={{ width: '30%' }} className="small text-right">₹{(it.price * it.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="sep" />

          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td className="small">Subtotal</td>
                <td className="small text-right">₹{subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="small">Tax</td>
                <td className="small text-right">₹{tax.toFixed(2)}</td>
              </tr>
              <tr style={{ fontWeight: 700, fontSize: '3.6mm' }}>
                <td>Total</td>
                <td className="text-right">₹{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="sep" />

          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="small">
            <div>Payment</div>
            <div>{paymentMethod}</div>
          </div>

          <div className="sep" />

          {/* footer */}
          <div style={{ textAlign: 'center' }} className="footer small">
            <div>{footerNote}</div>
            <div style={{ marginTop: 6 }}>Powered by MyShop</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt80;
