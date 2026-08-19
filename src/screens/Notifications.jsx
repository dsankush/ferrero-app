import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { useAppContext } from '../context/AppContext';

export const Notifications = () => {
  const navigate = useNavigate();
  const { user, notifications, setNotifications, FERRERO_THEME } = useAppContext();

  const myNotifs = notifications.filter(n => n.role === user.role);

  // Mark as read on mount
  useEffect(() => {
    const hasUnread = myNotifs.some(n => !n.isRead);
    if (hasUnread) {
      setNotifications(prev => prev.map(n =>
        n.role === user.role ? { ...n, isRead: true } : n
      ));
    }
  }, [myNotifs, setNotifications, user.role]);

  const getCampaignIcon = (offerType) => {
    switch(offerType) {
      case 'commission': return '💰';
      case 'discount': return '🔥';
      case 'combo': return '🎁';
      case 'cashback': return '💳';
      default: return '⭐';
    }
  };

  return (
    <div className="screen active">
      <Header title="Notifications" backTo="/home" />

      <div className="scroller" style={{ padding: '1rem', paddingBottom: '6rem' }}>
        {myNotifs.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--t3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>notifications_off</span>
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myNotifs.map(n => {
              const isCampaign = n.type === 'campaign' || n.offerType;
              const icon = isCampaign ? getCampaignIcon(n.offerType) : '📢';

              return (
                <div
                  key={n.id}
                  style={{
                    background: isCampaign ? `linear-gradient(135deg, rgba(212,165,116,.08), rgba(196,30,58,.05))` : 'var(--bg2)',
                    padding: '1.2rem',
                    borderRadius: 'var(--r12)',
                    border: isCampaign ? `1px solid rgba(212,165,116,.2)` : '1px solid var(--bdr)',
                    cursor: isCampaign ? 'pointer' : 'default',
                    transition: 'all .2s',
                    position: 'relative'
                  }}
                  onClick={() => {
                    if (isCampaign && n.campaignId) {
                      // Campaign clicked
                    }
                  }}
                  onMouseOver={e => {
                    if (isCampaign) {
                      e.currentTarget.style.borderColor = 'rgba(212,165,116,.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={e => {
                    if (isCampaign) {
                      e.currentTarget.style.borderColor = 'rgba(212,165,116,.2)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flex: 1 }}>
                      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                      <div>
                        <h4 style={{ fontSize: '.95rem', fontWeight: 800, color: 'var(--t1)' }}>{n.title}</h4>
                        {n.timestamp && <p style={{ fontSize: '.7rem', color: 'var(--t3)', marginTop: '.2rem' }}>{n.timestamp}</p>}
                      </div>
                    </div>
                    {!n.isRead && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: FERRERO_THEME.secondary, flexShrink: 0, marginTop: '.3rem' }}></span>
                    )}
                  </div>
                  <p style={{ fontSize: '.85rem', color: 'var(--t2)', lineHeight: 1.5, marginLeft: '2.4rem' }}>{n.body}</p>

                  {isCampaign && (
                    <div style={{ marginTop: '1rem', marginLeft: '2.4rem', paddingTop: '1rem', borderTop: '1px solid rgba(212,165,116,.1)' }}>
                      <button
                        style={{
                          background: `linear-gradient(135deg, ${FERRERO_THEME.primary}, ${FERRERO_THEME.secondary})`,
                          color: '#fff',
                          border: 'none',
                          padding: '.6rem 1rem',
                          borderRadius: '8px',
                          fontSize: '.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all .2s'
                        }}
                        onMouseOver={e => {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.boxShadow = '0 4px 12px rgba(212,165,116,.3)';
                        }}
                        onMouseOut={e => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        View Offer →
                      </button>
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
