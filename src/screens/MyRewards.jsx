import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { showToast } from '../components/ui/Toast';

// DUMMY PARTNER SCREEN SUB-COMPONENT
export const DummyPartnerOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { myRedemptions } = useAppContext();

  // Find redemption
  const claim = myRedemptions.find(c => c.id.toString() === id.toString());
  const rewardName = claim?.reward?.title || 'Amazon Gift Voucher';
  const partner = claim?.reward?.partner_name || 'Amazon';
  const code = claim?.voucherCode || 'AMZ-847392';

  return (
    <div className="screen active" style={{ background: '#f9f7f3', color: '#2d2d2d', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title={`${partner} Redirect`} backTo="/rewards/my-rewards" />
      
      <div className="scroller" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ background: '#fff', border: '1.5px solid #d4a574', borderRadius: '24px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(139,111,71,.08)', maxWidth: '360px', width: '100%' }}>
          
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2d2d2d', marginBottom: '.75rem' }}>{partner} Redemption Portal</h2>
          
          <div style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '12px', padding: '1rem', margin: '1.5rem 0' }}>
            <p style={{ fontSize: '.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 .2rem 0' }}>Voucher Claim Code</p>
            <strong style={{ fontSize: '1.2rem', color: '#c41e3a', fontFamily: 'var(--fm)' }}>{code}</strong>
          </div>

          <p style={{ fontSize: '.8rem', color: '#666', lineHeight: 1.5, marginBottom: '2rem' }}>
            💡 <strong>This is a simulated partner redemption page.</strong> In production, CounterOS will securely redirect you to the {partner} merchant site with this code automatically applied to your cart.
          </p>

          <button 
            onClick={() => {
              showToast('✓ Code copied! Redirecting...');
              setTimeout(() => navigate('/rewards/my-rewards'), 1000);
            }} 
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #d4a574, #c41e3a)', color: '#fff' }}
          >
            Apply &amp; Finish
          </button>
        </div>
      </div>
    </div>
  );
};

// MAIN MYREWARDS COMPONENT
export const MyRewards = () => {
  const navigate = useNavigate();
  const { myRedemptions, useVoucher, kycDoc } = useAppContext();
  const [tabActive, setTabActive] = useState('active'); // active | used | expired
  const [selectedTrackerId, setSelectedTrackerId] = useState(null);

  // Helper to check if item is 194R-applicable
    const checkIs194r = (claim) => {
    if (!claim) return false;
    const r = claim.reward || {};
    const val = Number(r.reward_value || claim.cashbackAmount || 0);
    return val >= 20000;
  };

  // Helper to check if item is pending compliance review
  const checkIsPendingCompliance = (claim) => {
    if (!checkIs194r(claim)) return false;
    const status = claim.complianceStatus;
    return status && status !== 'Approved' && status !== 'Reward Released' && status !== 'Rejected';
  };

  // Filtering redemptions by tab
  const filteredClaims = myRedemptions.filter(claim => {
    const isPendingComp = checkIsPendingCompliance(claim);
    const isRejected = checkIs194r(claim) && claim.complianceStatus === 'Rejected';

    if (tabActive === 'active') {
      return (claim.status === 'active' || isPendingComp) && !isRejected;
    }
    if (tabActive === 'used') {
      return claim.status === 'used' && !isPendingComp && !isRejected;
    }
    return claim.status === 'expired' || claim.status === 'cancelled' || isRejected;
  });

  const handleCopyCode = (code) => {
    if (code.includes('🔒')) {
      showToast('⚠️ Voucher code is locked until 194R compliance is complete.', 'error');
      return;
    }
    navigator.clipboard.writeText(code);
    showToast('📋 Voucher code copied to clipboard!');
  };

  const handleUseNow = async (claim) => {
    if (claim.reward?.reward_type === 'partner') {
      await useVoucher(claim.id);
      navigate(`/rewards/partner-link/${claim.id}`);
    } else {
      await useVoucher(claim.id);
    }
  };

  // Timeline stage config
  const getTimelineStages = (status) => {
    const stages = [
      { name: 'Reward Selected', desc: 'Points deducted & request logged', done: true },
      { name: 'KYC Document Submission', desc: 'PAN & shop address details', done: false, active: false, action: false },
      { name: 'Verification Review', desc: 'Distributor verifying details', done: false, active: false },
      { name: 'TDS Approval', desc: '10% TDS withholding verification', done: false, active: false },
      { name: 'Reward Released', desc: 'Active voucher code generated', done: false, active: false }
    ];

    if (status === 'Pending KYC') {
      stages[1].active = true;
      stages[1].action = true; // Needs KYC submit
    } else if (status === 'Pending Verification') {
      stages[1].done = true;
      stages[2].active = true;
    } else if (status === 'Pending TDS') {
      stages[1].done = true;
      stages[2].done = true;
      stages[3].active = true;
    } else if (status === 'Pending Approval') {
      stages[1].done = true;
      stages[2].done = true;
      stages[3].done = true;
      stages[4].active = true;
    } else if (status === 'Approved' || status === 'Reward Released') {
      stages[1].done = true;
      stages[2].done = true;
      stages[3].done = true;
      stages[4].done = true;
    }

    return stages;
  };

  return (
    <div className="screen active" style={{ background: 'var(--bg0)' }}>
      <Header title="My Rewards Vault" backTo="/rewards" />
      
      {/* TABS CONTROLLER */}
      <div style={{ display: 'flex', background: 'var(--bg1)', borderBottom: '1px solid var(--bdr)' }}>
        {['active', 'used', 'expired'].map(t => (
          <button
            key={t}
            onClick={() => setTabActive(t)}
            style={{
              flex: 1,
              padding: '.9rem .25rem',
              background: 'transparent',
              color: tabActive === t ? 'var(--g4)' : 'var(--t3)',
              border: 'none',
              fontWeight: 800,
              fontSize: '.78rem',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              borderBottom: tabActive === t ? '2px solid var(--g4)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {t} Rewards
          </button>
        ))}
      </div>

      <div className="scroller" style={{ padding: '1.25rem' }}>
        
        {filteredClaims.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗃️</span>
            <p style={{ color: 'var(--t3)', fontSize: '.9rem', margin: 0 }}>
              No {tabActive} rewards found in your vault.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {filteredClaims.map(claim => {
              const reward = claim.reward || {
                title: 'Instant Cash Reward',
                description: 'Cashback credential',
                reward_type: 'cashback',
                category: 'cashback'
              };

              const isPartner = reward.reward_type === 'partner';
              const isCashback = reward.reward_type === 'cashback';
              const is194r = checkIs194r(claim);
              const isPendingCompliance = checkIsPendingCompliance(claim);
              const isRejected = claim.complianceStatus === 'Rejected';

              return (
                <div 
                  key={claim.id} 
                  style={{ 
                    background: 'var(--card)', 
                    border: isPendingCompliance 
                      ? '1px solid rgba(212,165,116,0.4)' 
                      : isRejected 
                      ? '1px solid rgba(239,68,68,0.4)'
                      : '1px solid var(--bdr)', 
                    borderRadius: 'var(--r16)', 
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', gap: '.8rem', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '2.8rem', height: '2.8rem', 
                      background: isPendingCompliance 
                        ? 'rgba(212,165,116,0.08)' 
                        : isRejected 
                        ? 'rgba(239,68,68,0.08)'
                        : 'rgba(120,242,117,0.08)', 
                      borderRadius: '10px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '1.5rem', flexShrink: 0 
                    }}>
                      {reward.category === 'cashback' ? '💳' : reward.category === 'gift_card' ? '🎁' : reward.category === 'travel' ? '✈️' : reward.category === 'electronics' ? '📱' : '🎟️'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '.62rem', fontWeight: 800, color: isRejected ? '#ef4444' : 'var(--g4)', textTransform: 'uppercase' }}>
                          {reward.partner_name || reward.category}
                        </span>
                        <span style={{ fontSize: '.62rem', color: 'var(--t3)' }}>
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '.95rem', fontWeight: 900, color: '#fff', marginTop: '.1rem' }}>
                        {reward.title}
                      </h4>
                      <p style={{ fontSize: '.75rem', color: 'var(--t3)', lineHeight: 1.4, marginTop: '.2rem' }}>
                        {reward.description}
                      </p>

                      {/* 194R Compliance Badges */}
                      {is194r && (
                        <div style={{ display: 'flex', gap: '5px', marginTop: '.4rem' }}>
                          <span style={{ fontSize: '.65rem', background: 'rgba(212,165,116,0.1)', color: 'var(--g4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Section 194R
                          </span>
                          <span style={{ 
                            fontSize: '.65rem', 
                            background: isRejected 
                              ? 'rgba(239,68,68,0.15)' 
                              : claim.complianceStatus === 'Reward Released' || claim.complianceStatus === 'Approved'
                              ? 'rgba(120,242,117,0.15)'
                              : 'rgba(212,165,116,0.15)', 
                            color: isRejected 
                              ? '#ef4444' 
                              : claim.complianceStatus === 'Reward Released' || claim.complianceStatus === 'Approved'
                              ? '#78f275'
                              : 'var(--g4)', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontWeight: 700 
                          }}>
                            {claim.complianceStatus || 'Pending KYC'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CODES AND ACCORDION DETAILS */}
                  {isCashback ? (
                    <div style={{ background: 'rgba(120,242,117,.05)', border: '1px solid rgba(120,242,117,.2)', borderRadius: '10px', padding: '.65rem .85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.25rem' }}>
                      <span style={{ fontSize: '.75rem', color: '#78f275', fontWeight: 700 }}>Status: Credited Successfully</span>
                      <strong style={{ fontSize: '.85rem', color: '#78f275' }}>+ ₹{claim.cashbackAmount}</strong>
                    </div>
                  ) : isPendingCompliance ? (
                    // Section 194R compliance interactive tracker
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', background: 'rgba(0,0,0,0.2)', padding: '.85rem', borderRadius: '12px', border: '1px solid var(--bdr2)' }}>
                      <div 
                        onClick={() => setSelectedTrackerId(selectedTrackerId === claim.id ? null : claim.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: '.75rem', color: 'var(--g4)', fontWeight: 800 }}>
                          {selectedTrackerId === claim.id ? '▼ Hide Verification Steps' : '▶ Track Release Progress'}
                        </span>
                        <span style={{ fontSize: '.72rem', color: 'var(--t3)' }}>
                          Est. Release: 24 hrs
                        </span>
                      </div>

                      {(selectedTrackerId === claim.id || selectedTrackerId === null) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem', marginTop: '.4rem', borderLeft: '1.5px dashed var(--bdr)', paddingLeft: '1rem', marginLeft: '.5rem' }}>
                          {getTimelineStages(claim.complianceStatus).map((stage, idx) => (
                            <div key={idx} style={{ position: 'relative', display: 'flex', gap: '.6rem', alignItems: 'start' }}>
                              {/* Step dot */}
                              <div style={{ 
                                position: 'absolute', left: '-1.35rem', top: '.2rem',
                                width: '.75rem', height: '.75rem', borderRadius: '50%',
                                background: stage.done ? '#78f275' : stage.active ? 'var(--g4)' : 'var(--bg4)',
                                border: stage.active ? '1.5px solid #fff' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: stage.active ? '0 0 8px var(--g4)' : 'none'
                              }}>
                                {stage.done && <span style={{ fontSize: '.5rem', color: '#000', fontWeight: 900 }}>✓</span>}
                              </div>

                              <div style={{ flex: 1 }}>
                                <p style={{ 
                                  fontSize: '.75rem', 
                                  fontWeight: 800, 
                                  color: stage.done ? '#fff' : stage.active ? 'var(--g4)' : 'var(--t3)',
                                  margin: 0 
                                }}>
                                  {stage.name}
                                </p>
                                <p style={{ fontSize: '.65rem', color: 'var(--t3)', margin: '1px 0 0 0' }}>
                                  {stage.desc}
                                </p>
                                
                                {stage.action && (
                                  <button
                                    onClick={() => navigate(`/rewards/detail/${reward.id}`)}
                                    className="btn btn-primary btn-sm"
                                    style={{ width: 'auto', padding: '.25rem .75rem', fontSize: '.65rem', marginTop: '.4rem', height: 'auto', background: 'linear-gradient(135deg, #d4a574, #c41e3a)' }}
                                  >
                                    Submit KYC Documents
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Normal active reward code display
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                      
                      {/* Code Area */}
                      <div style={{ display: 'flex', background: 'var(--inp)', border: '1.5px solid var(--bdr2)', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ flex: 1, padding: '.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '.9rem', fontFamily: 'var(--fm)', color: 'var(--g4)', fontWeight: 800 }}>{claim.voucherCode}</span>
                        </div>
                        {claim.status === 'active' && (
                          <button 
                            onClick={() => handleCopyCode(claim.voucherCode)}
                            style={{ padding: '0 1rem', background: 'var(--bg3)', border: 'none', borderLeft: '1.5px solid var(--bdr2)', color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Copy code"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>content_copy</span>
                          </button>
                        )}
                      </div>

                      {claim.status === 'active' && (
                        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.25rem' }}>
                          <button
                            onClick={() => handleUseNow(claim)}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 2, background: 'linear-gradient(135deg, #d4a574, #c41e3a)' }}
                          >
                            {isPartner ? 'Use on Partner Portal' : 'Mark as Used'}
                          </button>
                          <button
                            onClick={() => navigate(`/rewards/detail/${reward.id}`)}
                            className="btn btn-ghost btn-sm"
                            style={{ flex: 1 }}
                          >
                            View Terms
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {/* TRANSACTION LOG FOR ARCHIVED / REJECTED REWARDS */}
                  {claim.status === 'used' && !isPendingCompliance && !isRejected && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.68rem', color: 'var(--t3)', marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid var(--bdr)' }}>
                      <span>Status: Used / Redeemed</span>
                      <span>Verified: {claim.usedAt ? new Date(claim.usedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  )}

                  {isRejected && (
                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '.65rem .85rem', marginTop: '.5rem', fontSize: '.7rem' }}>
                      <p style={{ color: '#ef4444', fontWeight: 800, margin: 0 }}>❌ Compliance Rejected &amp; Refunded</p>
                      <p style={{ color: 'var(--t3)', margin: '.2rem 0 0 0' }}>
                        Reason: {claim.complianceNotes || 'KYC verification failed.'}
                      </p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
