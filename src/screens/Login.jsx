import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input, OtpInput } from '../components/ui/Input';
import { showToast } from '../components/ui/Toast';
import { useAppContext } from '../context/AppContext';
import { Chip } from '../components/ui/Chip';

export const Login = () => {
  const navigate = useNavigate();
  const { user, setUser, loginUser } = useAppContext();
  const [step, setStep] = useState(0);
  const [isNewUser, setIsNewUser] = useState(true);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const handleRoleSelect = (selectedRole) => {
    if (selectedRole === 'subdb') {
      navigate('/subdb_platform/login');
      return;
    }
    setUser(prev => ({ ...prev, role: selectedRole }));
    setStep(1);
  };

  const handleUserTypeSelect = (isNew) => {
    setIsNewUser(isNew);
    setStep(2);
  };

  const handleSendOTP = () => {
    if (phone.length < 10 && phone !== '') {
      showToast('⚠️ Enter 10-digit mobile number');
      return;
    }
    const ph = phone || '9876543210';
    setPhone(ph);
    setUser(prev => ({ ...prev, phone: ph }));
    setStep(3);
    showToast('📱 OTP sent! Demo: 1234');
  };

  const handleVerifyOTP = async () => {
    if (otp === '1234' || otp.length === 4) {
      const role = 'retailer';
      
      try {
        showToast('⏳ Authenticating...');
        await loginUser(phone || '9876543210', role, isNewUser);
        
        showToast('✅ Verified!');
        sessionStorage.setItem('counterOS_tab_role', role);
        
        setTimeout(() => {
          if (isNewUser) {
            navigate('/setup/shop');
          } else {
            navigate('/home');
          }
        }, 500);
      } catch (e) {
        console.error('❌ Login Error in Login.jsx:', e);
        showToast('❌ Login failed. Trying local mode...');
        // Fallback
        sessionStorage.setItem('counterOS_tab_role', role);
        setUser(prev => ({
          ...prev,
          phone: phone || '9876543210',
          name: 'Ramesh Kumar',
          shop: 'Kumar Sweet House',
          loc: 'Khetgaon, MP',
          role: role
        }));
        setTimeout(() => {
          if (isNewUser) {
            navigate('/setup/shop');
          } else {
            navigate('/home');
          }
        }, 500);
      }
    } else {
      showToast('❌ Wrong OTP. Use: 1234');
      setOtp('');
    }
  };

  return (
    <div className="screen active" id="s-login">
      {/* Dynamic Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(212,165,116,.15), transparent), radial-gradient(ellipse 60% 40% at 85% 85%, rgba(255,208,96,.1), transparent)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '38px 38px', pointerEvents: 'none' }}></div>
      
      <div className="scroller" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
        
        {/* Premium Graphic Header */}
        <div style={{ position: 'relative', paddingTop: '4rem', paddingBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* The Floating Boxes properly constrained within a Hero Container */}
            <div className="au" style={{ position: 'relative', width: '280px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                
                {/* Generated 3D Illustration */}
                <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 5s ease-in-out infinite' }}>
                    <img src="/auth_hero.png" alt="CounterOS Vision" style={{ width: '85%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(212,165,116,0.4))' }} />
                </div>

                {/* Floating Card Left: Properly Bound */}
                <div className="afloat2 d1" style={{ position: 'absolute', left: '-20px', top: '10%', background: 'rgba(11,6,4,.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,165,116,.3)', borderRadius: 'var(--r12)', padding: '.75rem', display: 'flex', alignItems: 'center', gap: '.6rem', boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}>
                  <div style={{ width: '2.2rem', height: '2.2rem', background: 'rgba(212,165,116,.15)', borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined fi" style={{ fontSize: '1.2rem', color: 'var(--g4)' }}>account_balance_wallet</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '.65rem', color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Cashback</p>
                    <p style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '1rem', color: 'var(--g4)' }}>+₹1,180</p>
                  </div>
                </div>

                {/* Floating Card Right: Properly Bound */}
                <div className="afloat d2" style={{ position: 'absolute', right: '-15px', bottom: '15%', background: 'rgba(11,6,4,.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,208,96,.3)', borderRadius: 'var(--r12)', padding: '.75rem', display: 'flex', alignItems: 'center', gap: '.6rem', boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}>
                  <div style={{ width: '2.2rem', height: '2.2rem', background: 'rgba(255,208,96,.15)', borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined fi" style={{ fontSize: '1.2rem', color: 'var(--o4)' }}>storefront</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '.65rem', color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Rewards</p>
                    <p style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '1rem', color: 'var(--o4)' }}>+₹356</p>
                  </div>
                </div>
            </div>

            <div className="au d2" style={{ textAlign: 'center', marginTop: '1rem' }}>
              <h1 style={{ fontFamily: 'var(--fd)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.1 }}>Counter<span className="gtext">OS</span></h1>
              <p style={{ fontSize: '.8rem', color: 'var(--t2)', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, marginTop: '.4rem' }}>Retailer Intelligence</p>
              <p style={{ fontSize: '1.1rem', color: 'var(--g4)', fontWeight: 800, marginTop: '.6rem', fontStyle: 'italic', textShadow: '0 0 10px rgba(212,165,116,0.3)' }}>"Scan karo, inaam pao"</p>
            </div>
            
            <div className="au d3" style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '1.25rem' }}>
              <Chip variant="g">Dual Earning</Chip>
              <Chip variant="o">AI Invoicing</Chip>
            </div>
        </div>

        {/* Login form Glass Panel */}
        <div className="au d4 login-panel">
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.5rem', letterSpacing: '-.02em', color: 'var(--t1)' }}>Choose Your Role</p>
              <p style={{ fontSize: '.85rem', color: 'var(--t3)', marginBottom: '2rem', lineHeight: 1.5 }}>Select how you want to use CounterOS today.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div 
                  onClick={() => handleRoleSelect('retailer')}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bdr2)', padding: '1.5rem', borderRadius: 'var(--r12)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,165,116,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined fi" style={{ color: 'var(--g4)', fontSize: '1.5rem' }}>storefront</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--t1)' }}>I am a Retailer</p>
                    <p style={{ fontSize: '.8rem', color: 'var(--t3)' }}>Sweet shop / Kirana store owner</p>
                  </div>
                </div>

                <div 
                  onClick={() => handleRoleSelect('subdb')}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bdr2)', padding: '1.5rem', borderRadius: 'var(--r12)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,165,116,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined fi" style={{ color: 'var(--g4)', fontSize: '1.5rem' }}>document_scanner</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--t1)' }}>I am a Sub-DB Representative</p>
                    <p style={{ fontSize: '.8rem', color: 'var(--t3)' }}>Ferrero field rep · Upload retailer bills</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/dashboard')}
                  style={{ background: 'rgba(212,165,116,0.06)', border: '1.5px solid #d4a574', padding: '1.5rem', borderRadius: 'var(--r12)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined fi" style={{ color: '#fff', fontSize: '1.5rem' }}>analytics</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--g4)' }}>Company Executive Portal</p>
                    <p style={{ fontSize: '.8rem', color: 'var(--t2)' }}>Desktop analytics, Sub-DB &amp; ASM hierarchy</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <button onClick={() => setStep(0)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '.3rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span> Back
              </button>
              
              <p style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.5rem', letterSpacing: '-.02em', color: 'var(--t1)' }}>Welcome to CounterOS</p>
              <p style={{ fontSize: '.85rem', color: 'var(--t3)', marginBottom: '2rem', lineHeight: 1.5 }}>Are you setting up a new account or logging into an existing one?</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div 
                  onClick={() => handleUserTypeSelect(true)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bdr2)', padding: '1.5rem', borderRadius: 'var(--r12)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,165,116,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined fi" style={{ color: 'var(--g4)', fontSize: '1.5rem' }}>person_add</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--t1)' }}>New User</p>
                    <p style={{ fontSize: '.8rem', color: 'var(--t3)' }}>Create a new account</p>
                  </div>
                </div>

                <div 
                  onClick={() => handleUserTypeSelect(false)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bdr2)', padding: '1.5rem', borderRadius: 'var(--r12)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ width: '3rem', height: '3rem', background: 'rgba(255,208,96,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined fi" style={{ color: 'var(--o4)', fontSize: '1.5rem' }}>login</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--t1)' }}>Existing User</p>
                    <p style={{ fontSize: '.8rem', color: 'var(--t3)' }}>Login to dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <button onClick={() => setStep(1)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '.3rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span> Back
              </button>
              
              <p style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.5rem', letterSpacing: '-.02em', color: 'var(--t1)' }}>{isNewUser ? 'Get Started' : 'Welcome Back'}</p>
              <p style={{ fontSize: '.85rem', color: 'var(--t3)', marginBottom: '1.5rem', lineHeight: 1.5 }}>Enter your mobile number to securely sign in.</p>

              <div style={{ display: 'flex', alignItems: 'stretch', gap: '.6rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'var(--inp)', border: '1.5px solid var(--bdr2)', borderRadius: 'var(--r8)', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--t2)' }}>
                      🇮🇳 <span style={{ fontSize: '.9rem' }}>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength="10"
                    placeholder="Enter Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ flex: 1, background: 'var(--inp)', border: '1.5px solid var(--bdr2)', borderRadius: 'var(--r8)', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--fm)', outline: 'none' }}
                  />
              </div>

              <div style={{ marginTop: 'auto' }}>
                  <Button onClick={handleSendOTP} style={{ padding: '1rem', fontSize: '1rem', borderRadius: 'var(--r12)' }}>
                    Continue securely <span className="material-symbols-outlined fi">arrow_right_alt</span>
                  </Button>
              </div>
            </div>
          )}
          
          {step === 3 && (
             <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <button onClick={() => setStep(2)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '.3rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span> Back
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', textAlign: 'center' }}>
                  <div style={{ width: '4rem', height: '4rem', background: 'rgba(212,165,116,.1)', border: '1px solid rgba(212,165,116,.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <span className="material-symbols-outlined fi" style={{ color: 'var(--g4)', fontSize: '2rem' }}>phonelink_ring</span>
                  </div>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--t1)', marginBottom: '.3rem' }}>Verify your number</p>
                  <p style={{ fontSize: '.85rem', color: 'var(--t3)' }}>We've sent a 4-digit OTP to <strong style={{ color: 'var(--g4)' }}>+91 {phone}</strong></p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <OtpInput length={4} value={otp} onChange={setOtp} />
              </div>
              
              <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--t3)', marginBottom: '2rem' }}>Developer Demo: <strong style={{ color: 'var(--g4)', fontFamily: 'var(--fm)', fontSize: '.9rem' }}>1234</strong></p>
              
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                  <Button onClick={handleVerifyOTP} style={{ padding: '1rem', fontSize: '1rem', borderRadius: 'var(--r12)' }}>
                    Verify & Proceed <span className="material-symbols-outlined fi">verified</span>
                  </Button>
                  <button onClick={() => setStep(2)} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--bdr2)', color: 'var(--t2)', fontSize: '.85rem', cursor: 'pointer', width: '100%', textAlign: 'center', fontWeight: 700, padding: '1rem', borderRadius: 'var(--r12)' }}>
                      Edit mobile number
                  </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
