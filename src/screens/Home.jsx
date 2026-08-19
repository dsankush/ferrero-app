import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Intelligence } from '../services/intelligence';
import { ErrorLogger } from '../services/errorLogger';
import { ProductIcon } from '../components/ui/ProductIcon';

const WEEK_DATA = [
  {day:'Mon',purchase:320,sale:120},{day:'Tue',purchase:580,sale:190},{day:'Wed',purchase:240,sale:95},
  {day:'Thu',purchase:920,sale:310},{day:'Fri',purchase:1180,sale:420},{day:'Sat',purchase:680,sale:230},{day:'Sun',purchase:180,sale:60}
];

export const Home = React.memo(() => {
  const navigate = useNavigate();
  const { 
    user, walletBalance, inventory, transactions, theme, toggleTheme, FERRERO_THEME, 
    activeCampaigns, claimCampaign, pointCredits,
    monthlyTargets, simulateTargetProgress, claimTargetPoints 
  } = useAppContext();
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [insightError, setInsightError] = useState(false);
  const [showTargetsModal, setShowTargetsModal] = useState(false);

  // Memoized insight generation
  const generateInsight = useCallback(async () => {
    try {
      setLoadingInsight(true);
      setInsightError(false);
      
      // Generate AI insight with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Insight generation timeout')), 8000)
      );

      const prompt = `Based on this inventory data, give ONE specific, actionable business insight (max 2 sentences, casual tone, with emoji):
Inventory: ${inventory.slice(0, 3).map(p => `${p.name} (${p.qty} left)`).join(', ')}
Wallet: ₹${walletBalance}`;

      const insightPromise = Intelligence.ask(prompt, 'You are a retail business advisor.');
      const result = await Promise.race([insightPromise, timeoutPromise]);

      if (result && result.trim()) {
        setInsight(result);
      } else {
        throw new Error('Empty insight response');
      }
    } catch (error) {
      ErrorLogger.logAIError('HomeInsights', error);
      setInsightError(true);
      // Set a default insight
      setInsight('Reorder Ferrero Rocher 48 pieces now — only 5 boxes left and it earns ₹15/box. A ₹26,550 purchase from your distributor this month unlocks Diamond tier (2.5% cashback) worth an extra ₹1,800+ annually.');
    } finally {
      setLoadingInsight(false);
    }
  }, [inventory, walletBalance]);

  useEffect(() => {
    generateInsight();
  }, [generateInsight]);

  const maxVal = Math.max(...WEEK_DATA.map(d => d.purchase + d.sale));
  const fname = user.name.split(' ')[0] || 'Ramesh';
  const locShort = user.loc ? user.loc.split(',')[0] : 'India';

  const totalProgress = monthlyTargets.reduce((acc, t) => {
    const val = Number(t.target_value) > 0 ? (Number(t.current_value) / Number(t.target_value)) * 100 : 0;
    return acc + Math.min(100, val);
  }, 0);
  const averageProgress = Math.round(totalProgress / (monthlyTargets.length || 1));

  const triggerConfetti = () => {
    const colors = ['#d4a574', '#c41e3a', '#8b6f47', '#ffd700', '#ff0000'];
    const container = document.getElementById('shell') || document.body;
    for (let i = 0; i < 50; i++) {
      const el = document.createElement('div');
      const dx = (Math.random() - 0.5) * 350;
      const dy = (Math.random() - 0.8) * 300;
      el.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${colors[i % colors.length]};
        pointer-events: none;
        z-index: 9999;
        animation: cos-confetti 1.4s ease-out forwards;
        --dx: ${dx}px;
        --dy: ${dy}px;
        animation-delay: ${Math.random() * 0.2}s;
      `;
      container.appendChild(el);
      setTimeout(() => el.remove(), 1800);
    }
  };

  return (
    <AppLayout>
      <div className="screen active" style={{ background: 'var(--bg1)' }}>
        <div className="scroller" style={{ paddingBottom: '2rem' }}>
          
          <div className="ghead" style={{ padding: '1rem 1.1rem', border: 'none', background: 'transparent' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer' }}>
                   <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--bg3)', color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      <span className="material-symbols-outlined">person</span>
                   </div>
                   <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Namaste, {fname}! 👋</h2>
                      <p style={{ fontSize: '.65rem', color: 'var(--g4)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                         <span className="material-symbols-outlined fi" style={{ fontSize: '.8rem' }}>location_on</span>
                         {locShort}
                      </p>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                   <button className="btn-icon" onClick={() => navigate('/assistant')} style={{ border: '1px solid var(--g4)', color: 'var(--g4)', background: 'rgba(212,165,116,.08)' }}>
                      <span className="material-symbols-outlined fi">auto_awesome</span>
                   </button>
                   <button className="btn-icon" style={{ position: 'relative', background: 'var(--bg3)', border: '1px solid var(--bdr)' }}>
                      <span className="material-symbols-outlined">notifications</span>
                      <div className="gdot" style={{ position: 'absolute', top: '0', right: '0', background: '#ef4444', border: '2px solid var(--bg1)' }}>3</div>
                   </button>
                   <button className="btn-icon" onClick={toggleTheme} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)' }}>
                      <span className="material-symbols-outlined">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                   </button>
                   <button className="btn-icon" onClick={() => navigate('/settings')} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)' }}>
                      <span className="material-symbols-outlined">settings</span>
                   </button>
                </div>
             </div>
          </div>

          <div style={{ padding: '0 1.1rem' }}>
             
             {/* Wallet & Rewards Section - FERRERO THEMED */}
             <div className="au d1" style={{ background: '#fff', border: '2px solid #d4a574', borderRadius: 'var(--r16)', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(212,165,116,.1)' }}>
                <div style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e5e5', background: 'linear-gradient(135deg, rgba(212,165,116,.02), rgba(196,30,58,.02))' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                      <div style={{ width: '2.8rem', height: '2.8rem', background: 'rgba(212,165,116,.12)', borderRadius: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span className="material-symbols-outlined fi" style={{ color: '#d4a574', fontSize: '1.4rem' }}>account_balance_wallet</span>
                      </div>
                      <div>
                         <p style={{ fontSize: '.68rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>Wallet Balance</p>
                         <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--fd)', fontWeight: 900, color: '#c41e3a', display: 'flex', alignItems: 'center', gap: '.4rem', margin: 0 }}>
                            ₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#d4a574', cursor: 'pointer' }}>visibility</span>
                         </h2>
                      </div>
                   </div>
                   <button onClick={() => navigate('/wallet')} style={{ padding: '.5rem .8rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)', border: 'none', borderRadius: '9999px', color: '#fff', fontSize: '.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '.3rem', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span> Add Money
                   </button>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(212,165,116,.03)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                         <span style={{ fontSize: '.9rem' }}>💎</span>
                         <span style={{ fontSize: '.8rem', fontWeight: 600, color: '#2d2d2d' }}>Premium Benefits</span>
                      </div>
                      <div style={{ fontSize: '.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                         <strong style={{ color: '#d4a574' }}>₹247</strong> earned <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
                      </div>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ padding: '.3rem .8rem', background: 'rgba(212,165,116,.1)', border: '1px solid rgba(212,165,116,.3)', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                         <span style={{ fontSize: '.9rem' }}>🥇</span> <span style={{ fontSize: '.7rem', fontWeight: 900, color: '#d4a574' }}>GOLD TIER</span>
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                         <div style={{ padding: '.3rem .6rem', background: 'linear-gradient(135deg, rgba(212,165,116,.1), rgba(196,30,58,.05))', border: '1px solid #d4a574', borderRadius: '9999px', fontSize: '.7rem', fontWeight: 700, color: '#d4a574', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                            📦 ₹2,156
                         </div>
                         <div style={{ padding: '.3rem .6rem', background: 'linear-gradient(135deg, rgba(196,30,58,.1), rgba(212,165,116,.05))', border: '1px solid #c41e3a', borderRadius: '9999px', fontSize: '.7rem', fontWeight: 700, color: '#c41e3a', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                            💳 ₹1,326
                         </div>
                      </div>
                   </div>
                   {/* POINT CREDITS SECTION - UPGRADED PREMIUM REWARDS WIDGET */}
             <div className="au d2" style={{ background: 'var(--bg1)', border: '2px solid #d4a574', borderRadius: 'var(--r16)', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: 'var(--sh)', padding: '1.25rem 1.1rem', position: 'relative' }}>
                <style>{`
                  @keyframes marquee {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-50%, 0, 0); }
                  }
                  .monthly-targets-btn {
                    font-size: .7rem;
                    font-weight: 900;
                    color: #fff;
                    background: linear-gradient(135deg, #c41e3a, #d4a574);
                    border: 1.5px solid #ffd700;
                    padding: .28rem .7rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
                    animation: targetGlow 1.6s infinite alternate ease-in-out;
                    transition: all 0.25s ease;
                    position: relative;
                  }
                  .monthly-targets-btn:hover {
                    transform: scale(1.08) translateY(-1px);
                    background: linear-gradient(135deg, #d4a574, #c41e3a);
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 10px rgba(196, 30, 58, 0.6);
                    border-color: #fff;
                  }
                  .monthly-targets-btn::after {
                    content: '';
                    position: absolute;
                    top: -3px;
                    right: -3px;
                    width: 7px;
                    height: 7px;
                    background: #00ffcc;
                    border: 1.2px solid #000;
                    border-radius: 50%;
                    box-shadow: 0 0 6px #00ffcc;
                    animation: blinkDot 0.8s infinite alternate;
                  }
                  @keyframes targetGlow {
                    0% {
                      box-shadow: 0 0 6px rgba(255, 215, 0, 0.2), 0 0 3px rgba(196, 30, 58, 0.1);
                      transform: scale(1);
                    }
                    100% {
                      box-shadow: 0 0 14px rgba(255, 215, 0, 0.75), 0 0 7px rgba(196, 30, 58, 0.4);
                      transform: scale(1.04);
                    }
                  }
                  @keyframes blinkDot {
                    0% { opacity: 0.3; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1.2); }
                  }
                `}</style>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at top right, rgba(212,165,116,.15), transparent 70%)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <span style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>🏆 My Rewards</span>
                      <button 
                         onClick={() => setShowTargetsModal(true)}
                         className="monthly-targets-btn"
                      >
                         🎯 Monthly Targets
                      </button>
                   </div>

                   {/* Horizontally Running Marquee Strip */}
                   <div style={{
                       background: 'rgba(20, 10, 5, 0.6)',
                       borderTop: '1px solid rgba(212, 165, 116, 0.2)',
                       borderBottom: '1px solid rgba(212, 165, 116, 0.2)',
                       padding: '.35rem 0',
                       overflow: 'hidden',
                       margin: '0.5rem -1.1rem 0.8rem -1.1rem',
                       display: 'flex'
                   }}>
                      <div style={{
                          display: 'flex',
                          gap: '2rem',
                          paddingLeft: '1rem',
                          animation: 'marquee 25s linear infinite',
                          whiteSpace: 'nowrap'
                      }}>
                         {[...monthlyTargets, ...monthlyTargets].map((t, idx) => {
                            let emoji = '🎯';
                            if (t.id === 'target-1') emoji = '📦';
                            if (t.id === 'target-2') emoji = '⚡';
                            if (t.id === 'target-3') emoji = '💰';
                            const progress = Math.min(100, Math.round((Number(t.current_value) / Number(t.target_value)) * 100));
                            return (
                               <span key={`${t.id}-${idx}`} style={{ color: '#d4a574', fontSize: '.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{emoji}</span>
                                  <span>{t.title}</span>
                                  <span style={{ color: '#fff' }}>({t.current_value}/{t.target_value} {t.unit})</span>
                                  <span style={{ color: progress >= 100 ? '#48bb78' : '#e53e3e', fontSize: '.65rem' }}>{progress}%</span>
                               </span>
                            );
                         })}
                      </div>
                   </div>

                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                      <div>
                         <p style={{ fontSize: '.65rem', color: 'var(--t3)', textTransform: 'uppercase', margin: 0 }}>Current Balance</p>
                         <h2 style={{ fontSize: '2rem', fontFamily: 'var(--fd)', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            {pointCredits.toLocaleString('en-IN')}
                            <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--t2)' }}>Points</span>
                          </h2>
                      </div>
                      <button 
                         onClick={() => navigate('/rewards')} 
                         style={{ padding: '.65rem 1.1rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '.8rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,165,116,.3)', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                         Redeem Rewards <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                      </button>
                   </div>

                   <div style={{ height: '1px', background: 'var(--bdr)', margin: '0.8rem 0' }}></div>

                   <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', fontWeight: 700, color: 'var(--t2)', marginBottom: '.3rem' }}>
                         <span>Monthly Target Progress</span>
                         <span style={{ color: '#d4a574', fontWeight: 900 }}>{averageProgress}%</span>
                      </div>
                      <div style={{ height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid rgba(212,165,116,0.1)' }}>
                         <div style={{ height: '100%', width: `${averageProgress}%`, background: 'linear-gradient(90deg, #d4a574, #c41e3a)', borderRadius: '9999px', transition: 'width 0.5s ease-out' }} />
                      </div>
                      <p style={{ fontSize: '.62rem', color: 'var(--t3)', marginTop: '.35rem', margin: '0.35rem 0 0 0' }}>
                         {averageProgress === 100 
                           ? '🎉 Fantastic! You completed all monthly targets! Claim your rewards.' 
                           : `Complete targets to earn bonus points and unlock rewards! Current progress: ${averageProgress}%`}
                      </p>
                   </div>
                </div>
             </div>
             </div>
             </div>

             {/* ACTIVE CAMPAIGNS SECTION */}
             {activeCampaigns && activeCampaigns.length > 0 && (
               <div style={{
                 marginBottom: '1.5rem',
                 padding: '1rem',
                 background: '#fff',
                 border: '2px solid #d4a574',
                 borderRadius: 'var(--r16)',
                 boxShadow: '0 2px 8px rgba(212,165,116,.1)'
               }}>
                 <h3 style={{
                   fontSize: '1.05rem',
                   fontWeight: 900,
                   color: '#d4a574',
                   marginBottom: '1rem',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '.5rem',
                   margin: '0 0 1rem 0'
                 }}>
                   ✨ Active Offers ({activeCampaigns.length})
                 </h3>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                   {activeCampaigns.map(campaign => {
                     const icons = {
                       commission: '💰',
                       discount: '🔥',
                       combo: '🎁',
                       cashback: '💳'
                     };

                     return (
                       <div key={campaign.id} style={{
                         background: 'linear-gradient(135deg, rgba(212,165,116,.02), rgba(196,30,58,.02))',
                         border: '1px solid #d4a574',
                         borderRadius: '.75rem',
                         padding: '.75rem',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '.75rem'
                       }}>
                         <div style={{
                           width: '2.5rem',
                           height: '2.5rem',
                           background: 'rgba(212,165,116,.12)',
                           borderRadius: '.5rem',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           fontSize: '1.2rem',
                           flexShrink: 0
                         }}>
                           {icons[campaign.offer_type] || '🎁'}
                         </div>
                         <div style={{ flex: 1, minWidth: 0 }}>
                           <p style={{
                             margin: 0,
                             fontWeight: 700,
                             color: '#2d2d2d',
                             fontSize: '0.9rem'
                           }}>
                             {campaign.title}
                           </p>
                           <p style={{
                             margin: '0.2rem 0 0 0',
                             color: '#666',
                             fontSize: '0.75rem',
                             lineHeight: 1.3
                           }}>
                             {campaign.description}
                           </p>
                         </div>
                         <button
                           onClick={() => claimCampaign(campaign.id)}
                           style={{
                             padding: '0.4rem 0.8rem',
                             background: '#d4a574',
                             color: '#fff',
                             border: 'none',
                             borderRadius: '0.5rem',
                             fontWeight: 700,
                             fontSize: '0.75rem',
                             cursor: 'pointer',
                             whiteSpace: 'nowrap',
                             transition: 'all 0.2s'
                           }}
                           onMouseOver={e => {
                             e.target.style.background = '#c41e3a';
                           }}
                           onMouseOut={e => {
                             e.target.style.background = '#d4a574';
                           }}
                         >
                           Claim →
                         </button>
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}

             {/* Quick Actions */}
              <div className="au d2" style={{ marginBottom: '1.5rem' }}>
                 <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--t1)' }}>Store Overview</h3>
                 <p style={{ fontSize: '.75rem', color: 'var(--t3)', marginBottom: '1rem' }}>Manage your inventory, milestones, and reward earnings</p>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginBottom: '.8rem' }}>
                    <div onClick={() => navigate('/inventory')} style={{ background: '#fff', border: '2px solid #d4a574', borderRadius: 'var(--r12)', padding: '1rem', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}>
                       <div style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)', borderRadius: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '.8rem' }}>
                          <span className="material-symbols-outlined fi" style={{ color: '#fff', fontSize: '1.6rem' }}>inventory_2</span>
                       </div>
                       <p style={{ fontSize: '.9rem', fontWeight: 900, marginBottom: '.2rem', color: '#2d2d2d' }}>My Stock</p>
                       <p style={{ fontSize: '.68rem', color: '#666', lineHeight: 1.4, margin: 0 }}>{inventory.length} Ferrero SKUs stocked</p>
                    </div>
                    
                    <div onClick={() => navigate('/rewards')} style={{ background: '#fff', border: '2px solid #d4a574', borderRadius: 'var(--r12)', padding: '1rem', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}>
                       <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,165,116,.15)', borderRadius: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '.8rem' }}>
                          <span className="material-symbols-outlined fi" style={{ color: '#d4a574', fontSize: '1.6rem' }}>featured_seasonal_and_gifts</span>
                       </div>
                       <p style={{ fontSize: '.9rem', fontWeight: 900, marginBottom: '.2rem', color: '#2d2d2d' }}>Rewards Store</p>
                       <p style={{ fontSize: '.68rem', color: '#666', lineHeight: 1.4, margin: 0 }}>{pointCredits.toLocaleString('en-IN')} points available</p>
                    </div>
                 </div>

                 <div onClick={() => setShowTargetsModal(true)} style={{ background: 'linear-gradient(135deg, rgba(212,165,116,.1), rgba(196,30,58,.05))', border: '2px solid #d4a574', borderRadius: 'var(--r12)', padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.8rem', transition: 'all 0.3s' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', background: '#d4a574', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <span className="material-symbols-outlined fi" style={{ color: '#fff', fontSize: '1.3rem' }}>target</span>
                    </div>
                    <div>
                       <p style={{ fontSize: '.95rem', fontWeight: 900, color: '#d4a574', margin: 0 }}>Monthly Restock Targets</p>
                       <p style={{ fontSize: '.7rem', color: '#666', margin: 0 }}>Auto-advances when Sub-DB representative uploads bills</p>
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.6rem' }}>
                    <div onClick={() => navigate('/earnings')} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', padding: '.8rem .4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                       <div style={{ width: '2.2rem', height: '2.2rem', background: 'rgba(160,210,255,.1)', borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined fi" style={{ color: 'var(--td)', fontSize: '1.1rem' }}>bar_chart</span></div>
                       <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--t2)' }}>Earnings</span>
                    </div>
                    <div onClick={() => navigate('/assistant')} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', padding: '.8rem .4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                       <div style={{ width: '2.2rem', height: '2.2rem', background: 'rgba(212,165,116,.1)', borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined fi" style={{ color: 'var(--g4)', fontSize: '1.1rem' }}>auto_awesome</span></div>
                       <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--t2)' }}>Assistant</span>
                    </div>
                    <div onClick={() => navigate('/settings')} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', padding: '.8rem .4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                       <div style={{ width: '2.2rem', height: '2.2rem', background: 'var(--bg3)', borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined fi" style={{ color: 'var(--o4)', fontSize: '1.1rem' }}>settings</span></div>
                       <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--t2)' }}>Settings</span>
                    </div>
                 </div>
              </div>

             {/* Chart */}
             <div className="au d3" style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.4rem' }}>Weekly Earnings</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹8,440</h2>
                      <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--g4)', display: 'flex', alignItems: 'center' }}>↑18%</span>
                   </div>
                   <div style={{ display: 'flex', gap: '.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#d4a574' }}></div><span style={{ fontSize: '.65rem', color: 'var(--t2)' }}>Purchase</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#c41e3a' }}></div><span style={{ fontSize: '.65rem', color: 'var(--t2)' }}>Sale</span></div>
                   </div>
                </div>
                
                <div style={{ height: '120px', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid var(--bdr2)' }}>
                      {WEEK_DATA.map((d, i) => {
                         const ph = Math.round((d.purchase/maxVal) * 85);
                         const sh = Math.round((d.sale/maxVal) * 85);
                         return (
                           <div key={d.day} className="bar-seg" style={{ width: '12%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                 <div style={{ width: '100%', height: `${ph}px`, background: '#d4a574', borderRadius: '4px 4px 0 0', minHeight: '4px', animation: `barGrow .6s ${i * .07}s both` }}></div>
                                 <div style={{ width: '100%', height: `${sh}px`, background: '#c41e3a', borderRadius: '0 0 2px 2px', minHeight: '3px' }}></div>
                           </div>
                         );
                      })}
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.4rem' }}>
                      {WEEK_DATA.map(d => (
                         <div key={d.day} style={{ width: '12%', textAlign: 'center' }}>
                            <span style={{ fontSize: '.6rem', color: 'var(--t3)', fontWeight: 600 }}>{d.day}</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Daily Insight */}
             <div className="au d4" style={{ background: 'rgba(212,165,116,.05)', border: '1px solid rgba(212,165,116,.15)', borderRadius: 'var(--r12)', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem' }}>
                   <div style={{ width: '1.5rem', height: '1.5rem', background: '#d4a574', borderRadius: '.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined fi" style={{ color: '#fff', fontSize: '1rem' }}>auto_awesome</span>
                   </div>
                   <h3 style={{ fontSize: '.85rem', fontWeight: 900, color: '#d4a574', margin: 0 }}>Daily Insight</h3>
                </div>
                {loadingInsight ? (
                  <div style={{ display: 'flex', gap: '4px' }}><div className="tdot"></div><div className="tdot"></div><div className="tdot"></div></div>
                ) : (
                  <p style={{ fontSize: '.8rem', color: 'var(--t2)', lineHeight: 1.5 }}>
                     {insight}
                  </p>
                )}
             </div>

             {/* Day's Activity */}
             <div className="au d5" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.8rem' }}>
                   <p style={{ fontSize: '.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Day's Activity</p>
                   <span onClick={() => navigate('/earnings')} style={{ fontSize: '.75rem', color: 'var(--g4)', fontWeight: 700, cursor: 'pointer' }}>All →</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                   {transactions.slice(0, 3).map((t, i) => (
                      <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '1rem', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)' }}>
                         <div style={{ width: '2rem', height: '2rem', background: 'var(--bg3)', borderRadius: '.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined fi" style={{ fontSize: '1.1rem', color: t.clr }}>{t.icon || 'receipt'}</span>
                         </div>
                         <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</p>
                            <p style={{ fontSize: '.65rem', color: 'var(--t3)' }}>{t.date} · {t.sub}</p>
                         </div>
                         <span style={{ fontWeight: 800, fontSize: '.9rem', color: t.clr, flexShrink: 0 }}>{t.amt}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* Top Products */}
             <div className="au d6" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.8rem' }}>
                   <p style={{ fontSize: '.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Top Products</p>
                   <span onClick={() => navigate('/inventory')} style={{ fontSize: '.75rem', color: 'var(--g4)', fontWeight: 700, cursor: 'pointer' }}>View all →</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                   
                   {inventory.slice(0, 3).map((p, i) => (
                     <div key={p.id || i} onClick={() => navigate('/sell')} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '1rem', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', cursor: 'pointer' }}>
                        <div style={{ width: '2.4rem', height: '2.4rem', background: 'var(--bg3)', borderRadius: '.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                           <ProductIcon product={p} fontSize="1.2rem" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                           <p style={{ fontSize: '.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                           <p style={{ fontSize: '.65rem', color: 'var(--t3)' }}>{p.unit} · {p.qty} in stock</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                           <p style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--t1)' }}>₹{p.sell}</p>
                           <p style={{ fontSize: '.65rem', color: 'var(--g4)', fontWeight: 600 }}>earn ₹{p.earn}</p>
                        </div>
                     </div>
                   ))}

                </div>
             </div>

          </div>
        </div>
      </div>

       {showTargetsModal && (
         <div style={{
           position: 'fixed',
           inset: 0,
           background: 'rgba(0, 0, 0, 0.75)',
           backdropFilter: 'blur(8px)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           zIndex: 1000,
           padding: '1.25rem',
           animation: 'fadeIn 0.25s ease-out'
         }}>
           <div style={{
             background: 'linear-gradient(135deg, #1d120d 0%, #0b0604 100%)',
             border: '2.5px solid #d4a574',
             borderRadius: 'var(--r16)',
             width: '100%',
             maxWidth: '380px',
             padding: '1.5rem',
             boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
             position: 'relative',
             animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
           }}>
             {/* Header */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                 <span style={{ fontSize: '1.4rem' }}>🎯</span>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#d4a574', margin: 0 }}>Monthly Target Tracker</h3>
               </div>
               <button 
                 onClick={() => setShowTargetsModal(false)}
                 style={{
                   background: 'rgba(255,255,255,0.08)',
                   border: 'none',
                   borderRadius: '50%',
                   width: '1.8rem',
                   height: '1.8rem',
                   color: '#fff',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   cursor: 'pointer'
                 }}
               >
                 <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
               </button>
             </div>

             {/* Modal description */}
             <p style={{ fontSize: '.75rem', color: 'var(--t2)', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
               Achieve your monthly business metrics to earn bonus points. Points are credited immediately upon claiming.
             </p>

             {/* Targets list */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '.25rem' }}>
               {monthlyTargets.map(t => {
                 const progress = Math.min(100, Math.round((Number(t.current_value) / Number(t.target_value)) * 100));
                 const isCompleted = t.status === 'completed' || progress >= 100;
                 const isClaimed = t.status === 'claimed';

                 let emoji = '🎯';
                 if (t.id === 'target-1') emoji = '📦';
                 if (t.id === 'target-2') emoji = '⚡';
                 if (t.id === 'target-3') emoji = '💰';

                 return (
                   <div 
                     key={t.id}
                     style={{
                       background: 'var(--bg2)',
                       border: isClaimed 
                         ? '1.5px solid rgba(72,187,120,0.3)' 
                         : isCompleted 
                           ? '1.5px solid #d4a574' 
                           : '1.5px solid var(--bdr2)',
                       borderRadius: '12px',
                       padding: '.85rem',
                       display: 'flex',
                       flexDirection: 'column',
                       gap: '.55rem'
                     }}
                   >
                     {/* Target Title & Reward Badge */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                         <span style={{ fontSize: '1rem' }}>{emoji}</span>
                         <h4 style={{ fontSize: '.82rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{t.title}</h4>
                       </div>
                       <span style={{
                         fontSize: '.62rem',
                         fontWeight: 900,
                         color: isClaimed ? 'var(--t3)' : '#d4a574',
                         background: isClaimed ? 'rgba(255,255,255,0.05)' : 'rgba(212,165,116,0.12)',
                         border: isClaimed ? '1px solid rgba(255,255,255,0.1)' : '1px solid #d4a574',
                         padding: '.15rem .4rem',
                         borderRadius: '6px'
                       }}>
                         {isClaimed ? '✓ Claimed' : `+${t.points_reward} pts`}
                       </span>
                     </div>

                     {/* Description */}
                     <p style={{ fontSize: '.68rem', color: 'var(--t2)', margin: 0, lineHeight: 1.3 }}>{t.description}</p>

                     {/* Target progress numbers */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--t1)', fontWeight: 700 }}>
                       <span style={{ color: 'var(--t3)' }}>Progress</span>
                       <span>{t.current_value} / {t.target_value} {t.unit}</span>
                     </div>

                     {/* Target progress bar */}
                     <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '9999px', overflow: 'hidden' }}>
                       <div 
                         style={{ 
                           height: '100%', 
                           width: `${progress}%`, 
                           background: isClaimed 
                             ? '#48bb78' 
                             : 'linear-gradient(90deg, #d4a574, #c41e3a)', 
                           borderRadius: '9999px',
                           transition: 'width 0.4s ease-out' 
                         }} 
                       />
                     </div>

                     {/* Simulation & Claim Actions */}
                     <div style={{ display: 'flex', gap: '.5rem', marginTop: '.25rem' }}>
                       {!isClaimed && (
                         <button
                           onClick={() => simulateTargetProgress(t.id, t.id === 'target-3' ? 50 : 1)}
                           style={{
                             flex: 1,
                             padding: '.35rem .6rem',
                             background: 'rgba(212,165,116,0.1)',
                             border: '1px solid rgba(212,165,116,0.3)',
                             borderRadius: '6px',
                             color: '#d4a574',
                             fontSize: '.68rem',
                             fontWeight: 700,
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             gap: '2px'
                           }}
                         >
                           <span className="material-symbols-outlined" style={{ fontSize: '.85rem' }}>add</span>
                           Simulate {t.id === 'target-3' ? '+₹50' : '+1'}
                         </button>
                       )}

                       {isCompleted && !isClaimed && (
                         <button
                           onClick={async () => {
                             const success = await claimTargetPoints(t.id);
                             if (success) {
                               triggerConfetti();
                             }
                           }}
                           style={{
                             flex: 1.2,
                             padding: '.35rem .6rem',
                             background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
                             border: 'none',
                             borderRadius: '6px',
                             color: '#fff',
                             fontSize: '.68rem',
                             fontWeight: 900,
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             gap: '2px',
                             boxShadow: '0 2px 8px rgba(212,165,116,0.4)',
                             animation: 'pulse 1.5s infinite'
                           }}
                         >
                           <span className="material-symbols-outlined" style={{ fontSize: '.85rem' }}>emoji_events</span>
                           Claim Reward
                         </button>
                       )}

                       {isClaimed && (
                         <div style={{
                           flex: 1,
                           padding: '.35rem .6rem',
                           background: 'rgba(72,187,120,0.08)',
                           border: '1px solid rgba(72,187,120,0.2)',
                           borderRadius: '6px',
                           color: '#48bb78',
                           fontSize: '.68rem',
                           fontWeight: 700,
                           textAlign: 'center',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '2px'
                         }}>
                           <span className="material-symbols-outlined" style={{ fontSize: '.9rem' }}>check_circle</span>
                           Points Claimed
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         </div>
       )}
    </AppLayout>
  );
});

Home.displayName = 'Home';
