import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { useAppContext } from '../context/AppContext';
import { AppLayout } from '../components/layout/AppLayout';
import { RaiseIssueModal } from '../components/modals/RaiseIssueModal';

export const Settings = () => {
    const { user, theme, toggleTheme, supportTickets } = useAppContext();
    const [showRaiseIssue, setShowRaiseIssue] = useState(false);

    const myTickets = Array.isArray(supportTickets) ? supportTickets : [];

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

                    {/* DEDICATED SUPPORT, CALLING & GRIEVANCES PANEL */}
                    <div className="au" style={{ background: 'var(--bg2)', border: '1.5px solid var(--bdr2)', borderRadius: 'var(--r12)', padding: '1.1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '.8rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>Helpdesk &amp; Escalations</h4>
                            <span style={{ fontSize: '.68rem', color: 'var(--g4)', fontWeight: 800 }}>Ferrero Support</span>
                        </div>

                        {/* Call Representative & Raise Concern Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '1rem' }}>
                            <a
                                href="tel:+919876543210"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))',
                                    border: '1.5px solid #10b981',
                                    borderRadius: 'var(--r12)',
                                    padding: '.85rem .6rem',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '.3rem',
                                    textAlign: 'center'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: '#10b981' }}>call</span>
                                <span style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--t1)' }}>Call Rep</span>
                                <span style={{ fontSize: '.62rem', color: 'var(--t3)' }}>Sub-DB Distributor</span>
                            </a>

                            <div
                                onClick={() => setShowRaiseIssue(true)}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(212,165,116,0.08))',
                                    border: '1.5px solid #ef4444',
                                    borderRadius: 'var(--r12)',
                                    padding: '.85rem .6rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '.3rem',
                                    textAlign: 'center'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: '#ef4444' }}>report_problem</span>
                                <span style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--t1)' }}>Raise Issue</span>
                                <span style={{ fontSize: '.62rem', color: 'var(--t3)' }}>Wrong upload / claim</span>
                            </div>
                        </div>

                        {/* Recent Raised Tickets */}
                        {myTickets.length > 0 && (
                            <div>
                                <p style={{ fontSize: '.7rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 .5rem 0' }}>
                                    My Tickets ({myTickets.length})
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                                    {myTickets.slice(0, 3).map((t, idx) => (
                                        <div key={idx} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 'var(--r8)', padding: '.6rem .75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>#{t.ticket_id} · {t.subject}</p>
                                                <p style={{ fontSize: '.62rem', color: 'var(--t3)', margin: '.1rem 0 0 0' }}>{t.category?.replace('_', ' ').toUpperCase()} · {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'}</p>
                                            </div>
                                            <span style={{
                                                fontSize: '.6rem',
                                                fontWeight: 800,
                                                color: t.status === 'Resolved' ? '#10b981' : '#d4a574',
                                                background: t.status === 'Resolved' ? 'rgba(16,185,129,0.12)' : 'rgba(212,165,116,0.15)',
                                                border: `1px solid ${t.status === 'Resolved' ? '#10b981' : '#d4a574'}`,
                                                padding: '.15rem .45rem',
                                                borderRadius: '9999px'
                                            }}>
                                                {t.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

                        <div style={{ padding: '1.1rem', cursor: 'pointer' }} onClick={() => window.location.href='/'}>
                            <span style={{ fontWeight: 600, fontSize: '.9rem', color: '#ef4444' }}>Log Out</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Raise Concern / Dispute Modal */}
            {showRaiseIssue && (
                <RaiseIssueModal
                    onClose={() => setShowRaiseIssue(false)}
                />
            )}
        </AppLayout>
    );
};
