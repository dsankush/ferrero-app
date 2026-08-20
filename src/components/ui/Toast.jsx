import React, { useEffect, useState } from 'react';

// A simple global toast event system
export const showToast = (message, type = 'info') => {
  if (!message) return;
  const event = new CustomEvent('show-toast', { detail: { message, type } });
  window.dispatchEvent(event);
};

export const Toast = () => {
  const [toastData, setToastData] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer;
    const handleToast = (e) => {
      const msg = typeof e.detail === 'string' ? e.detail : e.detail?.message || '';
      const type = e.detail?.type || (msg.includes('❌') || msg.includes('⚠️') ? 'error' : 'success');
      
      setToastData({ message: msg, type });
      setShow(false);
      
      setTimeout(() => {
        setShow(true);
      }, 20);
      
      clearTimeout(timer);
      timer = setTimeout(() => {
        setShow(false);
      }, 4000);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  if (!toastData) return null;

  const isError = toastData.type === 'error' || toastData.message?.includes('❌') || toastData.message?.includes('⚠️');
  const isSuccess = toastData.type === 'success' || toastData.message?.includes('✅') || toastData.message?.includes('🎉');

  return (
    <div 
      id="toast" 
      className={show ? 'show' : ''}
      style={{
        position: 'fixed',
        bottom: '5.5rem',
        left: '50%',
        transform: show ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        background: isError ? '#230e0e' : '#1e140d',
        border: `1.5px solid ${isError ? '#ef4444' : isSuccess ? '#10b981' : '#d4a574'}`,
        color: '#fff',
        padding: '.85rem 1.15rem',
        borderRadius: '14px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.75)',
        zIndex: 99999,
        maxWidth: '440px',
        width: 'calc(100% - 2.5rem)',
        pointerEvents: show ? 'auto' : 'none',
        opacity: show ? 1 : 0,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '.8rem',
        lineHeight: 1.45,
        wordBreak: 'break-word',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        width: '2rem',
        height: '2rem',
        borderRadius: '8px',
        background: isError ? 'rgba(239,68,68,0.2)' : isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(212,165,116,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '.1rem'
      }}>
        <span className="material-symbols-outlined" style={{ 
          fontSize: '1.2rem', 
          color: isError ? '#ef4444' : isSuccess ? '#10b981' : '#d4a574' 
        }}>
          {isError ? 'warning' : isSuccess ? 'check_circle' : 'notifications'}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '.82rem',
          fontWeight: 700,
          color: '#fff',
          margin: 0,
          lineHeight: 1.45
        }}>
          {toastData.message}
        </p>
      </div>
      <button 
        onClick={() => setShow(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
          padding: '.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
      </button>
    </div>
  );
};
