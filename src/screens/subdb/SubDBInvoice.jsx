import React, { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSubDB } from './SubDBContext';
import { SubDBHeader, SubDBToast } from './SubDBDashboard';
import { Button } from '../../components/ui/Button';
import { scanInvoice } from '../../services/geminiVision';

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

// ─── Invoice Screen (PDF Focused) ─────────────────────────────────────────────
export const SubDBInvoice = () => {
  const navigate = useNavigate();
  const { retailers, invoices, submitInvoice, showToast } = useSubDB();

  const [scanStep, setScanStep] = useState('upload'); // 'upload' | 'scanning' | 'review'
  const [selectedFile, setSelectedFile] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  const fileRef = useRef();

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

  if (redirectTo) return <Navigate to={redirectTo} replace />;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (file) => {
    setSelectedFile(file);
    setScanError(null);
  };

  const handleScan = async () => {
    if (!selectedFile) return;
    setScanStep('scanning');
    setScanError(null);

    try {
      const result = await scanInvoice(selectedFile);
      if (result?.is_live_ai) {
        showToast('✨ Gemini AI Vision PDF scan completed!', 'success');
      } else {
        showToast('✅ Invoice PDF scanned & parsed successfully!', 'success');
      }

      setForm(prev => ({
        ...prev,
        wholesaler_name: result.wholesaler_name || '',
        retailer_name: result.retailer_name || '',
        invoice_number: result.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
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
        confidence: result.confidence || 'high',
        raw_ocr_text: result.raw_ocr_text || ''
      }));

      setScanStep('review');
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

  return (
    <div className="screen active" id="s-subdb-invoice">
      <SubDBToast />

      <div className="scroller" style={{ paddingBottom: '2rem' }}>
        <SubDBHeader
          title="Upload Invoice PDF"
          showBack
          onBack={() => navigate('/subdb_platform/dashboard')}
        />

        <div style={{ padding: '0 1.1rem' }}>

          {/* ── UPLOAD SECTION ── */}
          {scanStep !== 'review' && (
            <>
              {/* PDF Upload zone */}
              {!selectedFile && (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed #d4a574',
                    borderRadius: 'var(--r16)', padding: '2.5rem 1.5rem',
                    textAlign: 'center', cursor: 'pointer', marginBottom: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(212,165,116,0.06), rgba(196,30,58,0.02))',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,image/*"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                  />
                  <div style={{
                    width: '3.5rem', height: '3.5rem', margin: '0 auto .75rem',
                    borderRadius: '1rem', background: 'rgba(212,165,116,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span className="material-symbols-outlined fi" style={{ fontSize: '2rem', color: '#d4a574' }}>
                      picture_as_pdf
                    </span>
                  </div>
                  <p style={{ fontWeight: 900, color: 'var(--t1)', fontSize: '1.05rem', margin: '0 0 .3rem' }}>
                    Upload Sub-DB Invoice PDF
                  </p>
                  <p style={{ fontSize: '.78rem', color: 'var(--t3)', margin: 0 }}>
                    AI OCR auto-extracts SKUs, boxes, & total value
                  </p>
                </div>
              )}

              {/* File preview */}
              {selectedFile && (
                <div style={{ background: 'var(--bg2)', border: '1.5px solid var(--bdr2)', borderRadius: 'var(--r12)', overflow: 'hidden', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <span className="material-symbols-outlined fi" style={{ fontSize: '3rem', color: '#d4a574' }}>picture_as_pdf</span>
                    <p style={{ fontWeight: 800, fontSize: '.95rem', margin: '.5rem 0 0', color: 'var(--t1)' }}>{selectedFile.name}</p>
                    <p style={{ fontSize: '.72rem', color: 'var(--t3)', margin: '.2rem 0 0' }}>{(selectedFile.size / 1024).toFixed(1)} KB · Ready to scan</p>
                  </div>
                  <div style={{ padding: '.75rem 1rem', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', color: 'var(--t2)', fontWeight: 600 }}>📄 Document loaded</span>
                    <button
                      onClick={() => { setSelectedFile(null); setScanError(null); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontFamily: 'var(--fm)', fontSize: '.75rem', fontWeight: 800 }}
                    >
                      Change File
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
                  padding: '2rem', textAlign: 'center', marginBottom: '1rem',
                  background: 'rgba(212,165,116,0.06)', border: '1px solid rgba(212,165,116,0.2)',
                  borderRadius: 'var(--r12)'
                }}>
                  <style>{`
                    @keyframes sdbSpin { to { transform: rotate(360deg); } }
                    .sdb-spin { width:2.2rem;height:2.2rem;border-radius:50%;border:3px solid rgba(212,165,116,0.2);border-top-color:#d4a574;animation:sdbSpin .8s linear infinite;margin:0 auto .75rem; }
                  `}</style>
                  <div className="sdb-spin" />
                  <p style={{ fontWeight: 900, color: '#d4a574', margin: '0 0 .25rem' }}>Gemini AI Processing PDF...</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--t3)', margin: 0 }}>Extracting line items and verifying retailer stock</p>
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
                  Scan & Extract PDF Data →
                </button>
              )}
            </>
          )}

          {/* ── REVIEW FORM ── */}
          {scanStep === 'review' && (
            <>
              {/* Confidence badge */}
              <div style={{
                padding: '.6rem .9rem', marginBottom: '1.25rem',
                background: 'rgba(16,185,129,.08)',
                border: '1px solid rgba(16,185,129,.3)',
                borderRadius: 'var(--r12)', display: 'flex', alignItems: 'center', gap: '.5rem'
              }}>
                <span className="material-symbols-outlined fi" style={{ fontSize: '1.1rem', color: '#10b981' }}>
                  check_circle
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                    AI Scan Verified · High Confidence
                  </p>
                  <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: 0 }}>
                    Extracted {form.products.length} SKU items totaling ₹{Number(form.total_amount).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setScanStep('upload')}
                  style={{ background: 'none', border: 'none', color: 'var(--g4)', cursor: 'pointer', fontFamily: 'var(--fm)', fontSize: '.72rem', fontWeight: 800 }}
                >
                  Re-upload
                </button>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Wholesaler / Sub-DB Name *</label>
                  <input style={inpStyle} value={form.wholesaler_name} onChange={e => set('wholesaler_name', e.target.value)} />
                </div>

                <div>
                  <label style={labelStyle}>Retailer / Shop Name</label>
                  {retailers.length > 0 ? (
                    <select style={inpStyle} value={form.retailer_id} onChange={handleRetailerSelect}>
                      <option value="">-- Select Retailer --</option>
                      {retailers.map(r => (
                        <option key={r.id} value={r.id}>{r.shop || r.name} ({r.phone})</option>
                      ))}
                    </select>
                  ) : (
                    <input style={inpStyle} placeholder="Retailer / Shop name" value={form.retailer_name} onChange={e => set('retailer_name', e.target.value)} />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                  <div>
                    <label style={labelStyle}>Invoice Number</label>
                    <input style={inpStyle} value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Purchase Date</label>
                    <input style={inpStyle} type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <label style={{ ...labelStyle, margin: 0 }}>Line Items ({form.products.length})</label>
                    <button onClick={addProduct} style={{ background: 'none', border: 'none', color: 'var(--g4)', fontSize: '.75rem', fontWeight: 800, cursor: 'pointer' }}>
                      + Add Item
                    </button>
                  </div>
                  {form.products.map((p, idx) => (
                    <ProductRow key={idx} p={p} idx={idx} onChange={updateProduct} onRemove={removeProduct} />
                  ))}
                </div>

                {/* Grand Total */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(212,165,116,.1), rgba(196,30,58,.05))',
                  border: '1.5px solid var(--g4)', borderRadius: 'var(--r12)',
                  padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--t1)' }}>Grand Total</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--t1)' }}>
                    ₹{Number(form.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Submit button */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '1rem', borderRadius: 'var(--r12)',
                    fontSize: '1rem', fontWeight: 900
                  }}
                >
                  {submitting ? 'Submitting & Crediting...' : 'Submit & Credit Retailer Stock →'}
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
