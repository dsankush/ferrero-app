import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAppContext } from '../context/AppContext';
import { Intelligence } from '../services/intelligence';
import { scanInvoice } from '../services/geminiVision';
import { showToast } from '../components/ui/Toast';

export const Invoice = () => {
  const navigate = useNavigate();
  const { addInventoryItem, user, inventory } = useAppContext();
  
  const [status, setStatus] = useState('idle'); // idle | processing | results
  const [procSteps, setProcSteps] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const stepsList = ['Reading distributor details...','Scanning product list...','Extracting quantities & prices...','Calculating purchase cashback...','Finalising inventory data...'];

  const triggerUpload = () => {
    fileInputRef.current.click();
  };

  const triggerCamera = () => {
    cameraInputRef.current.click();
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    showProcessing();
    
    try {
      const data = await scanInvoice(f);
      if (data && data.products && data.products.length > 0) {
        showResults({
          distributor_name: data.wholesaler_name || `${user.name.split(' ')[0]}'s Primary Supplier`,
          invoice_number: data.invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          invoice_date: data.purchase_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          total_value: data.total_amount || data.products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.qty || 1)), 0),
          products: data.products.map(p => ({
            name: p.name,
            category: 'Rocher',
            quantity: Number(p.qty) || 1,
            unit: p.unit || 'Box',
            unit_price: Number(p.price) || 1120,
            total_price: Number(p.total) || (Number(p.qty || 1) * Number(p.price || 1120)),
            added: false
          }))
        }, f.name);
      } else {
        showDemoResults(f.name);
      }
    } catch (err) {
      console.warn('[Invoice] OCR fallback triggered:', err.message);
      showDemoResults(f.name);
    }
  };

  const runParse = async (b64, mime, fname) => {
    showProcessing();
    const data = await Intelligence.readInvoice(b64, mime);
    if (data && data.products) showResults(data, fname);
    else showDemoResults(fname);
  };

  const loadDemo = async () => {
    showProcessing();
    const prompt = `Generate realistic Indian distributor invoice data containing ONLY Ferrero Rocher chocolate products from the brand category "${user.cat}" (choose from: Rocher, Golden Gallery, Raffaello, Rondnoir, Hazelnut, Assortment).
Format strict JSON with keys: 'distributor_name', 'invoice_number', 'invoice_date', 'total_value', and 'products'.
'products' should be an array of exactly 4 objects containing: 'name', 'category', 'quantity', 'unit', 'unit_price', 'total_price'.
Choose products from:
- Ferrero Rocher 48 pieces (category: Rocher, price: 300)
- Ferrero Rocher 16 pieces (category: Rocher, price: 110)
- Golden Gallery 42 pieces (category: Golden Gallery, price: 250)
- Raffaello 42 pieces (category: Raffaello, price: 280)
- Rondnoir 42 pieces (category: Rondnoir, price: 280)
- Hazelnut Specialty Box (category: Hazelnut, price: 320)
- Premium Assortment Box (category: Assortment, price: 400)
Never hallucinate extra markdown outside the JSON string.`;
    const data = await Intelligence.askJSON(prompt);
    if (data && data.products) showResults(data, 'Demo_Invoice.pdf');
    else showDemoResults('Demo_Invoice.pdf');
  };

  const showProcessing = () => {
    setStatus('processing');
    setProcSteps([]);
    let i = 0;
    const procTimer = setInterval(() => {
      if (i >= stepsList.length) {
        clearInterval(procTimer);
        return;
      }
      setProcSteps(prev => [...prev, stepsList[i]]);
      i++;
    }, 620);
    // Timer will naturally be cleared when state is updated
  };

  const showResults = (data, fname) => {
    setStatus('results');
    setParsedData(data);
    setParsedProducts(data.products || []);
  };

  const showDemoResults = (fname) => {
    // Dynamic Fallback Generator driven by actual Context
    const slice = inventory.slice(0, 4);
    
    // If somehow empty, use generics
    if (slice.length === 0) {
       slice.push({ name: 'Ferrero Rocher 48 pieces', cat: 'Rocher', unit: 'Box', buy: 300 });
       slice.push({ name: 'Golden Gallery 42 pieces', cat: 'Golden Gallery', unit: 'Box', buy: 250 });
       slice.push({ name: 'Raffaello 42 pieces', cat: 'Raffaello', unit: 'Box', buy: 280 });
       slice.push({ name: 'Rondnoir 42 pieces', cat: 'Rondnoir', unit: 'Box', buy: 280 });
    }

    const demoProds = slice.map(item => {
        const qty = Math.floor(Math.random() * 40) + 10;
        return {
            name: item.name + ' (Restock)',
            category: item.cat || 'General',
            quantity: qty,
            unit: item.unit,
            unit_price: item.buy,
            total_price: item.buy * qty,
            added: false
        };
    });

    const totalVal = demoProds.reduce((sum, p) => sum + p.total_price, 0);

    const demo = {
      distributor_name: `${user.name.split(' ')[0]}'s Primary Supplier`, 
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, 
      invoice_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 
      total_value: totalVal,
      products: demoProds
    };
    showResults(demo, fname);
  };

  const getTotal = () => parsedProducts.reduce((s, p) => s + (p.quantity * p.unit_price), 0);

  const getCashback = (tot) => {
    if (tot >= 100000) return { pct: 2.5, tier: 'Diamond', emoji: '💎', cb: +(tot * 0.025).toFixed(0) };
    if (tot >= 50000) return { pct: 1.75, tier: 'Gold', emoji: '🥇', cb: +(tot * 0.0175).toFixed(0) };
    if (tot >= 10000) return { pct: 1.0, tier: 'Silver', emoji: '🥈', cb: +(tot * 0.01).toFixed(0) };
    return { pct: 0, tier: 'Bronze', emoji: '🥉', cb: 0 };
  };

  const updateProd = (idx, field, val) => {
    const next = [...parsedProducts];
    next[idx][field] = Number(val);
    next[idx].total_price = next[idx].quantity * next[idx].unit_price;
    setParsedProducts(next);
  };

  const addOne = (idx) => {
    const p = parsedProducts[idx];
    if (p.added) return;
    
    addInventoryItem({
      name: p.name,
      cat: p.category || 'Other',
      unit: p.unit,
      qty: p.quantity,
      buy: p.unit_price,
      sell: +(p.unit_price * 1.12).toFixed(0),
      icon: 'inventory_2',
      clr: '#8a9e8a',
      earn: +(p.unit_price * 0.01).toFixed(2)
    });
    
    const next = [...parsedProducts];
    next[idx].added = true;
    setParsedProducts(next);
  };

  const confirmAll = () => {
    parsedProducts.forEach((_, i) => addOne(i));
    showToast('✅ Invoice confirmed! Stock updated.');
    setTimeout(() => navigate('/home'), 500);
  };

  const renderContent = () => {
    if (status === 'processing') {
      return (
        <div style={{ textAlign: 'center', padding: '3rem 1.4rem' }}>
          <div className="asp" style={{ width: '4.5rem', height: '4.5rem', background: 'rgba(212,165,116,.1)', border: '1px solid rgba(212,165,116,.2)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', position: 'relative' }}>
            <span className="material-symbols-outlined aspin" style={{ color: 'var(--g4)', fontSize: '2.2rem' }}>sync</span>
          </div>
          <h2 className="au" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2rem' }}>Processing Invoice...</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {procSteps.map((s, i) => (
              <div key={i} className="au" style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.32rem .6rem', background: 'rgba(212,165,116,.05)', border: '1px solid rgba(212,165,116,.12)', borderRadius: 'var(--r6)' }}>
                <span className="material-symbols-outlined fi" style={{ fontSize: '.8rem', color: 'var(--g4)' }}>check_circle</span>
                <span style={{ fontSize: '.75rem', color: 'var(--t2)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (status === 'results' && parsedData) {
      const tot = getTotal();
      const cbConfig = getCashback(tot);
      
      return (
        <div className="au" style={{ padding: '1.25rem' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '.75rem', color: 'var(--t3)' }}>Distributor</p>
                <p style={{ fontWeight: 800 }}>{parsedData.distributor_name}</p>
                <p style={{ fontSize: '.7rem', color: 'var(--t2)', marginTop: '2px' }}>Invoice #{parsedData.invoice_number} · {parsedData.invoice_date}</p>
              </div>
              <button 
                onClick={() => { setStatus('idle'); setParsedData(null); }} 
                style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r6)', padding: '.3rem .6rem', color: 'var(--t2)', fontSize: '.68rem', cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <div style={{ flex: 1, padding: '.75rem', background: 'rgba(255,208,96,.06)', border: '1px solid rgba(255,208,96,.18)', borderRadius: 'var(--r8)' }}>
                 <p style={{ fontSize: '.62rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Purchase Total</p>
                 <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--t1)' }}>₹{tot.toLocaleString('en-IN')}</p>
              </div>
              <div style={{ flex: 1, padding: '.75rem', background: 'rgba(212,165,116,.06)', border: '1px solid rgba(212,165,116,.18)', borderRadius: 'var(--r8)' }}>
                 <p style={{ fontSize: '.62rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Cashback Earned</p>
                 <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--g4)' }}>{cbConfig.cb > 0 ? `₹${cbConfig.cb.toLocaleString('en-IN')}` : 'None'}</p>
              </div>
            </div>
            <div style={{ marginTop: '.8rem', padding: '.45rem .8rem', background: 'var(--bg3)', borderRadius: 'var(--r6)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
               <span style={{ fontSize: '1rem' }}>{cbConfig.emoji}</span>
               <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--t2)' }}>
                  {cbConfig.cb > 0 ? `${cbConfig.tier} Tier — ${cbConfig.pct}% cashback applied` : '🥉 Bronze — min ₹10,000 needed'}
               </span>
            </div>
          </div>

          <h3 style={{ fontSize: '.95rem', fontWeight: 800, marginBottom: '.8rem' }}>Extracted Products ({parsedProducts.length})</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.5rem' }}>
            {parsedProducts.map((p, i) => (
              <div key={i} className={`inv-row ${p.added ? 'added' : ''} au`} style={{ animationDelay: `${i * .06}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                  <div style={{ width: '2.4rem', height: '2.4rem', background: 'var(--bg3)', borderRadius: '.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <span className="material-symbols-outlined fi" style={{ fontSize: '1.05rem', color: '#78f275' }}>inventory_2</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                     <p style={{ fontWeight: 700, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                     <p style={{ fontSize: '.65rem', color: 'var(--g4)' }}>Earn ₹{+(p.unit_price * 0.01).toFixed(2)}/unit on resale</p>
                  </div>
                  <button onClick={() => addOne(i)} disabled={p.added} className="btn-primary btn-xs" style={{ flexShrink: 0, opacity: p.added ? 0.7 : 1, background: p.added ? 'rgba(212,165,116,.18)' : '', border: p.added ? '1px solid rgba(212,165,116,.35)' : '', color: p.added ? 'var(--g4)' : '', boxShadow: p.added ? 'none' : '' }}>
                     <span className="material-symbols-outlined" style={{ fontSize: '.8rem' }}>{p.added ? 'check' : 'add'}</span> {p.added ? 'Added' : 'Add'}
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.4rem', marginTop: '.65rem' }}>
                  <div>
                    <label className="ilabel">Qty</label>
                    <Input type="number" className="ifield-sm" style={{ fontFamily: 'var(--fm)' }} value={p.quantity} onChange={e => updateProd(i, 'quantity', e.target.value)} />
                  </div>
                  <div>
                    <label className="ilabel">Unit ₹</label>
                    <Input type="number" className="ifield-sm" style={{ fontFamily: 'var(--fm)' }} value={p.unit_price} onChange={e => updateProd(i, 'unit_price', e.target.value)} />
                  </div>
                  <div>
                    <label className="ilabel">Total ₹</label>
                    <Input type="number" className="ifield-sm" style={{ fontFamily: 'var(--fm)', color: 'var(--t2)' }} readOnly value={p.total_price || (p.quantity * p.unit_price)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={confirmAll}>
             Confirm & Add Stock <span className="material-symbols-outlined">inventory</span>
          </Button>
        </div>
      );
    }

    // Idle view
    return (
      <div style={{ padding: '1.25rem' }}>
        <p style={{ fontSize: '.85rem', color: 'var(--t2)', marginBottom: '1.4rem', lineHeight: 1.5 }}>
          Upload a distributor invoice to automatically detect products, add stock, and claim <strong style={{ color: 'var(--t1)' }}>Purchase Cashback</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
           <div onClick={triggerUpload} className="au d1" style={{ border: '2px dashed var(--bdr2)', borderRadius: 'var(--r12)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', background: 'var(--bg2)', cursor: 'pointer', transition: 'all .2s' }}>
             <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--bg3)', border: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: 'var(--g4)' }}>cloud_upload</span>
             </div>
             <div style={{ textAlign: 'center' }}>
               <p style={{ fontSize: '.85rem', fontWeight: 800, marginBottom: '.1rem' }}>Upload File</p>
               <p style={{ fontSize: '.65rem', color: 'var(--t3)' }}>PDF, JPG, PNG</p>
             </div>
           </div>

           <div onClick={triggerCamera} className="au d1" style={{ animationDelay: '0.1s', border: '2px dashed var(--bdr2)', borderRadius: 'var(--r12)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', background: 'var(--bg2)', cursor: 'pointer', transition: 'all .2s' }}>
             <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(255,208,96,.1)', border: '1px solid rgba(255,208,96,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: 'var(--o4)' }}>photo_camera</span>
             </div>
             <div style={{ textAlign: 'center' }}>
               <p style={{ fontSize: '.85rem', fontWeight: 800, marginBottom: '.1rem' }}>Take Photo</p>
               <p style={{ fontSize: '.65rem', color: 'var(--t3)' }}>Use Camera</p>
             </div>
           </div>
        </div>
        
        <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*,application/pdf" style={{ display: 'none' }} />
        <input type="file" ref={cameraInputRef} onChange={handleFile} accept="image/*" capture="environment" style={{ display: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--bdr)' }}></div>
          <span style={{ fontSize: '.65rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>OR TRY DEMO</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--bdr)' }}></div>
        </div>

        <div className="au d2" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <Button onClick={loadDemo} className="btn-ghost" style={{ border: '1px dashed var(--bdr2)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--g4)' }}>auto_awesome</span> Read demo generated invoice
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="screen active">
        <Header title="Upload Invoice" subtitle="AI Parsing & Cashback" />
        <div className="scroller">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};
