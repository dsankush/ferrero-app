import React from 'react';

export const InvoiceDetailModal = ({ invoice, onClose, onRaiseIssue }) => {
  if (!invoice) return null;

  const products = Array.isArray(invoice.products) 
    ? invoice.products 
    : (Array.isArray(invoice.items_json) ? invoice.items_json : []);

  const totalQty = products.reduce((acc, p) => acc + (Number(p.qty || p.quantity) || 0), 0);
  const totalAmount = Number(invoice.total_amount || invoice.amount || 0);
  const invoiceNo = invoice.invoice_number || invoice.id || 'INV-RESTOCK';
  const date = invoice.purchase_date || invoice.invoice_date || invoice.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
  const wholesaler = invoice.wholesaler_name || 'Ferrero Authorized Sub-DB Agency';
  const retailerName = invoice.retailer_name || invoice.retailer_shop || 'Sweet Shop Partner';
  const status = invoice.status || 'verified';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg1)',
        border: '2px solid var(--g4)',
        borderRadius: 'var(--r16)',
        width: '100%',
        maxWidth: '460px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.4rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--bdr2)', paddingBottom: '.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{
              width: '2.4rem',
              height: '2.4rem',
              borderRadius: '.6rem',
              background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.3rem' }}>receipt_long</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>Invoice Details</h3>
                <span style={{
                  fontSize: '.62rem',
                  fontWeight: 800,
                  color: '#10b981',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  padding: '.15rem .45rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase'
                }}>
                  ✓ {status}
                </span>
              </div>
              <p style={{ fontSize: '.72rem', color: 'var(--g4)', margin: 0, fontWeight: 700 }}>
                #{invoiceNo} · {date}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--bdr)',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              color: 'var(--t1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
          </button>
        </div>

        {/* Distributor & Retailer Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '.6rem',
          background: 'var(--bg2)',
          border: '1px solid var(--bdr)',
          borderRadius: 'var(--r12)',
          padding: '.8rem'
        }}>
          <div>
            <p style={{ fontSize: '.62rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 .2rem 0' }}>Billed By (Sub-DB)</p>
            <p style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{wholesaler}</p>
          </div>
          <div>
            <p style={{ fontSize: '.62rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 .2rem 0' }}>Delivered To</p>
            <p style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{retailerName}</p>
          </div>
        </div>

        {/* Product Items Table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
            <p style={{ fontSize: '.68rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
              Restocked SKUs ({products.length})
            </p>
            <span style={{ fontSize: '.68rem', color: 'var(--g4)', fontWeight: 800 }}>
              {totalQty} Units Total
            </span>
          </div>

          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--bdr)',
            borderRadius: 'var(--r12)',
            overflow: 'hidden'
          }}>
            {products.map((p, idx) => {
              const qty = Number(p.qty || p.quantity || 1);
              const price = Number(p.price || p.rate || 0);
              const total = Number(p.total || (qty * price) || 0);
              const unit = p.unit || 'Box';

              return (
                <div
                  key={idx}
                  style={{
                    padding: '.7rem .85rem',
                    borderBottom: idx === products.length - 1 ? 'none' : '1px solid var(--bdr2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '.5rem' }}>
                    <p style={{ fontSize: '.8rem', fontWeight: 800, color: 'var(--t1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name || p.product_name || `Ferrero Item #${idx + 1}`}
                    </p>
                    <p style={{ fontSize: '.65rem', color: 'var(--t3)', margin: '.15rem 0 0 0' }}>
                      {qty} {unit}s × ₹{price.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '.85rem', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>
                      ₹{total.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Summary */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,165,116,0.12), rgba(196,30,58,0.06))',
          border: '1.5px solid var(--g4)',
          borderRadius: 'var(--r12)',
          padding: '.85rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '.65rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>Total Invoice Amount</p>
            <p style={{ fontSize: '.68rem', color: '#10b981', fontWeight: 700, margin: '.15rem 0 0 0' }}>✓ Auto-credited to Store Stock & Target</p>
          </div>
          <p style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '.6rem', marginTop: '.2rem' }}>
          {onRaiseIssue && (
            <button
              onClick={() => {
                onClose();
                onRaiseIssue(invoice);
              }}
              style={{
                flex: 1,
                padding: '.6rem .8rem',
                background: 'rgba(239,68,68,0.1)',
                border: '1.5px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--r8)',
                color: '#ef4444',
                fontSize: '.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '.3rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>report_problem</span>
              Report Discrepancy
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '.6rem .8rem',
              background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
              border: 'none',
              borderRadius: 'var(--r8)',
              color: '#fff',
              fontSize: '.75rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            Close Bill
          </button>
        </div>
      </div>
    </div>
  );
};
