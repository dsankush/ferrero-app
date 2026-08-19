import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

export const RaiseIssueModal = ({ invoice, onClose, onSuccess }) => {
  const { user, createSupportTicket, showToast } = useAppContext();

  const [category, setCategory] = useState(invoice ? 'wrong_upload' : 'claim_issue');
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoice_number || invoice?.id || '');
  const [subject, setSubject] = useState(invoice ? `Discrepancy in Bill #${invoice.invoice_number || invoice.id}` : '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'wrong_upload', label: 'Wrong Bill / Invoice Upload', icon: 'receipt_long' },
    { id: 'claim_issue', label: 'Points / Reward Claim Issue', icon: 'featured_seasonal_and_gifts' },
    { id: 'stock_issue', label: 'Stock / Delivery Discrepancy', icon: 'inventory_2' },
    { id: 'payment_issue', label: 'Payout / Cashback Issue', icon: 'account_balance_wallet' },
    { id: 'other', label: 'General Query / Other Concern', icon: 'help_center' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast?.('Please describe your concern', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createSupportTicket({
        category,
        subject: subject.trim() || `${category.replace('_', ' ').toUpperCase()} ticket`,
        description: description.trim(),
        invoice_number: invoiceNumber.trim() || null,
        priority,
        retailer_name: user?.name || 'Retailer Partner',
        shop_name: user?.shop || user?.shop_name || 'Retailer Store',
        retailer_phone: user?.phone || '9876543210',
        assigned_to: invoice?.wholesaler_name || 'Gupta Ferrero Rocher Wholesaler (Sub-DB)',
        senior_rep: 'Rajesh Sharma (Area Sales Manager - ASM)'
      });

      showToast?.(`✅ Ticket #${ticket.ticket_id} created! Ferrero Helpdesk will call you.`, 'success');
      onSuccess?.(ticket);
      onClose();
    } catch (err) {
      showToast?.(`❌ Failed to submit ticket: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2100,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg1)',
        border: '2px solid var(--g4)',
        borderRadius: 'var(--r16)',
        width: '100%',
        maxWidth: '460px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '1.4rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--bdr2)', paddingBottom: '.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{
              width: '2.4rem',
              height: '2.4rem',
              borderRadius: '.6rem',
              background: 'linear-gradient(135deg, #c41e3a, #d4a574)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.3rem' }}>support_agent</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>Raise Concern / Ticket</h3>
              <p style={{ fontSize: '.7rem', color: 'var(--t3)', margin: 0 }}>Direct escalations to Ferrero Territory Team</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--bdr)',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
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

        {/* Quick Call Representative Bar */}
        <div style={{
          background: 'rgba(212,165,116,0.08)',
          border: '1px solid var(--bdr2)',
          borderRadius: 'var(--r12)',
          padding: '.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Need Urgent Help?</p>
            <p style={{ fontSize: '.65rem', color: 'var(--t3)', margin: 0 }}>Call Ferrero Sub-DB Hotline</p>
          </div>
          <a
            href="tel:+919876543210"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              padding: '.45rem .85rem',
              borderRadius: '9999px',
              fontSize: '.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '.3rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '.95rem' }}>call</span>
            Call Rep
          </a>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          {/* Category selection */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', display: 'block', marginBottom: '.35rem' }}>
              Issue Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '.4rem' }}>
              {categories.map(c => {
                const isSel = category === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.6rem',
                      padding: '.6rem .8rem',
                      background: isSel ? 'rgba(212,165,116,0.15)' : 'var(--bg2)',
                      border: isSel ? '1.5px solid var(--g4)' : '1px solid var(--bdr)',
                      borderRadius: 'var(--r8)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: isSel ? 'var(--g4)' : 'var(--t3)' }}>
                      {c.icon}
                    </span>
                    <span style={{ fontSize: '.78rem', fontWeight: isSel ? 800 : 600, color: isSel ? 'var(--t1)' : 'var(--t2)' }}>
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference Invoice */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', display: 'block', marginBottom: '.35rem' }}>
              Invoice / Bill Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. INV-8842 or Bill # from Sub-DB"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--inp)',
                border: '1.5px solid var(--bdr2)',
                borderRadius: 'var(--r8)',
                color: 'var(--t1)',
                fontSize: '.82rem',
                padding: '.6rem .75rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Subject */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', display: 'block', marginBottom: '.35rem' }}>
              Subject
            </label>
            <input
              type="text"
              placeholder="Brief summary of the concern"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--inp)',
                border: '1.5px solid var(--bdr2)',
                borderRadius: 'var(--r8)',
                color: 'var(--t1)',
                fontSize: '.82rem',
                padding: '.6rem .75rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', display: 'block', marginBottom: '.35rem' }}>
              Describe the Issue *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Sub-DB uploaded invoice with 20 boxes instead of 10 boxes, or points for monthly target were not reflected..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--inp)',
                border: '1.5px solid var(--bdr2)',
                borderRadius: 'var(--r8)',
                color: 'var(--t1)',
                fontSize: '.82rem',
                padding: '.6rem .75rem',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', display: 'block', marginBottom: '.35rem' }}>
              Urgency / Priority
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem' }}>
              {['Low', 'Medium', 'High'].map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    padding: '.45rem',
                    borderRadius: 'var(--r8)',
                    border: priority === p ? '1.5px solid var(--g4)' : '1px solid var(--bdr)',
                    background: priority === p ? 'rgba(212,165,116,0.15)' : 'var(--bg2)',
                    color: priority === p ? 'var(--t1)' : 'var(--t3)',
                    fontSize: '.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '.6rem', marginTop: '.4rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '.65rem',
                background: 'var(--bg3)',
                border: '1px solid var(--bdr)',
                borderRadius: 'var(--r8)',
                color: 'var(--t1)',
                fontSize: '.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1.5,
                padding: '.65rem',
                background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
                border: 'none',
                borderRadius: 'var(--r8)',
                color: '#fff',
                fontSize: '.8rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '.3rem',
                boxShadow: '0 4px 12px rgba(212,165,116,0.3)'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
