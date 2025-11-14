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
 * 58mm thermal paper width ≈ 58mm. Page size set in @media print.
 */
const Receipt58: React.FC<Props> = ({
  shopName = 'MyShop',
  shopAddress = '123 Market St',
  phone = '+91 99999 99999',
  invoiceId = 'INV-1001',
  date = new Date().toLocaleString(),
  items = [],
  paymentMethod = 'CASH',
  footerNote = 'Thank you!'
}) => {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = items.reduce((s, it) => s + ((it.taxPercent || 0) / 100) * it.price * it.qty, 0);
  const total = subtotal + tax;

  return (
    <div>
      <div className="print-controls">
        <button className="btn btn-sm btn-primary" onClick={() => window.print()}>Print (58mm)</button>
      </div>

      <div className="print-wrapper">
        <style>{`
          @media print {
            @page { size: 58mm auto; margin: 0; }
            body * { visibility: hidden; }
            .receipt-58, .receipt-58 * { visibility: visible; }
            .receipt-58 { position: absolute; left: 0; top: 0; }
          }
        `}</style>

        <div className="receipt receipt-58" style={{ width: '58mm' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="shop-name" style={{ fontSize: '4.6mm' }}>{shopName}</div>
            <div className="shop-meta small">{shopAddress}</div>
            <div className="shop-meta small">Ph: {phone}</div>
            <div style={{ marginTop: 6 }} className="small">Inv: {invoiceId}</div>
            <div className="small">Date: {date}</div>
          </div>

          <div className="sep" />

          <table className="items">
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ width: '58%' }}>
                    <div className="item-name" style={{ fontSize: '3mm' }}>{it.name}</div>
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

          <div className="small" style={{ textAlign: 'center' }}>
            Payment: {paymentMethod}
          </div>

          <div className="sep" />

          <div className="footer small" style={{ textAlign: 'center' }}>
            <div>{footerNote}</div>
            <div>Visit Again!</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt58;
