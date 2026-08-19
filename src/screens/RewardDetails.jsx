import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { showToast } from '../components/ui/Toast';

export const RewardDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rewardsCatalog, pointCredits, redeemReward, kycDoc, submitKYC, user } = useAppContext();
  
  const [showCalculator, setShowCalculator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find the selected reward in the catalog
  const reward = rewardsCatalog.find(r => r.id.toString() === id.toString());

  // Form states for KYC
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [retailerName, setRetailerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [idProofName, setIdProofName] = useState('');
  const [taxDeclApproved, setTaxDeclApproved] = useState(false);

  // Initialize form states when kycDoc or user changes
  useEffect(() => {
    if (kycDoc) {
      setPanNumber(kycDoc.pan_number || '');
      setGstNumber(kycDoc.gst_number || '');
      setRetailerName(kycDoc.retailer_name || user?.name || '');
      setMobileNumber(kycDoc.mobile_number || user?.phone || '');
      setAddress(kycDoc.address || user?.loc || '');
      setIdProofName(kycDoc.id_proof_url ? 'kyc_proof_uploaded.pdf' : '');
    } else if (user?.pan_number) {
      setPanNumber(user.pan_number || '');
      setGstNumber(user.gst_number || '');
      setRetailerName(user?.name || '');
      setMobileNumber(user?.phone || '');
      setAddress(user?.loc || '');
      setIdProofName('profile_onboarded_kyc.pdf');
      setTaxDeclApproved(true);
    } else {
      setRetailerName(user?.name || '');
      setMobileNumber(user?.phone || '');
      setAddress(user?.loc || '');
    }
  }, [kycDoc, user]);

  if (!reward) {
    return (
      <div className="screen active" style={{ background: 'var(--bg0)' }}>
        <Header title="Reward Details" backTo="/rewards" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', padding: '2rem' }}>
          <p style={{ color: 'var(--t3)', marginBottom: '1.5rem' }}>Reward not found in store.</p>
          <button onClick={() => navigate('/rewards')} className="btn btn-ghost" style={{ width: 'auto' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const is194r = reward.is_194r_applicable === true || 
                 String(reward.is_194r_applicable).toLowerCase() === 'yes' ||
                 (Number(reward.reward_value) >= 20000);

  const tdsPercent = is194r ? Number(reward.tds_percentage || 10) : 0;
  const tdsAmt = is194r ? Number(reward.tds_amount || (reward.reward_value * tdsPercent / 100)) : 0;
  const netBenefitVal = is194r ? (reward.reward_value - tdsAmt) : reward.reward_value;

  const userHasEnoughPoints = pointCredits >= reward.points_required;
  const remainingPoints = Math.max(0, pointCredits - reward.points_required);

  const isKycComplete = Boolean((kycDoc && kycDoc.pan_number) || user?.pan_number || user?.is_kyc_verified);

  const handleOpenCalculator = () => {
    if (!userHasEnoughPoints) {
      showToast('❌ Insufficient points balance for this reward', 'error');
      return;
    }
    setShowCalculator(true);
  };

  const handleConfirmRedeem = async () => {
    if (isSubmitting) return;

    let kycPayload = null;
    if (!isKycComplete) {
      if (!panNumber || panNumber.trim().length !== 10) {
        showToast('⚠️ Please enter a valid 10-character PAN number', 'error');
        return;
      }
      if (!retailerName || retailerName.trim() === '') {
        showToast('⚠️ Please enter your Retailer Name', 'error');
        return;
      }
      if (!mobileNumber || mobileNumber.trim() === '') {
        showToast('⚠️ Please enter your Mobile Number', 'error');
        return;
      }
      if (!address || address.trim() === '') {
        showToast('⚠️ Please enter your Shop Address', 'error');
        return;
      }
      if (!idProofName) {
        showToast('⚠️ Please upload a simulated Identity Proof', 'error');
        return;
      }
      if (!taxDeclApproved) {
        showToast('⚠️ Please check the declaration checkbox', 'error');
        return;
      }

      kycPayload = {
        pan_number: panNumber.toUpperCase(),
        gst_number: gstNumber ? gstNumber.toUpperCase() : null,
        retailer_name: retailerName,
        mobile_number: mobileNumber,
        address: address,
        id_proof_url: idProofName
      };
    }

    setIsSubmitting(true);
    
    try {
      const result = await redeemReward(reward, kycPayload);
      if (result) {
        navigate('/rewards/success', { 
          state: { 
            rewardName: reward.title,
            pointsUsed: reward.points_required,
            remainingPoints: result.remainingPoints,
            voucherCode: result.voucherCode,
            redemptionId: result.id,
            rewardType: reward.reward_type,
            cashbackAmount: result.cashbackAmount,
            is194r: is194r,
            complianceStatus: result.complianceStatus || 'Approved'
          } 
        });
      }
    } catch (e) {
      console.error(e);
      showToast('❌ Redemption failed. Try again.', 'error');
    } finally {
      setIsSubmitting(false);
      setShowCalculator(false);
    }
  };

  const handleSimulateUpload = () => {
    setIdProofName('pan_card_doc.pdf');
    showToast('📎 Simulated file upload success!');
  };

  return (
    <div className="screen active" style={{ background: 'var(--bg0)' }}>
      <Header title="Reward Details" backTo="/rewards" />

      <div className="scroller" style={{ padding: '1.25rem', paddingBottom: '7rem' }}>
        
        <div className="au d1" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r16)', padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ 
            width: '4.5rem', height: '4.5rem', 
            background: 'rgba(212,165,116,0.12)', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '2.5rem', margin: '0 auto 1.25rem' 
          }}>
            {reward.category === 'cashback' ? '💳' : reward.category === 'gift_card' ? '🎁' : reward.category === 'travel' ? '✈️' : reward.category === 'electronics' ? '📱' : '🎟️'}
          </div>
          <span style={{ fontSize: '.75rem', fontWeight: 900, color: 'var(--g4)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>
            {reward.partner_name || reward.category}
          </span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', margin: '0 0 .5rem 0', lineHeight: 1.3 }}>
            {reward.title}
          </h2>
          <p style={{ fontSize: '.85rem', color: 'var(--t3)', lineHeight: 1.5, margin: 0 }}>
            {reward.description}
          </p>

          {is194r && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(212,165,116,0.12)', border: '1px solid #d4a574', padding: '.3rem .6rem', borderRadius: '8px', marginTop: '1rem', fontSize: '.75rem', color: 'var(--g4)', fontWeight: 800 }}>
              <span>📋 Section 194R Regulated (10% TDS)</span>
            </div>
          )}
        </div>

        <div className="au d2" style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.8rem 1rem', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)' }}>
            <span style={{ fontSize: '.8rem', color: 'var(--t3)' }}>Reward Type</span>
            <span style={{ fontSize: '.8rem', fontWeight: 800, color: 'var(--t1)', textTransform: 'capitalize' }}>{reward.reward_type}</span>
          </div>
          {is194r && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.8rem 1rem', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)' }}>
              <span style={{ fontSize: '.8rem', color: 'var(--t3)' }}>Est. Market Value</span>
              <span style={{ fontSize: '.8rem', fontWeight: 800, color: 'var(--t1)' }}>₹{Number(reward.reward_value).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.8rem 1rem', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)' }}>
            <span style={{ fontSize: '.8rem', color: 'var(--t3)' }}>Validity</span>
            <span style={{ fontSize: '.8rem', fontWeight: 800, color: 'var(--t1)' }}>{reward.validity_days || 90} days after claim</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.8rem 1rem', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)' }}>
            <span style={{ fontSize: '.8rem', color: 'var(--t3)' }}>KYC Status</span>
            <span style={{ fontSize: '.8rem', fontWeight: 800, color: isKycComplete ? '#10b981' : '#ffd060' }}>
              {isKycComplete ? '✓ Verified (Instant Claim)' : '⚡ Setup on First Claim'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem', background: 'var(--bg1)', borderTop: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div>
          <p style={{ fontSize: '.65rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700 }}>Your Points</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--t1)' }}>{pointCredits.toLocaleString('en-IN')} pts</p>
        </div>

        {userHasEnoughPoints ? (
          <button
            onClick={handleOpenCalculator}
            className="btn btn-primary"
            style={{ width: 'auto', padding: '1rem 2.2rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)' }}
          >
            Redeem Now
          </button>
        ) : (
          <button
            disabled
            className="btn btn-ghost"
            style={{ width: 'auto', padding: '1rem 2.2rem', opacity: 0.5, cursor: 'not-allowed' }}
          >
            Need {(reward.points_required - pointCredits).toLocaleString('en-IN')} more pts
          </button>
        )}
      </div>

      {showCalculator && (
        <div className="buddy-panel" onClick={() => !isSubmitting && setShowCalculator(false)}>
          <div className="buddy-content" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem 1.25rem', background: '#1d120d', borderTop: '2.5px solid var(--g4)', borderRadius: '20px 20px 0 0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--g4)', margin: 0 }}>
                  🧾 Claim Reward
                </h3>
                <p style={{ fontSize: '.72rem', color: 'var(--t3)', margin: '.2rem 0 0 0' }}>
                  {isKycComplete ? 'Direct 1-Click Instant Redemption' : '1-Time KYC Setup Required'}
                </p>
              </div>
              <button disabled={isSubmitting} onClick={() => setShowCalculator(false)} style={{ background: 'transparent', border: 'none', color: 'var(--t3)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', marginBottom: '1.25rem', background: 'var(--bg3)', padding: '1.1rem', borderRadius: '16px', border: '1px solid var(--bdr)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem' }}>
                <span style={{ color: 'var(--t3)' }}>Current Points</span>
                <span style={{ fontWeight: 700 }}>{pointCredits.toLocaleString('en-IN')} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem', color: '#ef4444' }}>
                <span>Reward Cost</span>
                <span style={{ fontWeight: 800 }}>- {reward.points_required.toLocaleString('en-IN')} pts</span>
              </div>
              <div style={{ height: '1px', background: 'var(--bdr2)', margin: '.1rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900 }}>
                <span style={{ color: 'var(--g4)' }}>Remaining Balance</span>
                <span style={{ color: 'var(--g4)', fontFamily: 'var(--fd)' }}>{remainingPoints.toLocaleString('en-IN')} pts</span>
              </div>
            </div>

            {is194r && (
              <div style={{ background: 'rgba(212,165,116,0.05)', border: '1px solid rgba(212,165,116,0.3)', borderRadius: '16px', padding: '1.1rem', marginBottom: '1.25rem' }}>
                <h4 style={{ color: 'var(--g4)', fontWeight: 800, fontSize: '.88rem', marginBottom: '.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚖️ Section 194R TDS Benefit</span>
                </h4>
                <p style={{ fontSize: '.72rem', color: 'var(--t2)', lineHeight: 1.4, marginBottom: '.75rem' }}>
                  TDS @ 10% is calculated on wholesale perquisites. Your voucher code will be issued directly without delay.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', fontSize: '.78rem', background: 'rgba(0,0,0,0.2)', padding: '.75rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--t3)' }}>Est. Reward Value</span>
                    <strong style={{ color: '#fff' }}>₹{Number(reward.reward_value).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                    <span>TDS Deducted (10%)</span>
                    <strong>₹{tdsAmt.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ height: '1px', background: 'var(--bdr2)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 800 }}>
                    <span>Net Value</span>
                    <span>₹{netBenefitVal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              {isKycComplete ? (
                <div style={{ background: 'rgba(16,185,129,.08)', border: '1.5px solid #10b981', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '2rem' }}>verified_user</span>
                  <div>
                    <h4 style={{ fontSize: '.85rem', fontWeight: 800, color: '#fff', margin: 0 }}>Verified KYC Linked</h4>
                    <p style={{ fontSize: '.72rem', color: 'var(--t3)', margin: '.15rem 0 0 0' }}>
                      PAN: <strong style={{ color: 'var(--g4)' }}>{kycDoc?.pan_number || user?.pan_number}</strong> ({kycDoc?.retailer_name || user?.name})
                    </p>
                    <p style={{ fontSize: '.65rem', color: '#10b981', margin: '.2rem 0 0 0', fontWeight: 700 }}>
                      ⚡ 1-Click Instant Voucher Release Enabled
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--bdr)', borderRadius: '16px', padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ background: 'rgba(212,165,116,0.1)', border: '1px solid #d4a574', borderRadius: '10px', padding: '.75rem', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--g4)', margin: 0 }}>⚡ 1-Time KYC Setup Required</p>
                    <p style={{ fontSize: '.68rem', color: 'var(--t2)', margin: '.25rem 0 0 0', lineHeight: 1.4 }}>
                      Since KYC is not mandatory during signup, please enter your PAN once now. It will be <strong>permanently saved</strong> to your profile for all future instant redemptions!
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                    <div>
                      <label style={{ fontSize: '.7rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '.3rem' }}>PAN Number *</label>
                      <input 
                        type="text" 
                        maxLength="10"
                        placeholder="ABCDE1234F"
                        value={panNumber}
                        onChange={e => setPanNumber(e.target.value.toUpperCase())}
                        style={{ width: '100%', background: 'var(--inp)', border: '1.5px solid var(--bdr2)', borderRadius: '8px', padding: '.65rem .8rem', color: '#fff', fontSize: '.85rem', outline: 'none', textTransform: 'uppercase' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '.7rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '.3rem' }}>Retailer / Legal Name *</label>
                      <input 
                        type="text" 
                        placeholder="Ramesh Kumar"
                        value={retailerName}
                        onChange={e => setRetailerName(e.target.value)}
                        style={{ width: '100%', background: 'var(--inp)', border: '1.5px solid var(--bdr2)', borderRadius: '8px', padding: '.65rem .8rem', color: '#fff', fontSize: '.85rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '.7rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '.3rem' }}>Mobile Number *</label>
                      <input 
                        type="tel" 
                        placeholder="9900000001"
                        value={mobileNumber}
                        onChange={e => setMobileNumber(e.target.value)}
                        style={{ width: '100%', background: 'var(--inp)', border: '1.5px solid var(--bdr2)', borderRadius: '8px', padding: '.65rem .8rem', color: '#fff', fontSize: '.85rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '.7rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '.3rem' }}>Shop Address *</label>
                      <textarea 
                        placeholder="Shop No. 12, Main Market, Khetgaon, MP"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        rows="2"
                        style={{ width: '100%', background: 'var(--inp)', border: '1.5px solid var(--bdr2)', borderRadius: '8px', padding: '.65rem .8rem', color: '#fff', fontSize: '.85rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '.7rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '.3rem' }}>Identity Proof (PAN Card / Aadhaar) *</label>
                      <div 
                        onClick={handleSimulateUpload}
                        style={{ border: '1.5px dashed var(--bdr)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', padding: '1rem', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}
                      >
                        <span className="material-symbols-outlined" style={{ color: 'var(--g4)', fontSize: '1.8rem' }}>
                          {idProofName ? 'file_present' : 'cloud_upload'}
                        </span>
                        <span style={{ fontSize: '.75rem', fontWeight: 700, color: idProofName ? '#10b981' : 'var(--t2)' }}>
                          {idProofName ? idProofName : 'Click to Upload Identity Proof'}
                        </span>
                        <span style={{ fontSize: '.62rem', color: 'var(--t3)' }}>PDF, JPG, PNG (Max 5MB)</span>
                      </div>
                    </div>

                    <label style={{ display: 'flex', gap: '.5rem', alignItems: 'start', cursor: 'pointer', userSelect: 'none', marginTop: '.4rem' }}>
                      <input 
                        type="checkbox" 
                        checked={taxDeclApproved} 
                        onChange={e => setTaxDeclApproved(e.target.checked)}
                        style={{ marginTop: '.15rem', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '.72rem', color: 'var(--t2)', lineHeight: 1.4 }}>
                        I declare that the details provided are correct and I authorize the deduction of points and TDS filing as per Income Tax regulations.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '.8rem', marginTop: '1rem' }}>
              <button
                onClick={() => setShowCalculator(false)}
                disabled={isSubmitting}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ flex: 2, background: 'linear-gradient(135deg, #d4a574, #c41e3a)' }}
              >
                {isSubmitting 
                  ? 'Processing...' 
                  : !isKycComplete
                  ? 'Save KYC & Redeem'
                  : 'Confirm & Redeem (Instant Voucher)'}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};
