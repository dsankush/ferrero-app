import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubDB } from './SubDBContext';
import { InvoiceDetailModal } from '../../components/modals/InvoiceDetailModal';

// ─── Sub-DB Header bar ────────────────────────────────────────────────────────
export const SubDBHeader = ({ title, showBack, onBack }) => {
  const navigate = useNavigate();
  const { subUser, logout } = useSubDB();

  return (
    <div className="ghead" style={{ padding: '1rem 1.1rem', border: 'none', background: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          {showBack && (
            <button
              onClick={onBack || (() => navigate(-1))}
              style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '50%', width: '2.2rem', height: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
            </button>
          )}
          {!showBack && (
            <div style={{
              width: '2.2rem', height: '2.2rem',
              background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
              borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#fff' }}>receipt_long</span>
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{title}</h2>
            {!showBack && subUser?.emp_id && (
              <p style={{ fontSize: '.62rem', color: 'var(--g4)', fontWeight: 700 }}>
                {subUser.emp_id} · {subUser.district}, {subUser.state}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.4rem' }}>
          {!showBack && (
            <button
              onClick={() => navigate('/subdb_platform/invoice/new')}
              style={{
                padding: '.45rem .9rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
                border: 'none', borderRadius: '9999px', color: '#fff',
                fontSize: '.72rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '.25rem', cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined fi" style={{ fontSize: '.95rem' }}>add</span>
              Invoice
            </button>
          )}
          <button
            onClick={logout}
            className="btn-icon"
            style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)' }}
            title="Logout"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Toast (in-shell) ─────────────────────────────────────────────────────────
export const SubDBToast = () => {
  const { toast } = useSubDB();
  if (!toast) return null;

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#d4a574'
  };

  return (
    <div style={{
      position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999,
      background: colors[toast.type] || '#d4a574',
      color: '#fff', padding: '.55rem 1.1rem',
      borderRadius: '9999px', fontSize: '.78rem', fontWeight: 800,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      whiteSpace: 'nowrap', maxWidth: '90%',
      animation: 'slideUp 0.3s ease-out'
    }}>
      {toast.message}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = '#d4a574' }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)',
    padding: '.85rem', display: 'flex', flexDirection: 'column', gap: '.35rem'
  }}>
    <div style={{
      width: '2.2rem', height: '2.2rem', background: `${color}18`,
      borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <span className="material-symbols-outlined fi" style={{ fontSize: '1.15rem', color }}>{icon}</span>
    </div>
    <p style={{ fontSize: '.62rem', color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>{label}</p>
    <p style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>{value}</p>
  </div>
);

// ─── Invoice Row ──────────────────────────────────────────────────────────────
const InvoiceRow = ({ inv, onClick }) => {
  const products = Array.isArray(inv.products) ? inv.products : [];
  const date = inv.purchase_date || inv.created_at?.split('T')[0] || '—';

  return (
    <div 
      onClick={() => onClick?.(inv)}
      style={{
        display: 'flex', alignItems: 'center', gap: '.7rem',
        padding: '1rem', background: 'var(--bg2)',
        border: '1px solid var(--bdr)', borderRadius: 'var(--r12)',
        cursor: 'pointer', transition: 'transform 0.15s'
      }}
    >
      <div style={{
        width: '2.2rem', height: '2.2rem', background: 'rgba(212,165,116,.1)',
        borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <span className="material-symbols-outlined fi" style={{ fontSize: '1.1rem', color: '#d4a574' }}>receipt</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '.85rem', fontWeight: 800, margin: '0 0 .1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t1)' }}>
          {inv.wholesaler_name || 'Invoice'}
        </p>
        <p style={{ fontSize: '.65rem', color: 'var(--t3)', margin: 0 }}>
          {date} · {inv.retailer_name || 'No retailer'} · {products.length} item{products.length !== 1 ? 's' : ''} <span style={{ color: 'var(--g4)', fontWeight: 700 }}>· View →</span>
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '.9rem', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>
          ₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}
        </p>
        <span style={{
          fontSize: '.6rem', fontWeight: 800, padding: '.15rem .5rem',
          borderRadius: '9999px',
          background: inv.status === 'verified' ? 'rgba(16,185,129,.1)' : 'rgba(212,165,116,.1)',
          color: inv.status === 'verified' ? '#10b981' : '#d4a574',
          border: `1px solid ${inv.status === 'verified' ? 'rgba(16,185,129,.3)' : 'rgba(212,165,116,.3)'}`
        }}>
          {inv.status || 'submitted'}
        </span>
      </div>
    </div>
  );
};

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
export const SubDBDashboard = () => {
  const navigate = useNavigate();
  const { subUser, invoices, retailers = [], addRetailer } = useSubDB();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showAddRetailerModal, setShowAddRetailerModal] = useState(false);
  const [newRetailer, setNewRetailer] = useState({ shop_name: '', name: '', phone: '', location: '', zone: 'Central' });

  const invList = Array.isArray(invoices) ? invoices : [];
  const retList = Array.isArray(retailers) ? retailers : [];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthInvoices = invList.filter(i => (i.created_at || i.purchase_date || '').startsWith(thisMonth));
  const monthAmount = monthInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const totalAmount = invList.reduce((s, i) => s + Number(i.total_amount || 0), 0);

  // Monthly target metrics
  const targetMonthlyAmount = 75000;
  const monthlyProgress = Math.min(100, Math.round((monthAmount / targetMonthlyAmount) * 100));

  return (
    <div className="screen active" id="s-subdb-dashboard">
      <SubDBToast />

      <div className="scroller" style={{ paddingBottom: '2rem' }}>
        <SubDBHeader title={`Namaste, ${subUser?.name?.split(' ')[0] || 'EMP'}! 👋`} />

        <div style={{ padding: '0 1.1rem' }}>

          {/* EMP Info card */}
          <div style={{
            background: 'var(--bg2)', border: '2px solid var(--g4)', borderRadius: 'var(--r16)',
            padding: '1rem', marginBottom: '1.25rem',
            boxShadow: '0 2px 8px rgba(212,165,116,.1)',
            display: 'flex', alignItems: 'center', gap: '.75rem'
          }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '1.5rem' }}>badge</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 900, fontSize: '.95rem', color: 'var(--t1)', margin: '0 0 .1rem' }}>{subUser?.name}</p>
              <p style={{ fontSize: '.7rem', color: 'var(--g4)', fontWeight: 700, margin: '0 0 .1rem' }}>{subUser?.emp_id}</p>
              <p style={{ fontSize: '.65rem', color: 'var(--t3)', margin: 0 }}>
                📍 {subUser?.district}, {subUser?.state}
              </p>
            </div>
          </div>



          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', marginBottom: '1.25rem' }}>
            <StatCard icon="receipt" label="Total Bills" value={invList.length} color="#d4a574" />
            <StatCard icon="calendar_today" label="This Month" value={monthInvoices.length} color="#c41e3a" />
            <StatCard icon="currency_rupee" label="Total ₹" value={`₹${(totalAmount / 1000).toFixed(1)}k`} color="#10b981" />
          </div>

          {/* Connected Retailers & Add Retailer CTA */}
          <div style={{
            background: 'var(--bg2)',
            border: '1.5px solid var(--g4)',
            borderRadius: 'var(--r16)',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
              <div>
                <h4 style={{ fontSize: '.88rem', fontWeight: 900, color: 'var(--g4)', margin: 0 }}>Connected Sweet Shops & Outlets</h4>
                <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: 0 }}>{(retailers || []).length} registered outlets linked to your account</p>
              </div>
              <button
                onClick={() => setShowAddRetailerModal(true)}
                style={{
                  padding: '.4rem .8rem',
                  background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
                  border: 'none',
                  borderRadius: 'var(--r8)',
                  color: '#fff',
                  fontSize: '.72rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.3rem'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '.9rem' }}>person_add</span>
                + Add Retailer
              </button>
            </div>

            <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '.25rem' }}>
              {(retailers || []).slice(0, 5).map((r, i) => (
                <div key={r.id || i} style={{
                  padding: '.5rem .75rem',
                  background: 'var(--bg3)',
                  border: '1px solid var(--bdr)',
                  borderRadius: 'var(--r8)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  <p style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{r.shop_name || r.shop || r.name}</p>
                  <p style={{ fontSize: '.65rem', color: 'var(--t3)', margin: 0 }}>📍 {r.location || r.loc || 'Central'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Add Invoice CTA */}
          <div
            onClick={() => navigate('/subdb_platform/invoice/new')}
            style={{
              background: 'linear-gradient(135deg, rgba(212,165,116,.1), rgba(196,30,58,.05))',
              border: '2px solid #d4a574', borderRadius: 'var(--r12)',
              padding: '1rem', cursor: 'pointer', marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: '2.5rem', height: '2.5rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span className="material-symbols-outlined fi" style={{ color: '#fff', fontSize: '1.3rem' }}>add_circle</span>
            </div>
            <div>
              <p style={{ fontSize: '.95rem', fontWeight: 900, color: '#d4a574', margin: '0 0 .1rem' }}>Upload Invoice PDF</p>
              <p style={{ fontSize: '.7rem', color: 'var(--t3)', margin: 0 }}>Automated system extracts SKUs & credits retailer</p>
            </div>
            <span className="material-symbols-outlined fi" style={{ color: '#d4a574', fontSize: '1.3rem', marginLeft: 'auto' }}>chevron_right</span>
          </div>

          {/* Invoice History */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
              <p style={{ fontSize: '.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
                Invoice History
              </p>
              <span style={{ fontSize: '.72rem', color: 'var(--g4)', fontWeight: 700 }}>
                {invList.length} total
              </span>
            </div>

            {invList.length === 0 ? (
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)',
                padding: '2rem', textAlign: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--t3)', display: 'block', marginBottom: '.75rem' }}>
                  receipt_long
                </span>
                <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--t2)', margin: '0 0 .3rem' }}>No invoices yet</p>
                <p style={{ fontSize: '.75rem', color: 'var(--t3)', margin: 0 }}>Tap "Upload Invoice PDF" to credit retailer</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {invList.map(inv => (
                  <InvoiceRow 
                    key={inv.id} 
                    inv={inv} 
                    onClick={(i) => setSelectedInvoice(i)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Invoice Detail Modal for Sub-DB View */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
