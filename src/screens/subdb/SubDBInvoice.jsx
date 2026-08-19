import React, { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSubDB } from './SubDBContext';
import { SubDBHeader, SubDBToast } from './SubDBDashboard';
import { Button } from '../../components/ui/Button';
import { scanInvoice, mockScanInvoice } from '../../services/geminiVision';

// ─── Product row editor ───────────────────────────────────────────────────────
const ProductRow = ({ p, idx, onChange, onRemove }) => {
  const inp = {
    background: 'var(--inp)', border: '1.5px solid var(--bdr2)',
    borderRadius: 'var(--r8)', color: 'var(--t1)', fontSize: '.78rem', fontWeight: 600,
    padding: '.5rem .6rem', outline: 'none', fontFamily: 'var(--fm)', width: '100%', boxSizing: 'border-box'
  };

  const update = (field, val) => onChange(idx, { ...p, [field]: val });
  const updateNum = (field, val) => {
    const n = Number(val) || 0;
    const updated = { ...p, [field]: n };
    // auto-recalc total when price or qty changes
    if (field === 'price') updated.total = Math.round(n * p.qty * 100) / 100;
    if (field === 'qty') updated.total = Math.round(p.price * n * 100) / 100;
    onChange(idx, updated);
  };

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', padding: '.85rem', marginBottom: '.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
        <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Product {idx + 1}</span>
        <button onClick={() => onRemove(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '50%', width: '1.6rem', height: '1.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem' }}>×</button>
      </div>
      <input style={{ ...inp, marginBottom: '.5rem' }} placeholder="Product name" value={p.name} onChange={e => update('name', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
        <div>
          <p style={{ fontSize: '.65rem', color: 'var(--t3)', fontWeight: 600, margin: '0 0 .25rem' }}>Qty</p>
          <input style={inp} type="number" min="0" value={p.qty} onChange={e => updateNum('qty', e.target.value)} />
        </div>
        <div>
          <p style={{ fontSize: '.65rem', color: 'var(--t3)', fontWeight: 600, margin: '0 0 .25rem' }}>Unit</p>
          <input style={inp} placeholder="Box" value={p.unit} onChange={e => update('unit', e.target.value)} />
        </div>
        <div>
          <p style={{ fontSize: '.65rem', color: 'var(--t3)', fontWeight: 600, margin: '0 0 .25rem' }}>Price ₹</p>
          <input style={inp} type="number" min="0" value={p.price} onChange={e => updateNum('price', e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: '.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '.5rem' }}>
        <span style={{ fontSize: '.72rem', color: 'var(--t3)' }}>Total:</span>
        <input
          style={{ ...inp, width: '90px', textAlign: 'right' }}
          type="number" min="0" value={p.total}
          onChange={e => update('total', Number(e.target.value))}
        />
      </div>
    </div>
  );
};

// ─── Invoice Screen ───────────────────────────────────────────────────────────
export const SubDBInvoice = () => {
  const navigate = useNavigate();
  const { retailers, invoices, submitInvoice, showToast } = useSubDB();

  const [tab, setTab] = useState('image'); // 'image' | 'pdf' | 'manual'
  const [scanStep, setScanStep] = useState('upload'); // 'upload' | 'scanning' | 'review'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  const fileRef = useRef();

  // ALL hooks must be declared before any early return (Rules of Hooks)
  const [form, setForm] = useState({
    wholesaler_name: '',
    retailer_name: '',
    retailer_id: '',
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    products: [{ name: '', qty: 1, unit: 'Box', price: 0, total: 0 }],
    total_amount: 0,
    confidence: null,
    raw_ocr_text: ''
  });

  // State-driven redirect — fires synchronously in the React render cycle
  if (redirectTo) return <Navigate to={redirectTo} replace />;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (file) => {
    setSelectedFile(file);
    setScanError(null);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;
    setScanStep('scanning');
    setScanError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
      let result;

      if (!apiKey || apiKey.length < 20) {
        console.warn('[SubDB] No valid Gemini key — using mock scan');
        result = await mockScanInvoice();
        showToast('ℹ️ Demo scan used — add VITE_GEMINI_KEY for real AI', 'info');
      } else {
        result = await scanInvoice(selectedFile);
      }

      // Populate form
      setForm(prev => ({
        ...prev,
        wholesaler_name: result.wholesaler_name || '',
        retailer_name: result.retailer_name || '',
        invoice_number: result.invoice_number || '',
        purchase_date: result.purchase_date || new Date().toISOString().split('T')[0],
        products: Array.isArray(result.products) && result.products.length > 0
          ? result.products.map(p => ({
            name: p.name || '',
            qty: Number(p.qty) || 1,
            unit: p.unit || 'Box',
            price: Number(p.price) || 0,
            total: Number(p.total) || Number(p.price) * Number(p.qty) || 0
          }))
          : [{ name: '', qty: 1, unit: 'Box', price: 0, total: 0 }],
        total_amount: Number(result.total_amount) || 0,
        confidence: result.confidence || 'medium',
        raw_ocr_text: result.raw_ocr_text || ''
      }));

      setScanStep('review');
      showToast('✅ Invoice scanned!', 'success');
    } catch (err) {
      setScanError(err.message || 'Scan failed. Please try again.');
      setScanStep('upload');
    }
  };

  const updateProduct = (idx, updated) => {
    const prods = form.products.map((p, i) => i === idx ? updated : p);
    const total = prods.reduce((s, p) => s + (Number(p.total) || 0), 0);
    setForm(prev => ({ ...prev, products: prods, total_amount: Math.round(total * 100) / 100 }));
  };

  const removeProduct = (idx) => {
    const prods = form.products.filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, products: prods }));
  };

  const addProduct = () => {
    setForm(prev => ({
      ...prev,
      products: [...prev.products, { name: '', qty: 1, unit: 'Box', price: 0, total: 0 }]
    }));
  };

  const handleRetailerSelect = (e) => {
    const id = e.target.value;
    const r = retailers.find(r => r.id === id);
    setForm(prev => ({ ...prev, retailer_id: id, retailer_name: r ? (r.shop || r.name) : prev.retailer_name }));
  };

  const handleSubmit = async () => {
    if (!form.wholesaler_name.trim()) { showToast('Wholesaler name is required', 'error'); return; }
    if (form.products.every(p => !p.name.trim())) { showToast('Add at least one product', 'error'); return; }

    setSubmitting(true);
    try {
      await submitInvoice(form);
      setRedirectTo('/subdb_platform/dashboard');
    } catch { /* handled in context */ }
    finally { setSubmitting(false); }
  };

  const inpStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--inp)', border: '1.5px solid var(--bdr2)',
    borderRadius: 'var(--r8)', padding: '.85rem 1rem',
    fontSize: '.9rem', fontWeight: 600,
    color: 'var(--t1)', fontFamily: 'var(--fm)', outline: 'none'
  };

  const labelStyle = {
    fontSize: '.72rem', fontWeight: 700, color: 'var(--t3)',
    display: 'block', marginBottom: '.35rem',
    textTransform: 'uppercase', letterSpacing: '.04em'
  };

  const tabBtns = ['image', 'pdf', 'manual'];
  const tabIcons = { image: 'image', pdf: 'picture_as_pdf', manual: 'edit_note' };
  const tabLabels = { image: 'Image', pdf: 'PDF', manual: 'Manual' };

  return (
    <div className="screen active" id="s-subdb-invoice">
      <SubDBToast />

      <div className="scroller" style={{ paddingBottom: '2rem' }}>
        <SubDBHeader
          title="Add Invoice"
          showBack
          onBack={() => navigate('/subdb_platform/dashboard')}
        />

        <div style={{ padding: '0 1.1rem' }}>

          {/* ── UPLOAD SECTION ── */}
          {scanStep !== 'review' && (
            <>
              {/* Tab Switcher */}
              <div style={{
                display: 'flex', gap: '.4rem', marginBottom: '1.25rem',
                background: 'var(--bg2)', padding: '.3rem', borderRadius: 'var(--r12)'
              }}>
                {tabBtns.map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setSelectedFile(null); setPreviewUrl(null); setScanStep('upload'); setScanError(null); }}
                    style={{
                      flex: 1, padding: '.55rem', borderRadius: 'var(--r8)',
                      background: tab === t ? 'linear-gradient(135deg, #d4a574, #c41e3a)' : 'transparent',
                      border: 'none', color: tab === t ? '#fff' : 'var(--t3)',
                      cursor: 'pointer', fontFamily: 'var(--fm)', fontWeight: 800, fontSize: '.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.3rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-symbols-outlined fi" style={{ fontSize: '.9rem' }}>{tabIcons[t]}</span>
                    {tabLabels[t]}
                  </button>
                ))}
              </div>

              {/* Upload zone */}
              {(tab === 'image' || tab === 'pdf') && !selectedFile && (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(212,165,116,0.4)',
                    borderRadius: 'var(--r16)', padding: '2rem',
                    textAlign: 'center', cursor: 'pointer', marginBottom: '1rem',
                    background: 'rgba(212,165,116,0.03)',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept={tab === 'pdf' ? 'application/pdf' : 'image/*'}
                    style={{ display: 'none' }}
                    onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                  />
                  <span className="material-symbols-outlined fi" style={{ fontSize: '2.5rem', color: '#d4a574', marginBottom: '.75rem', display: 'block' }}>
                    {tab === 'pdf' ? 'picture_as_pdf' : 'add_photo_alternate'}
                  </span>
                  <p style={{ fontWeight: 800, color: 'var(--t1)', margin: '0 0 .3rem' }}>
                    {tab === 'image' ? 'Upload Invoice Photo' : 'Upload Invoice PDF'}
                  </p>
                  <p style={{ fontSize: '.75rem', color: 'var(--t3)', margin: 0 }}>Tap to browse files</p>
                </div>
              )}

              {/* File preview */}
              {(tab === 'image' || tab === 'pdf') && selectedFile && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', overflow: 'hidden', marginBottom: '1rem' }}>
                  {previewUrl && (
                    <img src={previewUrl} alt="Invoice" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: 'var(--bg3)', display: 'block' }} />
                  )}
                  {!previewUrl && (
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                      <span className="material-symbols-outlined fi" style={{ fontSize: '2.5rem', color: '#d4a574' }}>picture_as_pdf</span>
                      <p style={{ fontWeight: 700, margin: '.5rem 0 0' }}>{selectedFile.name}</p>
                    </div>
                  )}
                  <div style={{ padding: '.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '.75rem', color: 'var(--t3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      📎 {selectedFile.name}
                    </p>
                    <button
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontFamily: 'var(--fm)', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Scan error */}
              {scanError && (
                <div style={{
                  marginBottom: '1rem', padding: '.75rem 1rem',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--r12)', color: '#ef4444', fontSize: '.78rem', fontWeight: 600
                }}>
                  ⚠️ {scanError}
                </div>
              )}

              {/* Scanning state */}
              {scanStep === 'scanning' && (
                <div style={{
                  padding: '1.5rem', textAlign: 'center', marginBottom: '1rem',
                  background: 'rgba(212,165,116,0.06)', border: '1px solid rgba(212,165,116,0.2)',
                  borderRadius: 'var(--r12)'
                }}>
                  <style>{`
                    @keyframes sdbSpin { to { transform: rotate(360deg); } }
                    .sdb-spin { width:2rem;height:2rem;border-radius:50%;border:3px solid rgba(212,165,116,0.2);border-top-color:#d4a574;animation:sdbSpin .8s linear infinite;margin:0 auto .75rem; }
                  `}</style>
                  <div className="sdb-spin" />
                  <p style={{ fontWeight: 800, color: '#d4a574', margin: '0 0 .25rem' }}>AI Scanning...</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--t3)', margin: 0 }}>Gemini is reading your invoice</p>
                </div>
              )}

              {/* Manual mode jump */}
              {tab === 'manual' && (
                <div style={{
                  border: '2px dashed rgba(212,165,116,0.3)', borderRadius: 'var(--r16)',
                  padding: '2rem', textAlign: 'center', marginBottom: '1rem'
                }}>
                  <span className="material-symbols-outlined fi" style={{ fontSize: '2.5rem', color: '#d4a574', display: 'block', marginBottom: '.75rem' }}>edit_note</span>
                  <p style={{ fontWeight: 800, color: 'var(--t1)', margin: '0 0 .3rem' }}>Manual Entry</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--t3)', margin: '0 0 1rem' }}>Fill in the invoice details yourself</p>
                  <Button onClick={() => setScanStep('review')} style={{ padding: '.75rem 1.5rem', borderRadius: 'var(--r12)' }}>
                    Open Form →
                  </Button>
                </div>
              )}

              {/* Scan CTA */}
              {selectedFile && scanStep === 'upload' && (
                <button
                  onClick={handleScan}
                  style={{
                    width: '100%', padding: '1rem',
                    background: 'linear-gradient(135deg, #d4a574, #c41e3a)', border: 'none',
                    borderRadius: 'var(--r12)', color: '#fff',
                    fontFamily: 'var(--fm)', fontWeight: 900, fontSize: '1rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                    boxShadow: '0 4px 16px rgba(212,165,116,0.3)'
                  }}
                >
                  <span className="material-symbols-outlined fi">auto_awesome</span>
                  Start Scan
                </button>
              )}

              {/* ── INVOICE HISTORY ── */}
              <div style={{ marginTop: '1.75rem' }}>
                <p style={{ fontSize: '.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: '.75rem' }}>
                  Recent Invoices
                </p>

                {invoices.length === 0 ? (
                  <div style={{
                    background: 'var(--bg2)', border: '1px solid var(--bdr)',
                    borderRadius: 'var(--r12)', padding: '1.5rem', textAlign: 'center'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--t3)', display: 'block', marginBottom: '.5rem' }}>receipt_long</span>
                    <p style={{ fontSize: '.8rem', color: 'var(--t3)', margin: 0 }}>No invoices submitted yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {invoices.map(inv => {
                      const products = Array.isArray(inv.products) ? inv.products : [];
                      const date = inv.purchase_date || inv.created_at?.split('T')[0] || '—';
                      return (
                        <div key={inv.id} style={{
                          display: 'flex', alignItems: 'center', gap: '.7rem',
                          padding: '1rem', background: 'var(--bg2)',
                          border: '1px solid var(--bdr)', borderRadius: 'var(--r12)'
                        }}>
                          <div style={{
                            width: '2.2rem', height: '2.2rem', background: 'rgba(212,165,116,.1)',
                            borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <span className="material-symbols-outlined fi" style={{ fontSize: '1.1rem', color: '#d4a574' }}>receipt</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '.85rem', fontWeight: 800, margin: '0 0 .1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {inv.wholesaler_name || 'Invoice'}
                            </p>
                            <p style={{ fontSize: '.65rem', color: 'var(--t3)', margin: 0 }}>
                              {date} · {inv.retailer_name || 'No retailer'} · {products.length} item{products.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '.9rem', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>
                              ₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}
                            </p>
                            <span style={{
                              fontSize: '.6rem', fontWeight: 800, padding: '.15rem .5rem', borderRadius: '9999px',
                              background: inv.status === 'verified' ? 'rgba(16,185,129,.1)' : 'rgba(212,165,116,.1)',
                              color: inv.status === 'verified' ? '#10b981' : '#d4a574',
                              border: `1px solid ${inv.status === 'verified' ? 'rgba(16,185,129,.3)' : 'rgba(212,165,116,.3)'}`
                            }}>
                              {inv.status || 'submitted'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── REVIEW FORM ── */}
          {scanStep === 'review' && (
            <>
              {/* Confidence badge */}
              {form.confidence && (
                <div style={{
                  padding: '.5rem .85rem', marginBottom: '1rem',
                  background: form.confidence === 'high' ? 'rgba(16,185,129,.08)' : 'rgba(212,165,116,.08)',
                  border: `1px solid ${form.confidence === 'high' ? 'rgba(16,185,129,.3)' : 'rgba(212,165,116,.3)'}`,
                  borderRadius: 'var(--r12)', display: 'flex', alignItems: 'center', gap: '.5rem'
                }}>
                  <span className="material-symbols-outlined fi" style={{ fontSize: '1rem', color: form.confidence === 'high' ? '#10b981' : '#d4a574' }}>
                    {form.confidence === 'high' ? 'check_circle' : 'info'}
                  </span>
                  <div>
                    <p style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                      AI scan confidence: <strong style={{ color: form.confidence === 'high' ? '#10b981' : '#d4a574' }}>
                        {form.confidence}
                      </strong>
                    </p>
                    <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: 0 }}>
                      {form.confidence !== 'high' ? 'Please verify all fields carefully' : 'Details look good — review and submit'}
                    </p>
                  </div>
                  {tab !== 'manual' && (
                    <button
                      onClick={() => setScanStep('upload')}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fm)', fontSize: '.72rem' }}
                    >
                      Re-scan
                    </button>
                  )}
                </div>
              )}

              {/* Form section header */}
              <p style={{ fontSize: '.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: '.75rem' }}>
                Invoice Details
              </p>

              {/* Wholesaler */}
              <div style={{ marginBottom: '.85rem' }}>
                <label style={labelStyle}>Wholesaler / Supplier <span style={{ color: '#c41e3a' }}>*</span></label>
                <input style={inpStyle} placeholder="Wholesaler name" value={form.wholesaler_name} onChange={e => set('wholesaler_name', e.target.value)} />
              </div>

              {/* Invoice No & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '.85rem' }}>
                <div>
                  <label style={labelStyle}>Invoice No.</label>
                  <input style={inpStyle} placeholder="INV-001" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" style={{ ...inpStyle, colorScheme: 'dark' }} value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
                </div>
              </div>

              {/* Retailer */}
              <div style={{ marginBottom: '.85rem' }}>
                <label style={labelStyle}>Retailer</label>
                <select
                  value={form.retailer_id}
                  onChange={handleRetailerSelect}
                  style={{ ...inpStyle, marginBottom: '.5rem', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="">— Select from list (updates targets) —</option>
                  {retailers.map(r => (
                    <option key={r.id} value={r.id}>{r.shop || r.name} · {r.loc}</option>
                  ))}
                </select>
                <input
                  style={inpStyle}
                  placeholder="Or type retailer name from invoice"
                  value={form.retailer_name}
                  onChange={e => set('retailer_name', e.target.value)}
                />
              </div>

              {/* Products */}
              <p style={{ fontSize: '.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: '.75rem', marginTop: '1.25rem' }}>
                Products
              </p>

              {form.products.map((p, i) => (
                <ProductRow key={i} p={p} idx={i} onChange={updateProduct} onRemove={removeProduct} />
              ))}

              <button
                onClick={addProduct}
                style={{
                  width: '100%', padding: '.7rem',
                  background: 'transparent', border: '2px dashed rgba(212,165,116,0.3)',
                  borderRadius: 'var(--r12)', color: '#d4a574',
                  fontFamily: 'var(--fm)', fontWeight: 800, fontSize: '.82rem',
                  cursor: 'pointer', marginBottom: '1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem'
                }}
              >
                <span className="material-symbols-outlined fi" style={{ fontSize: '1rem' }}>add_circle</span>
                Add Product
              </button>

              {/* Total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '.85rem 1rem',
                background: 'rgba(212,165,116,0.08)', border: '1px solid rgba(212,165,116,0.25)',
                borderRadius: 'var(--r12)', marginBottom: '1.5rem'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--t2)', fontSize: '.85rem' }}>Invoice Total</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#d4a574' }}>
                    ₹{Number(form.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <input
                    type="number"
                    value={form.total_amount}
                    onChange={e => set('total_amount', Number(e.target.value))}
                    style={{ width: '80px', ...inpStyle, padding: '.35rem .5rem', fontSize: '.78rem', textAlign: 'right' }}
                  />
                </div>
              </div>

              {/* Target update hint */}
              {form.retailer_id && (
                <div style={{
                  padding: '.65rem .85rem', marginBottom: '1rem',
                  background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)',
                  borderRadius: 'var(--r12)', display: 'flex', alignItems: 'center', gap: '.5rem'
                }}>
                  <span className="material-symbols-outlined fi" style={{ fontSize: '1rem', color: '#10b981' }}>trending_up</span>
                  <p style={{ fontSize: '.72rem', color: '#10b981', fontWeight: 700, margin: 0 }}>
                    Monthly targets for this retailer will auto-update on submit
                  </p>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: '1rem', fontSize: '1rem', borderRadius: 'var(--r12)', width: '100%' }}
              >
                {submitting
                  ? 'Submitting...'
                  : <><span className="material-symbols-outlined fi">check_circle</span> Submit Invoice</>}
              </Button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
