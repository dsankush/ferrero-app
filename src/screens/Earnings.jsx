import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { useAppContext } from '../context/AppContext';
import { ProductIcon } from '../components/ui/ProductIcon';

export const Earnings = () => {
  const navigate = useNavigate();
  const { user, inventory, transactions, monthlyTargets, pointCredits, walletBalance } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'targets' | 'restock' | 'invoices'

  // ─── 1. RESTOCKING VELOCITY & INVENTORY FOUNDATION ─────────────────────────
  // Total units across current stock
  const totalStockUnits = inventory.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  
  // Restock purchase transactions from Sub-DB
  const restockTxns = transactions.filter(t => t.type === 'purchase' || t.label?.toLowerCase().includes('sub-db') || t.label?.toLowerCase().includes('wholesaler') || t.label?.toLowerCase().includes('restock'));
  const totalRestockSpend = restockTxns.reduce((sum, t) => {
    const num = Number(String(t.amt).replace(/[^0-9.-]+/g, '')) || 0;
    return sum + num;
  }, 0) || 73450;

  // Load Sub-DB Invoices from LocalStorage or Fallback
  let subdbInvoices = [];
  try {
    const raw = localStorage.getItem('subdb_invoices');
    if (raw) subdbInvoices = JSON.parse(raw);
  } catch(e) {}
  if (!subdbInvoices || subdbInvoices.length === 0) {
    subdbInvoices = [
      { id: 'inv-1', wholesaler_name: 'Gupta Ferrero Rocher Wholesaler', invoice_number: 'INV-4891', purchase_date: '2026-08-16', total_amount: 18450, products: [{ name: 'Ferrero Rocher 16pc', qty: 20 }, { name: 'Raffaello 20pc', qty: 10 }], status: 'verified' },
      { id: 'inv-2', wholesaler_name: 'MP Premium Confectioners', invoice_number: 'INV-4620', purchase_date: '2026-08-09', total_amount: 14100, products: [{ name: 'Ferrero Rocher 48pc', qty: 10 }, { name: 'Golden Gallery 18pc', qty: 8 }], status: 'verified' },
      { id: 'inv-3', wholesaler_name: 'Gupta Ferrero Rocher Wholesaler', invoice_number: 'INV-4211', purchase_date: '2026-08-02', total_amount: 22800, products: [{ name: 'Ferrero Rocher 16pc', qty: 25 }, { name: 'Holiday Gift Set', qty: 6 }], status: 'verified' }
    ];
  }

  // ─── 2. TARGET ANALYTICS CALCULATIONS ──────────────────────────────────────
  const targets = monthlyTargets && monthlyTargets.length > 0 ? monthlyTargets : [
    { id: 't1', title: 'Ferrero Rocher 16pc Restock Quota', current_value: 35, target_value: 50, unit: 'Boxes', points_reward: 500, status: 'in_progress' },
    { id: 't2', title: 'Raffaello Coconut Confectionery Goal', current_value: 16, target_value: 20, unit: 'Boxes', points_reward: 400, status: 'in_progress' },
    { id: 't3', title: 'Monthly Sub-DB Restock Spend ₹40k', current_value: 32500, target_value: 40000, unit: '₹', points_reward: 600, status: 'in_progress' }
  ];

  const totalTargetPoints = targets.reduce((sum, t) => sum + (Number(t.points_reward) || 0), 0);
  const completedTargets = targets.filter(t => t.status === 'completed' || Number(t.current_value) >= Number(t.target_value));
  const earnedTargetPoints = completedTargets.reduce((sum, t) => sum + (Number(t.points_reward) || 0), 0);

  const avgProgress = Math.round(
    targets.reduce((acc, t) => {
      const val = Number(t.target_value) > 0 ? (Number(t.current_value) / Number(t.target_value)) * 100 : 0;
      return acc + Math.min(100, val);
    }, 0) / (targets.length || 1)
  );

  // Selected month for bifurcation drill-down
  const [selectedMonthKey, setSelectedMonthKey] = useState('aug');

  const monthBifurcationData = {
    jun: {
      monthName: 'June 2026',
      completionPct: 85,
      status: 'Completed & Disbursed',
      totalBoxes: 142,
      totalSpend: '₹52,400',
      visitsCount: 4,
      bonusPointsClaimed: 1200,
      repName: 'Rajesh Sharma (EMP-4821)',
      targetItems: [
        { name: 'Ferrero Rocher 16pc Restock', achieved: 45, target: 50, unit: 'Boxes', pct: 90, pts: 500, done: false },
        { name: 'Raffaello 20pc Festive Goal', achieved: 20, target: 20, unit: 'Boxes', pct: 100, pts: 400, done: true },
        { name: 'Monthly Purchase Spend ₹40k', achieved: 36500, target: 40000, unit: '₹', pct: 91, pts: 300, done: false }
      ]
    },
    jul: {
      monthName: 'July 2026',
      completionPct: 92,
      status: 'Completed & Disbursed',
      totalBoxes: 158,
      totalSpend: '₹59,200',
      visitsCount: 5,
      bonusPointsClaimed: 1500,
      repName: 'Rajesh Sharma (EMP-4821)',
      targetItems: [
        { name: 'Ferrero Rocher 16pc Restock', achieved: 50, target: 50, unit: 'Boxes', pct: 100, pts: 500, done: true },
        { name: 'Raffaello 20pc Festive Goal', achieved: 20, target: 20, unit: 'Boxes', pct: 100, pts: 400, done: true },
        { name: 'Monthly Purchase Spend ₹40k', achieved: 42800, target: 40000, unit: '₹', pct: 100, pts: 600, done: true }
      ]
    },
    aug: {
      monthName: 'August 2026 (Live)',
      completionPct: avgProgress,
      status: avgProgress >= 100 ? 'Completed' : 'In Progress',
      totalBoxes: totalStockUnits || 163,
      totalSpend: '₹' + totalRestockSpend.toLocaleString('en-IN'),
      visitsCount: subdbInvoices.length || 3,
      bonusPointsClaimed: earnedTargetPoints,
      repName: 'Sub-DB Field Rep (EMP-9204)',
      targetItems: targets.map(t => {
        const pct = Math.min(100, Math.round((Number(t.current_value) / Number(t.target_value)) * 100));
        return {
          name: t.title,
          achieved: t.current_value,
          target: t.target_value,
          unit: t.unit,
          pct: pct,
          pts: t.points_reward,
          done: pct >= 100
        };
      })
    }
  };

  const selectedBifurcation = monthBifurcationData[selectedMonthKey] || monthBifurcationData.aug;

  // SKU Restock Category Distribution
  const catDistribution = [
    { label: 'Ferrero Rocher', pct: 52, units: Math.round(totalStockUnits * 0.52) || 48, color: '#d4a574', emoji: '🌰' },
    { label: 'Raffaello', pct: 24, units: Math.round(totalStockUnits * 0.24) || 22, color: '#f7f2ea', textClr: '#2d2d2d', emoji: '🥥' },
    { label: 'Golden Gallery', pct: 14, units: Math.round(totalStockUnits * 0.14) || 12, color: '#ffd700', textClr: '#2d2d2d', emoji: '✨' },
    { label: 'Rondnoir & Hazelnut', pct: 10, units: Math.round(totalStockUnits * 0.10) || 9, color: '#4a154b', emoji: '🍫' }
  ];

  // Weekly restock trend
  const weeklyRestock = [
    { week: 'W1 (1-7)', boxes: 38, amt: '₹14,200', height: '65%' },
    { week: 'W2 (8-14)', boxes: 45, amt: '₹18,500', height: '80%' },
    { week: 'W3 (15-21)', boxes: 52, amt: '₹22,100', height: '95%' },
    { week: 'W4 (22-28)', boxes: 28, amt: '₹11,400', height: '50%' }
  ];

  // Low stock items requiring restock
  const lowStockItems = inventory.filter(p => Number(p.qty) < 8);

  // Current tier calculation
  let currentTier = 'Bronze';
  let tierCashback = '1.0%';
  if (totalRestockSpend >= 100000) { currentTier = 'Diamond'; tierCashback = '2.5%'; }
  else if (totalRestockSpend >= 50000) { currentTier = 'Gold'; tierCashback = '1.75%'; }
  else if (totalRestockSpend >= 20000) { currentTier = 'Silver'; tierCashback = '1.25%'; }

  return (
    <AppLayout>
      <div className="screen active" style={{ background: 'var(--bg0)' }}>
        <Header 
          title="Performance Analytics" 
          subtitle="Target milestones & restock intelligence"
        />

        {/* ── SUB-NAV TAB SWITCHER ── */}
        <div style={{
          display: 'flex', gap: '.35rem', padding: '.65rem 1rem',
          background: 'var(--bg1)', borderBottom: '1px solid var(--bdr)',
          overflowX: 'auto', scrollbarWidth: 'none'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'targets', label: 'Target Completion', icon: 'target' },
            { id: 'restock', label: 'Restock Velocity', icon: 'trending_up' },
            { id: 'invoices', label: 'Sub-DB Bills', icon: 'receipt_long' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '.45rem .85rem', borderRadius: '9999px',
                background: activeTab === t.id ? 'linear-gradient(135deg, #d4a574, #c41e3a)' : 'transparent',
                border: activeTab === t.id ? 'none' : '1px solid var(--bdr)',
                color: activeTab === t.id ? '#fff' : 'var(--t2)',
                fontSize: '.74rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '.3rem', whiteSpace: 'nowrap',
                transition: 'all .2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '.9rem' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="scroller" style={{ padding: '1.1rem', paddingBottom: '3rem' }}>
          
          {/* ══════════════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* HIGH LEVEL KPI SUMMARY CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#fff', border: '2px solid #d4a574', borderRadius: 'var(--r16)', padding: '1rem', boxShadow: '0 2px 8px rgba(212,165,116,.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.4rem' }}>
                    <span className="material-symbols-outlined fi" style={{ fontSize: '1.1rem', color: '#d4a574' }}>target</span>
                    <p style={{ fontSize: '.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', margin: 0 }}>Target Progress</p>
                  </div>
                  <h3 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#c41e3a', margin: 0 }}>{avgProgress}%</h3>
                  <p style={{ fontSize: '.68rem', color: '#666', marginTop: '.2rem' }}>{completedTargets.length}/{targets.length} targets complete</p>
                </div>

                <div style={{ background: '#fff', border: '2px solid #d4a574', borderRadius: 'var(--r16)', padding: '1rem', boxShadow: '0 2px 8px rgba(212,165,116,.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.4rem' }}>
                    <span className="material-symbols-outlined fi" style={{ fontSize: '1.1rem', color: '#d4a574' }}>local_shipping</span>
                    <p style={{ fontSize: '.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', margin: 0 }}>Restock Volume</p>
                  </div>
                  <h3 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#d4a574', margin: 0 }}>{totalStockUnits} <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#666' }}>boxes</span></h3>
                  <p style={{ fontSize: '.68rem', color: '#666', marginTop: '.2rem' }}>Across {inventory.length} Ferrero SKUs</p>
                </div>
              </div>

              {/* MONTHLY TARGET PACE BANNER */}
              <div style={{
                background: 'linear-gradient(135deg, #1d120d 0%, #0b0604 100%)',
                border: '2px solid #d4a574', borderRadius: 'var(--r16)', padding: '1.25rem',
                marginBottom: '1.25rem', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at top right, rgba(212,165,116,.15), transparent 70%)' }}></div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                    <span style={{ fontSize: '.72rem', fontWeight: 900, color: 'var(--g4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      🎯 Monthly Run-Rate Pace
                    </span>
                    <span style={{ fontSize: '.68rem', background: 'rgba(16,185,129,.15)', border: '1px solid #10b981', color: '#10b981', padding: '.2rem .6rem', borderRadius: '9999px', fontWeight: 800 }}>
                      ✓ ON TRACK
                    </span>
                  </div>

                  <p style={{ fontSize: '.88rem', fontWeight: 700, color: '#fff', lineHeight: 1.4, margin: '0 0 .75rem 0' }}>
                    You are on pace to complete <strong style={{ color: 'var(--g4)' }}>100% of your targets</strong> by the 25th of this month!
                  </p>

                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '.5rem' }}>
                    <div style={{ height: '100%', width: `${avgProgress}%`, background: 'linear-gradient(90deg, #d4a574, #c41e3a)', borderRadius: '9999px' }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--t3)' }}>
                    <span>Current Month: {avgProgress}% Done</span>
                    <span style={{ color: 'var(--g4)', fontWeight: 700 }}>+{totalTargetPoints} Bonus Pts at 100%</span>
                  </div>
                </div>
              </div>

              {/* QUICK RESTOCK HEALTH ALERT */}
              {lowStockItems.length > 0 && (
                <div style={{
                  background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--r12)', padding: '1rem', marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '1.2rem' }}>warning</span>
                    <h4 style={{ fontSize: '.88rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>Restock Alert ({lowStockItems.length} SKUs Low)</h4>
                  </div>
                  <p style={{ fontSize: '.75rem', color: 'var(--t2)', margin: '0 0 .6rem 0' }}>
                    {lowStockItems.map(p => `${p.name} (${p.qty} left)`).join(', ')}.
                  </p>
                  <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: 0 }}>
                    💡 Have your Sub-DB representative scan new wholesale bills on their next store visit.
                  </p>
                </div>
              )}

              {/* SUB-DB RECENT RESTOCKS LIST */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                  <h3 style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Recent Verified Restocks</h3>
                  <button onClick={() => setActiveTab('invoices')} style={{ background: 'none', border: 'none', color: 'var(--g4)', fontSize: '.75rem', fontWeight: 800, cursor: 'pointer' }}>
                    View All →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {subdbInvoices.slice(0, 3).map((inv, idx) => (
                    <div key={idx} style={{
                      background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)',
                      padding: '.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                        <div style={{ width: '2.4rem', height: '2.4rem', background: 'rgba(212,165,116,.12)', borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined fi" style={{ color: 'var(--g4)', fontSize: '1.2rem' }}>receipt</span>
                        </div>
                        <div>
                          <p style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--t1)', margin: '0 0 .1rem 0' }}>{inv.wholesaler_name}</p>
                          <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: 0 }}>{inv.invoice_number} · {inv.purchase_date} · {inv.products?.length || 2} items</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '.9rem', fontWeight: 900, color: 'var(--t1)', margin: '0 0 .1rem 0' }}>₹{Number(inv.total_amount).toLocaleString('en-IN')}</p>
                        <span style={{ fontSize: '.6rem', fontWeight: 800, background: 'rgba(16,185,129,.1)', border: '1px solid #10b981', color: '#10b981', padding: '.15rem .45rem', borderRadius: '9999px' }}>
                          ✓ Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 2: MONTHLY TARGET COMPLETION ANALYTICS
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'targets' && (
            <>
              {/* TARGET PROGRESS MAIN CARD */}
              <div style={{ background: '#fff', border: '2px solid #d4a574', borderRadius: 'var(--r16)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(212,165,116,.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Target Completion Rate</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#c41e3a', margin: '.2rem 0 0 0' }}>{avgProgress}%</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Bonus Points Value</span>
                    <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#d4a574', margin: '.2rem 0 0 0' }}>+{earnedTargetPoints} <span style={{ fontSize: '.75rem', color: '#666' }}>/ {totalTargetPoints} pts</span></p>
                  </div>
                </div>

                <div style={{ height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '.8rem' }}>
                  <div style={{ height: '100%', width: `${avgProgress}%`, background: 'linear-gradient(90deg, #d4a574, #c41e3a)', borderRadius: '9999px' }}></div>
                </div>

                <p style={{ fontSize: '.75rem', color: '#666', margin: 0, lineHeight: 1.4 }}>
                  ℹ️ Restocking Ferrero products through Sub-DB bill uploads automatically moves each target progress bar towards completion.
                </p>
              </div>

              {/* MONTH OVER MONTH HISTORICAL COMPARISON WITH CLICKABLE BIFURCATION */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r16)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '.88rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Monthly Target Achievement</h3>
                    <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: '.2rem 0 0 0' }}>Tap any month to view target &amp; restock bifurcation</p>
                  </div>
                  <span style={{ fontSize: '.68rem', color: 'var(--g4)', fontWeight: 800 }}>
                    Selected: <strong style={{ textTransform: 'uppercase' }}>{selectedMonthKey}</strong>
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', marginBottom: '1rem' }}>
                  {[
                    { key: 'jun', label: 'June 2026', pct: 85, color: '#d4a574' },
                    { key: 'jul', label: 'July 2026', pct: 92, color: '#d4a574' },
                    { key: 'aug', label: 'August 2026 (Current)', pct: avgProgress, color: '#c41e3a', isCurrent: true }
                  ].map((m) => {
                    const isSelected = selectedMonthKey === m.key;
                    return (
                      <div
                        key={m.key}
                        onClick={() => setSelectedMonthKey(m.key)}
                        style={{
                          background: isSelected ? 'rgba(212,165,116,0.1)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1.5px solid #d4a574' : '1px solid var(--bdr2)',
                          borderRadius: 'var(--r12)', padding: '.75rem .85rem',
                          cursor: 'pointer', transition: 'all .2s',
                          boxShadow: isSelected ? '0 0 12px rgba(212,165,116,0.25)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.75rem', fontWeight: 700, marginBottom: '.35rem' }}>
                          <span style={{ color: isSelected ? 'var(--g4)' : 'var(--t1)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                            {isSelected && <span style={{ fontSize: '.8rem' }}>👉</span>}
                            {m.label}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                            <span style={{ color: m.isCurrent ? '#c41e3a' : 'var(--g4)', fontWeight: 900 }}>{m.pct}% Achieved</span>
                            <span className="material-symbols-outlined" style={{ fontSize: '.85rem', color: isSelected ? 'var(--g4)' : 'var(--t3)' }}>
                              {isSelected ? 'expand_less' : 'chevron_right'}
                            </span>
                          </div>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg3)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${m.pct}%`, background: m.isCurrent ? 'linear-gradient(90deg, #d4a574, #c41e3a)' : '#d4a574', borderRadius: '9999px', transition: 'width 0.4s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── INTERACTIVE MONTH BIFURCATION DRAWER CARD ── */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(212,165,116,.08), rgba(196,30,58,.04))',
                  border: '1.5px solid #d4a574', borderRadius: 'var(--r12)', padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.65rem', borderBottom: '1px solid rgba(212,165,116,0.2)', paddingBottom: '.5rem' }}>
                    <div>
                      <span style={{ fontSize: '.65rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        📊 {selectedBifurcation.monthName} Bifurcation
                      </span>
                      <h4 style={{ fontSize: '.95rem', fontWeight: 900, color: 'var(--t1)', margin: '.1rem 0 0 0' }}>
                        {selectedBifurcation.completionPct}% Target Completion
                      </h4>
                    </div>
                    <span style={{
                      fontSize: '.62rem', fontWeight: 800, padding: '.2rem .5rem', borderRadius: '9999px',
                      background: selectedBifurcation.completionPct >= 100 ? 'rgba(16,185,129,.15)' : 'rgba(212,165,116,.2)',
                      color: selectedBifurcation.completionPct >= 100 ? '#10b981' : 'var(--g4)',
                      border: `1px solid ${selectedBifurcation.completionPct >= 100 ? '#10b981' : 'var(--g4)'}`
                    }}>
                      {selectedBifurcation.status}
                    </span>
                  </div>

                  {/* Summary Metric Pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem', marginBottom: '.85rem' }}>
                    <div style={{ background: 'var(--bg2)', padding: '.45rem', borderRadius: '8px', textAlign: 'center' }}>
                      <p style={{ fontSize: '.58rem', color: 'var(--t3)', margin: 0, textTransform: 'uppercase' }}>Bonus Points</p>
                      <p style={{ fontSize: '.8rem', fontWeight: 900, color: 'var(--g4)', margin: '.1rem 0 0 0' }}>+{selectedBifurcation.bonusPointsClaimed} pts</p>
                    </div>
                    <div style={{ background: 'var(--bg2)', padding: '.45rem', borderRadius: '8px', textAlign: 'center' }}>
                      <p style={{ fontSize: '.58rem', color: 'var(--t3)', margin: 0, textTransform: 'uppercase' }}>Restocked</p>
                      <p style={{ fontSize: '.8rem', fontWeight: 900, color: 'var(--t1)', margin: '.1rem 0 0 0' }}>{selectedBifurcation.totalBoxes} Boxes</p>
                    </div>
                    <div style={{ background: 'var(--bg2)', padding: '.45rem', borderRadius: '8px', textAlign: 'center' }}>
                      <p style={{ fontSize: '.58rem', color: 'var(--t3)', margin: 0, textTransform: 'uppercase' }}>Sub-DB Spend</p>
                      <p style={{ fontSize: '.8rem', fontWeight: 900, color: '#c41e3a', margin: '.1rem 0 0 0' }}>{selectedBifurcation.totalSpend}</p>
                    </div>
                  </div>

                  {/* Target-by-target breakdown */}
                  <p style={{ fontSize: '.65rem', fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 .45rem 0' }}>
                    Target Quota Breakdown:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                    {selectedBifurcation.targetItems.map((item, itemIdx) => (
                      <div key={itemIdx} style={{
                        background: 'var(--bg1)', border: '1px solid var(--bdr2)',
                        borderRadius: '8px', padding: '.55rem .7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.2rem' }}>
                            <div style={{ width: '60px', height: '5px', background: 'var(--bg3)', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${item.pct}%`, background: item.done ? '#10b981' : '#d4a574', borderRadius: '9999px' }}></div>
                            </div>
                            <span style={{ fontSize: '.62rem', color: 'var(--t3)' }}>{item.achieved}/{item.target} {item.unit}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '.6rem' }}>
                          <span style={{ fontSize: '.72rem', fontWeight: 900, color: item.done ? '#10b981' : 'var(--g4)' }}>
                            {item.pct}% {item.done ? '✓' : ''}
                          </span>
                          <p style={{ fontSize: '.58rem', color: 'var(--t3)', margin: 0 }}>+{item.pts} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '.62rem', color: 'var(--t3)', marginTop: '.65rem', marginBottom: 0, textAlign: 'center' }}>
                    👤 Verified by: <strong style={{ color: 'var(--t2)' }}>{selectedBifurcation.repName}</strong> ({selectedBifurcation.visitsCount} store visits)
                  </p>
                </div>
              </div>

              {/* INDIVIDUAL TARGET BREAKDOWN */}
              <h3 style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--t1)', marginBottom: '.75rem' }}>Active Target Quotas</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                {targets.map((t, idx) => {
                  const pct = Math.min(100, Math.round((Number(t.current_value) / Number(t.target_value)) * 100));
                  const isDone = pct >= 100;
                  return (
                    <div key={idx} style={{
                      background: '#fff', border: `2px solid ${isDone ? '#10b981' : '#d4a574'}`,
                      borderRadius: 'var(--r12)', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                        <div>
                          <p style={{ fontSize: '.88rem', fontWeight: 800, color: '#2d2d2d', margin: '0 0 .2rem 0' }}>{t.title}</p>
                          <p style={{ fontSize: '.7rem', color: '#666', margin: 0 }}>Progress: <strong style={{ color: '#c41e3a' }}>{t.current_value}</strong> / {t.target_value} {t.unit}</p>
                        </div>
                        <span style={{
                          fontSize: '.68rem', fontWeight: 800, padding: '.2rem .55rem', borderRadius: '9999px',
                          background: isDone ? 'rgba(16,185,129,.1)' : 'rgba(212,165,116,.15)',
                          color: isDone ? '#10b981' : '#d4a574',
                          border: `1px solid ${isDone ? '#10b981' : '#d4a574'}`
                        }}>
                          {isDone ? '✓ Completed' : `${pct}% Done`}
                        </span>
                      </div>

                      <div style={{ height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '.6rem' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isDone ? '#10b981' : 'linear-gradient(90deg, #d4a574, #c41e3a)', borderRadius: '9999px' }}></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '.68rem', color: '#999' }}>Reward on completion:</span>
                        <span style={{ fontSize: '.75rem', fontWeight: 800, color: '#d4a574' }}>+{t.points_reward} Points</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 3: RESTOCK VELOCITY & SKU PATTERNS
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'restock' && (
            <>
              {/* WEEKLY RESTOCK VOLUME BAR CHART */}
              <div style={{ background: '#fff', border: '2px solid #d4a574', borderRadius: 'var(--r16)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(212,165,116,.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Weekly Restock Velocity</span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2d2d2d', margin: '.2rem 0 0 0' }}>163 Boxes <span style={{ fontSize: '.75rem', color: '#10b981', fontWeight: 700 }}>↑22% vs last month</span></h3>
                  </div>
                  <div style={{ padding: '.4rem .7rem', background: 'rgba(212,165,116,.1)', borderRadius: '12px', border: '1px solid #d4a574', textAlign: 'center' }}>
                    <p style={{ fontSize: '.6rem', color: '#999', margin: 0 }}>Wholesale Value</p>
                    <p style={{ fontSize: '.85rem', fontWeight: 900, color: '#d4a574', margin: 0 }}>₹{totalRestockSpend.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* SVG Visual Bars */}
                <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '.8rem', paddingBottom: '.5rem', borderBottom: '1px solid #eee' }}>
                  {weeklyRestock.map((w, idx) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '.65rem', fontWeight: 800, color: '#c41e3a', marginBottom: '.3rem' }}>{w.boxes}b</span>
                      <div style={{ width: '100%', height: w.height, background: 'linear-gradient(180deg, #c41e3a, #d4a574)', borderRadius: '6px 6px 0 0', transition: 'all .3s' }}></div>
                      <span style={{ fontSize: '.65rem', color: '#666', marginTop: '.4rem', fontWeight: 600 }}>{w.week.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SKU DISTRIBUTION BREAKDOWN */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r16)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '.88rem', fontWeight: 800, color: 'var(--t1)', marginBottom: '1rem' }}>Restocked Product Breakdown</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                  {catDistribution.map((c, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', fontWeight: 700, marginBottom: '.3rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--t1)' }}>
                          <span>{c.emoji}</span> {c.label}
                        </span>
                        <span style={{ color: 'var(--g4)', fontWeight: 800 }}>{c.units} boxes ({c.pct}%)</span>
                      </div>
                      <div style={{ height: '7px', background: 'var(--bg3)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: '9999px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SMART RESTOCK ADVICE */}
              <div style={{ background: 'linear-gradient(135deg, rgba(212,165,116,.1), rgba(196,30,58,.05))', border: '2px solid #d4a574', borderRadius: 'var(--r16)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem' }}>
                  <span className="material-symbols-outlined fi" style={{ fontSize: '1.2rem', color: 'var(--g4)' }}>auto_awesome</span>
                  <h4 style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--g4)', margin: 0 }}>Smart Restock Advice</h4>
                </div>
                <p style={{ fontSize: '.78rem', color: 'var(--t1)', lineHeight: 1.5, margin: '0 0 .6rem 0' }}>
                  Ferrero Rocher 16-piece boxes have the highest turnover velocity in your store. Based on your current stock of {inventory.find(p => p.name?.includes('16'))?.qty || 8} units, you should request <strong style={{ color: 'var(--g4)' }}>20 additional boxes</strong> from your Sub-DB representative on their next visit.
                </p>
                <button onClick={() => navigate('/inventory')} style={{ padding: '.45rem .85rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '.72rem', fontWeight: 800, cursor: 'pointer' }}>
                  View Full Stock Ledger →
                </button>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 4: SUB-DB INVOICE HISTORY & VERIFIED BILLS
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'invoices' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.85rem' }}>
                <div>
                  <h3 style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Sub-DB Verified Bills</h3>
                  <p style={{ fontSize: '.7rem', color: 'var(--t3)', margin: 0 }}>All bills uploaded by company reps</p>
                </div>
                <span style={{ fontSize: '.72rem', color: 'var(--g4)', fontWeight: 800 }}>{subdbInvoices.length} Invoices</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {subdbInvoices.map((inv, idx) => (
                  <div key={idx} style={{
                    background: '#fff', border: '1.5px solid #d4a574', borderRadius: 'var(--r12)',
                    padding: '1.1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem' }}>
                      <div>
                        <span style={{ fontSize: '.68rem', fontWeight: 800, color: '#c41e3a', textTransform: 'uppercase' }}>{inv.invoice_number || 'INV-VERIFIED'}</span>
                        <h4 style={{ fontSize: '.92rem', fontWeight: 900, color: '#2d2d2d', margin: '.1rem 0' }}>{inv.wholesaler_name}</h4>
                        <p style={{ fontSize: '.68rem', color: '#999', margin: 0 }}>Date: {inv.purchase_date || 'Recent'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.05rem', fontWeight: 900, color: '#d4a574', margin: 0 }}>₹{Number(inv.total_amount).toLocaleString('en-IN')}</p>
                        <span style={{ fontSize: '.6rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,.1)', border: '1px solid #10b981', padding: '.15rem .45rem', borderRadius: '9999px' }}>
                          ✓ Stock Credited
                        </span>
                      </div>
                    </div>

                    {inv.products && inv.products.length > 0 && (
                      <div style={{ background: '#f9f8f5', border: '1px solid #eee', borderRadius: '8px', padding: '.6rem', marginTop: '.6rem' }}>
                        <p style={{ fontSize: '.65rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', margin: '0 0 .3rem 0' }}>Products Credited:</p>
                        {inv.products.map((p, pIdx) => (
                          <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#444', padding: '.15rem 0' }}>
                            <span>• {p.name}</span>
                            <strong style={{ color: '#2d2d2d' }}>{p.qty} {p.unit || 'boxes'}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </AppLayout>
  );
};
