import React from 'react';
import { Header } from '../components/layout/Header';
import { useAppContext } from '../context/AppContext';
import { AppLayout } from '../components/layout/AppLayout';

export const Settings = () => {
    const { user, theme, toggleTheme } = useAppContext();

    return (
        <AppLayout>
            <div className="screen active">
                <Header title="Settings" />
                <div className="scroller" style={{ padding: '1.25rem' }}>
                    <div className="au" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'var(--g5)', color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {user.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{user.name}</h3>
                            <p style={{ fontSize: '.75rem', color: 'var(--t2)', marginTop: '2px' }}>{user.shop}</p>
                            <p style={{ fontSize: '.7rem', color: 'var(--g4)', fontWeight: 700, marginTop: '4px' }}>+91 {user.phone}</p>
                        </div>
                        {user.pan_number ? (
                            <span style={{ fontSize: '.65rem', fontWeight: 800, background: 'rgba(16,185,129,.15)', border: '1px solid #10b981', color: '#10b981', padding: '.25rem .6rem', borderRadius: '9999px' }}>
                                ✓ KYC Verified
                            </span>
                        ) : (
                            <span style={{ fontSize: '.65rem', fontWeight: 800, background: 'rgba(212,165,116,.15)', border: '1px solid #d4a574', color: 'var(--g4)', padding: '.25rem .6rem', borderRadius: '9999px' }}>
                                ⚡ KYC on Claim
                            </span>
                        )}
                    </div>

                    {/* KYC DETAILS PANEL */}
                    <div className="au" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.6rem' }}>
                            <h4 style={{ fontSize: '.8rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>KYC &amp; Section 194R Compliance</h4>
                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: user.pan_number ? '#10b981' : 'var(--t3)' }}>
                                {user.pan_number ? 'verified_user' : 'shield'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', padding: '.4rem 0', borderBottom: '1px solid var(--bdr2)' }}>
                            <span style={{ color: 'var(--t2)' }}>PAN Number</span>
                            <strong style={{ color: user.pan_number ? 'var(--g4)' : 'var(--t3)', letterSpacing: '.05em' }}>
                                {user.pan_number || 'Saved upon 1st reward claim'}
                            </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', padding: '.4rem 0' }}>
                            <span style={{ color: 'var(--t2)' }}>Redemption Speed</span>
                            <span style={{ color: user.pan_number ? '#10b981' : 'var(--g4)', fontWeight: 700 }}>
                                {user.pan_number ? '⚡ Instant 1-Click Voucher Release' : '⚡ 1-Time KYC on 1st Claim'}
                            </span>
                        </div>
                    </div>

                    <div className="au" style={{ animationDelay: '.05s', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', overflow: 'hidden' }}>
                        <div style={{ padding: '1.1rem', borderBottom: '1px solid var(--bdr)' }}>
                            <h4 style={{ fontSize: '.8rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>Preferences</h4>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--t2)' }}>{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                                    <span style={{ fontWeight: 600, fontSize: '.9rem' }}>Dark Mode</span>
                                </div>
                                <div style={{ width: '40px', height: '22px', background: theme === 'dark' ? 'var(--g4)' : 'var(--bg3)', borderRadius: '9999px', position: 'relative', cursor: 'pointer' }} onClick={toggleTheme}>
                                    <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: theme === 'dark' ? '20px' : '2px', transition: 'left .2s' }}></div>
                                </div>
                            </div>
                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--t2)' }}>notifications</span>
                                    <span style={{ fontWeight: 600, fontSize: '.9rem' }}>Push Notifications</span>
                                </div>
                                <div style={{ width: '40px', height: '22px', background: 'var(--g4)', borderRadius: '9999px', position: 'relative' }}>
                                    <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: '20px' }}></div>
                                </div>
                            </div>
                        </div>

                         <div style={{ padding: '1.1rem', borderBottom: '1px solid var(--bdr)' }}>
                            <h4 style={{ fontSize: '.8rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>Support</h4>
                            {['Help Center', 'Chat with us', 'Terms & Privacy'].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: idx !== 2 ? '1rem' : 0, cursor: 'pointer' }}>
                                    <span style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--t1)' }}>{item}</span>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--t3)', fontSize: '1.1rem' }}>chevron_right</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '1.1rem', cursor: 'pointer' }} onClick={() => window.location.href='/'}>
                            <span style={{ fontWeight: 600, fontSize: '.9rem', color: '#ef4444' }}>Log Out</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};
