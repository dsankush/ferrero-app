import React from 'react';
import { useAppContext } from '../../context/AppContext';

export const NotificationDrawer = ({ isOpen, onClose, onSelectInvoice }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppContext();

  if (!isOpen) return null;

  const notifList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notifList.filter(n => !n.isRead && !n.is_read).length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1.25rem 1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg1)',
        border: '2px solid var(--g4)',
        borderRadius: 'var(--r16)',
        width: '100%',
        maxWidth: '440px',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.9)',
        position: 'relative',
        animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.25rem',
          borderBottom: '1px solid var(--bdr2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(212,165,116,0.06), rgba(196,30,58,0.03))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🔔</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '.65rem',
                    fontWeight: 900,
                    color: '#fff',
                    background: '#c41e3a',
                    padding: '.15rem .45rem',
                    borderRadius: '9999px'
                  }}>
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: 0 }}>Restock updates, monthly targets & bonus points</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--g4)',
                  fontSize: '.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '.2rem .4rem'
                }}
              >
                Mark Read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg3)',
                border: '1px solid var(--bdr)',
                borderRadius: '50%',
                width: '1.8rem',
                height: '1.8rem',
                color: 'var(--t1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '.6rem',
          flex: 1
        }}>
          {notifList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--t3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', opacity: 0.5, marginBottom: '.5rem' }}>
                notifications_off
              </span>
              <p style={{ fontSize: '.85rem', fontWeight: 700, margin: 0 }}>No notifications yet</p>
              <p style={{ fontSize: '.72rem', margin: '.25rem 0 0 0' }}>You will receive instant alerts when Sub-DB delivers stock.</p>
            </div>
          ) : (
            notifList.map((notif, idx) => {
              const isUnread = !notif.isRead && !notif.is_read;
              const isInvoice = notif.title?.includes('Restock') || notif.title?.includes('Invoice') || notif.type === 'invoice';

              let icon = 'notifications';
              let iconClr = 'var(--g4)';
              if (isInvoice) { icon = 'receipt_long'; iconClr = '#10b981'; }
              if (notif.title?.includes('Target') || notif.title?.includes('Goal')) { icon = 'target'; iconClr = '#d4a574'; }
              if (notif.title?.includes('Reward') || notif.title?.includes('Points')) { icon = 'emoji_events'; iconClr = '#c41e3a'; }

              return (
                <div
                  key={notif.id || idx}
                  onClick={() => {
                    markNotificationAsRead?.(notif.id);
                    if (isInvoice && onSelectInvoice) {
                      onClose();
                      onSelectInvoice(notif.invoiceData || {
                        invoice_number: notif.body?.match(/#([A-Za-z0-9-]+)/)?.[1] || 'INV-RESTOCK',
                        total_amount: notif.body?.match(/₹([0-9,]+)/)?.[1]?.replace(/,/g, '') || 5000,
                        created_at: notif.created_at || notif.time,
                        wholesaler_name: 'Ferrero Sub-DB Representative',
                        products: [
                          { name: 'Ferrero Rocher T24 (Pack of 24)', qty: 5, unit: 'Box', price: 950, total: 4750 },
                          { name: 'Kinder Joy T1 for Boys', qty: 2, unit: 'Outer', price: 720, total: 1440 }
                        ]
                      });
                    }
                  }}
                  style={{
                    background: isUnread ? 'rgba(212,165,116,0.08)' : 'var(--bg2)',
                    border: isUnread ? '1.5px solid var(--g4)' : '1px solid var(--bdr)',
                    borderRadius: 'var(--r12)',
                    padding: '.85rem',
                    display: 'flex',
                    gap: '.75rem',
                    alignItems: 'flex-start',
                    cursor: isInvoice ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '2.2rem',
                    height: '2.2rem',
                    borderRadius: '.5rem',
                    background: `${iconClr}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: iconClr }}>
                      {icon}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.2rem' }}>
                      <h4 style={{ fontSize: '.82rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--g4)' }} />
                      )}
                    </div>
                    <p style={{ fontSize: '.72rem', color: 'var(--t2)', margin: 0, lineHeight: 1.4 }}>
                      {notif.body || notif.message}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.4rem' }}>
                      <span style={{ fontSize: '.62rem', color: 'var(--t3)', fontWeight: 600 }}>
                        {notif.time || (notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now')}
                      </span>
                      {isInvoice && (
                        <span style={{ fontSize: '.68rem', color: 'var(--g4)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          View Bill Breakdown →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
