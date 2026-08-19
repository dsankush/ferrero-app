import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

const SubDBContext = createContext();

export const useSubDB = () => {
  const ctx = useContext(SubDBContext);
  if (!ctx) throw new Error('useSubDB must be used inside SubDBProvider');
  return ctx;
};

// ─── Local storage helpers ────────────────────────────────────────────────────
const STORAGE_KEY = 'subdb_session';

const loadSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch { return null; }
};

const saveSession = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
};

const clearSession = () => localStorage.removeItem(STORAGE_KEY);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const SubDBProvider = ({ children }) => {
  const [subUser, setSubUserState] = useState(() => loadSession());
  const [invoices, setInvoices] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const setSubUser = (user) => {
    setSubUserState(user);
    if (user) saveSession(user);
    else clearSession();
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Mock OTP ──────────────────────────────────────────────────────────────
  const MOCK_OTP = '1234'; // match the existing app's demo OTP

  const sendOTP = async (phone) => {
    console.log(`[SubDB] Demo OTP for ${phone}: ${MOCK_OTP}`);
    return { success: true };
  };

  const verifyOTP = (phone, otp) => {
    // Accept 1234 (matching existing app) OR any 4-digit code for demo
    return otp === MOCK_OTP || otp.length === 4;
  };

  // ─── Login / Register — with robust fallback ───────────────────────────────
  const loginOrRegister = async (phone) => {
    // Always try Supabase first, but NEVER fail — always fall back gracefully
    if (isSupabaseConfigured) {
      try {
        const { data: existing, error: fetchErr } = await supabase
          .from('subdb_users')
          .select('*')
          .eq('phone', phone)
          .maybeSingle();

        if (fetchErr) {
          // Table might not exist yet — use local session
          console.warn('[SubDB] subdb_users query failed:', fetchErr.message, '— using local mode');
          return _localLogin(phone);
        }

        if (existing) {
          const userWithFlag = { ...existing, is_new: false };
          setSubUser(userWithFlag);
          return { user: userWithFlag, isNew: false };
        }

        // New user — create record
        const { data: created, error: insertErr } = await supabase
          .from('subdb_users')
          .insert([{ phone }])
          .select()
          .single();

        if (insertErr) {
          console.warn('[SubDB] Insert failed:', insertErr.message, '— using local mode');
          return _localLogin(phone, true);
        }

        const newUser = { ...created, is_new: true };
        setSubUser(newUser);
        return { user: newUser, isNew: true };

      } catch (err) {
        console.warn('[SubDB] Supabase error:', err.message, '— using local mode');
        return _localLogin(phone, true);
      }
    }

    return _localLogin(phone);
  };

  // Local-only session (Supabase unavailable or table missing)
  const _localLogin = (phone, forceNew = false) => {
    const existing = loadSession();
    const isNew = forceNew || !existing?.name;
    const user = existing?.phone === phone
      ? { ...existing, is_new: isNew }
      : { id: `local-${Date.now()}`, phone, name: null, emp_id: null, is_new: true };
    setSubUser(user);
    return { user, isNew: !user.name };
  };

  // ─── Save EMP profile ─────────────────────────────────────────────────────
  const saveProfile = async (profileData) => {
    const updatedUser = { ...subUser, ...profileData, is_new: false };

    if (isSupabaseConfigured && subUser?.id && !subUser.id.startsWith('local-')) {
      try {
        const { data, error } = await supabase
          .from('subdb_users')
          .update({ ...profileData, updated_at: new Date().toISOString() })
          .eq('id', subUser.id)
          .select()
          .single();
        if (!error && data) {
          setSubUser({ ...data, is_new: false });
          return data;
        }
      } catch (err) {
        console.warn('[SubDB] Profile save to DB failed:', err.message);
      }
    }

    // Local fallback
    setSubUser(updatedUser);
    return updatedUser;
  };

  // ─── Standard Ferrero Product Dictionary for auto-matching ────────────────
  const FERRERO_CATALOG = [
    { code: 'FR-48', name: 'Ferrero Rocher 48 pieces', cat: 'Rocher', unit: 'Box', buy: 300, sell: 450, earn: 15 },
    { code: 'FR-16', name: 'Ferrero Rocher 16 pieces', cat: 'Rocher', unit: 'Box', buy: 110, sell: 165, earn: 5.5 },
    { code: 'FR-8', name: 'Ferrero Rocher 8 pieces', cat: 'Rocher', unit: 'Pack', buy: 60, sell: 90, earn: 3 },
    { code: 'FR-1', name: 'Ferrero Rocher Single', cat: 'Rocher', unit: 'Piece', buy: 15, sell: 25, earn: 1 },
    { code: 'GG-42', name: 'Golden Gallery 42 pieces', cat: 'Golden Gallery', unit: 'Box', buy: 250, sell: 375, earn: 12.5 },
    { code: 'GG-18', name: 'Golden Gallery 18 pieces', cat: 'Golden Gallery', unit: 'Box', buy: 120, sell: 180, earn: 6 },
    { code: 'RAF-42', name: 'Raffaello 42 pieces', cat: 'Raffaello', unit: 'Box', buy: 280, sell: 420, earn: 14 },
    { code: 'RAF-20', name: 'Raffaello 20 pieces', cat: 'Raffaello', unit: 'Box', buy: 145, sell: 220, earn: 7.5 },
    { code: 'RND-42', name: 'Rondnoir 42 pieces', cat: 'Rondnoir', unit: 'Box', buy: 280, sell: 420, earn: 14 },
    { code: 'RND-20', name: 'Rondnoir 20 pieces', cat: 'Rondnoir', unit: 'Box', buy: 145, sell: 220, earn: 7.5 },
    { code: 'HNT-BOX', name: 'Hazelnut Specialty Box', cat: 'Hazelnut', unit: 'Box', buy: 320, sell: 480, earn: 16 },
    { code: 'HNT-TRU', name: 'Hazelnut Truffle Pieces', cat: 'Hazelnut', unit: 'Pack', buy: 80, sell: 120, earn: 4 },
    { code: 'PREM-BOX', name: 'Premium Assortment Box', cat: 'Assortment', unit: 'Box', buy: 400, sell: 600, earn: 20 },
    { code: 'GIFT-SET', name: 'Holiday Gift Set', cat: 'Gift Set', unit: 'Box', buy: 500, sell: 750, earn: 25 }
  ];

  // ─── Load retailers ───────────────────────────────────────────────────────
  const loadRetailers = async () => {
    const demoRetailers = [
      { id: '9900000001', shop: 'Kumar Sweet House', name: 'Ramesh Kumar', loc: 'Khetgaon, MP' },
      { id: '9900000002', shop: 'Patel Gift Store', name: 'Sunita Patel', loc: 'Dewas, MP' },
      { id: '9900000003', shop: 'Sharma Confectionery', name: 'Mohan Sharma', loc: 'Ratlam, MP' },
      { id: '9900000004', shop: 'Verma Premium Gifts', name: 'Anil Verma', loc: 'Sehore, MP' },
      { id: '9900000005', shop: 'Singh Luxury Sweets', name: 'Kavita Singh', loc: 'Mandsaur, MP' },
    ];

    if (!isSupabaseConfigured) { setRetailers(demoRetailers); return; }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, shop, loc, phone')
        .eq('role', 'retailer')
        .order('shop');
      if (data && data.length > 0) setRetailers(data);
      else setRetailers(demoRetailers);
    } catch {
      setRetailers(demoRetailers);
    }
  };

  // ─── Load invoices ─────────────────────────────────────────────────────────
  const loadInvoices = async () => {
    if (!subUser?.id) return;

    if (!isSupabaseConfigured || subUser.id.startsWith('local-')) {
      try {
        const stored = localStorage.getItem('subdb_invoices');
        if (stored) setInvoices(JSON.parse(stored));
      } catch { }
      return;
    }

    try {
      const { data } = await supabase
        .from('subdb_invoices')
        .select('*')
        .eq('submitted_by', subUser.id)
        .order('created_at', { ascending: false });
      if (data) setInvoices(data);
    } catch (err) {
      console.warn('[SubDB] Invoice load failed:', err.message);
    }
  };

  // ─── Submit invoice & Update Retailer Stock + Ledger ───────────────────────
  const submitInvoice = async (invoiceData) => {
    setLoading(true);
    try {
      const payload = {
        submitted_by: subUser?.id?.startsWith('local-') ? null : subUser?.id,
        retailer_name: invoiceData.retailer_name,
        retailer_id: invoiceData.retailer_id || null,
        wholesaler_name: invoiceData.wholesaler_name,
        purchase_date: invoiceData.purchase_date,
        invoice_number: invoiceData.invoice_number,
        products: invoiceData.products,
        total_amount: invoiceData.total_amount,
        raw_ocr_text: invoiceData.raw_ocr_text || null,
        scan_confidence: invoiceData.confidence || null,
        status: 'verified'
      };

      let saved = { ...payload, id: `inv-${Date.now()}`, created_at: new Date().toISOString() };

      // 1. SAVE INVOICE IN SUPABASE
      if (isSupabaseConfigured && !subUser?.id?.startsWith('local-')) {
        try {
          const { data, error } = await supabase
            .from('subdb_invoices')
            .insert([payload])
            .select()
            .single();
          if (!error && data) saved = data;
        } catch (err) {
          console.warn('[SubDB] Invoice insert failed:', err.message);
        }
      }

      // Always update local SubDB invoice store
      const updatedInvoices = [saved, ...invoices];
      setInvoices(updatedInvoices);
      try { localStorage.setItem('subdb_invoices', JSON.stringify(updatedInvoices)); } catch { }

      // 2. DIRECTLY CREDIT RETAILER'S INVENTORY STOCK
      if (invoiceData.retailer_id && invoiceData.products?.length > 0) {
        await creditRetailerInventory(invoiceData.retailer_id, invoiceData.products, invoiceData.wholesaler_name, invoiceData.invoice_number, invoiceData.total_amount);
      }

      // 3. ADVANCE RETAILER MONTHLY RESTOCK TARGETS
      if (invoiceData.retailer_id && invoiceData.products?.length > 0) {
        await updateMonthlyTargets(invoiceData.retailer_id, invoiceData.products);
      }

      showToast(`✅ Bill submitted! Stock credited to ${invoiceData.retailer_name}`, 'success');
      return saved;
    } catch (err) {
      showToast('❌ Submit failed: ' + err.message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ─── Credit Retailer Inventory Stock & Write Transaction Entry ─────────────
  const creditRetailerInventory = async (retailerId, products, wholesalerName, invoiceNo, totalAmount) => {
    const totalUnits = products.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

    // A. SUPABASE INVENTORY UPDATE
    if (isSupabaseConfigured) {
      try {
        // Fetch current retailer inventory
        const { data: dbInv } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', retailerId);

        for (const item of products) {
          if (!item.name || !item.qty) continue;
          const cleanName = item.name.toLowerCase();
          const matchedCatalog = FERRERO_CATALOG.find(c => cleanName.includes(c.name.toLowerCase().split(' ')[0]) || cleanName.includes(c.cat.toLowerCase())) || FERRERO_CATALOG[0];

          const existing = dbInv?.find(i => 
            i.name.toLowerCase() === item.name.toLowerCase() || 
            (matchedCatalog && i.code === matchedCatalog.code)
          );

          if (existing) {
            // Increment quantity
            const newQty = Number(existing.qty || 0) + Number(item.qty);
            await supabase
              .from('inventory')
              .update({ qty: newQty, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
          } else {
            // Insert new SKU for retailer
            const buyPrice = Number(item.price) || matchedCatalog.buy;
            const sellPrice = Math.round(buyPrice * 1.5);
            const earn = sellPrice - buyPrice;

            await supabase
              .from('inventory')
              .insert([{
                user_id: retailerId,
                code: matchedCatalog.code || `FR-${Date.now().toString().slice(-4)}`,
                name: item.name,
                cat: matchedCatalog.cat || 'Rocher',
                unit: item.unit || matchedCatalog.unit || 'Box',
                qty: Number(item.qty),
                buy: buyPrice,
                sell: sellPrice,
                earn: earn,
                mfg: '2024-06',
                exp: '2027-05',
                business_cat: 'rocher'
              }]);
          }
        }

        // B. RECORD PURCHASE TRANSACTION FOR RETAILER
        await supabase.from('transactions').insert([{
          user_id: retailerId,
          type: 'purchase',
          label: wholesalerName || 'Ferrero Sub-DB Restock',
          sub: `Invoice #${invoiceNo || 'INV-' + Date.now().toString().slice(-4)} · ${products.length} products (Sub-DB Verified)`,
          amt: '+₹' + Number(totalAmount || 0).toLocaleString('en-IN'),
          clr: '#d4af37',
          icon: 'local_shipping'
        }]);

        // C. NOTIFY RETAILER
        await supabase.from('notifications').insert([{
          user_id: retailerId,
          title: '📦 Stock Restocked by Sub-DB Rep!',
          body: `Invoice #${invoiceNo || 'NEW'} verified. Added ${totalUnits} units (₹${Number(totalAmount || 0).toLocaleString('en-IN')}) to your inventory.`,
          role: 'retailer',
          type: 'notification',
          is_read: false
        }]);

        console.log(`✅ Stock and purchase ledger successfully updated for retailer: ${retailerId}`);
      } catch (err) {
        console.warn('[SubDB] Supabase stock credit failed:', err.message);
      }
    }

    // D. LOCAL STORAGE FALLBACK SYNC
    try {
      const storedInv = JSON.parse(localStorage.getItem('counterOS_inventory') || '[]');
      const updatedLocalInv = [...storedInv];

      products.forEach(item => {
        if (!item.name || !item.qty) return;
        const cleanName = item.name.toLowerCase();
        const matched = FERRERO_CATALOG.find(c => cleanName.includes(c.name.toLowerCase().split(' ')[0])) || FERRERO_CATALOG[0];

        const matchIdx = updatedLocalInv.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase() || i.code === matched.code);
        if (matchIdx >= 0) {
          updatedLocalInv[matchIdx] = {
            ...updatedLocalInv[matchIdx],
            qty: Number(updatedLocalInv[matchIdx].qty || 0) + Number(item.qty)
          };
        } else {
          const buyPrice = Number(item.price) || matched.buy;
          updatedLocalInv.push({
            id: Date.now() + Math.random(),
            code: matched.code,
            name: item.name,
            cat: matched.cat,
            unit: item.unit || 'Box',
            qty: Number(item.qty),
            buy: buyPrice,
            sell: Math.round(buyPrice * 1.5),
            earn: Math.round(buyPrice * 0.5),
            businessCat: 'rocher'
          });
        }
      });

      localStorage.setItem('counterOS_inventory', JSON.stringify(updatedLocalInv));

      // Append transaction
      const storedTxns = JSON.parse(localStorage.getItem('counterOS_transactions') || '[]');
      const newTxn = {
        id: Date.now(),
        type: 'purchase',
        label: wholesalerName || 'Ferrero Sub-DB Restock',
        sub: `Invoice #${invoiceNo || 'INV-' + Date.now().toString().slice(-4)} · ${products.length} products (Sub-DB Verified)`,
        amt: '+₹' + Number(totalAmount || 0).toLocaleString('en-IN'),
        clr: '#d4af37',
        icon: 'local_shipping',
        date: 'Just now'
      };
      localStorage.setItem('counterOS_transactions', JSON.stringify([newTxn, ...storedTxns]));

      // Append notification
      const storedNotifs = JSON.parse(localStorage.getItem('counterOS_notifications') || '[]');
      const newNotif = {
        id: Date.now(),
        title: '📦 Stock Restocked by Sub-DB Rep!',
        body: `Invoice #${invoiceNo || 'NEW'} verified. Added ${totalUnits} units (₹${Number(totalAmount || 0).toLocaleString('en-IN')}) to your inventory.`,
        role: 'retailer',
        isRead: false,
        time: 'Just now'
      };
      localStorage.setItem('counterOS_notifications', JSON.stringify([newNotif, ...storedNotifs]));

    } catch (localErr) {
      console.warn('[SubDB] Local storage sync failed:', localErr);
    }
  };

  // ─── Update retailer monthly targets ─────────────────────────────────────
  const updateMonthlyTargets = async (retailerId, products) => {
    const FERRERO_KW = ['ferrero', 'rocher', 'raffaello', 'rondnoir', 'golden gallery', 'hazelnut'];
    const ferreroProds = products.filter(p =>
      FERRERO_KW.some(kw => (p.name || '').toLowerCase().includes(kw))
    );
    const totalQty = ferreroProds.length > 0 
      ? ferreroProds.reduce((s, p) => s + (Number(p.qty) || 0), 0)
      : products.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    const totalAmt = products.reduce((s, p) => s + (Number(p.total) || Number(p.price) * Number(p.qty) || 0), 0);

    if (isSupabaseConfigured) {
      try {
        const { data: targets } = await supabase
          .from('retailer_monthly_targets')
          .select('*')
          .eq('user_id', retailerId)
          .neq('status', 'claimed');

        if (targets && targets.length > 0) {
          for (const target of targets) {
            const titleL = (target.title || '').toLowerCase();
            let increment = 0;
            if (titleL.includes('restock') || titleL.includes('carton') || titleL.includes('stock') || titleL.includes('box') || titleL.includes('sales')) {
              increment = totalQty;
            } else if (titleL.includes('commission') || titleL.includes('earning') || target.unit === '₹') {
              increment = Math.round(totalAmt * 0.05);
            }
            if (increment <= 0) continue;

            const newVal = Math.min(Number(target.target_value), Number(target.current_value) + increment);
            const newStatus = newVal >= Number(target.target_value) ? 'completed' : 'in_progress';

            await supabase
              .from('retailer_monthly_targets')
              .update({ current_value: newVal, status: newStatus, updated_at: new Date().toISOString() })
              .eq('id', target.id);
          }
        }
      } catch (err) {
        console.warn('[SubDB] Monthly target update failed:', err.message);
      }
    }

    // Local target update
    try {
      const storedTargets = JSON.parse(localStorage.getItem('counterOS_monthlyTargets') || '[]');
      if (storedTargets.length > 0) {
        const updated = storedTargets.map(target => {
          if (target.status === 'claimed') return target;
          const titleL = (target.title || '').toLowerCase();
          let increment = 0;
          if (titleL.includes('restock') || titleL.includes('carton') || titleL.includes('stock') || titleL.includes('box') || titleL.includes('sales')) {
            increment = totalQty;
          } else if (titleL.includes('commission') || titleL.includes('earning') || target.unit === '₹') {
            increment = Math.round(totalAmt * 0.05);
          }
          if (increment <= 0) return target;

          const newVal = Math.min(Number(target.target_value), Number(target.current_value) + increment);
          const newStatus = newVal >= Number(target.target_value) ? 'completed' : 'in_progress';
          return { ...target, current_value: newVal, status: newStatus };
        });
        localStorage.setItem('counterOS_monthlyTargets', JSON.stringify(updated));
      }
    } catch { }
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = () => {
    setSubUser(null);
    setInvoices([]);
    clearSession();
  };

  useEffect(() => {
    if (subUser?.id) {
      loadRetailers();
      loadInvoices();
    }
  }, [subUser?.id]);

  return (
    <SubDBContext.Provider value={{
      subUser, invoices, retailers, loading, toast,
      sendOTP, verifyOTP, loginOrRegister, saveProfile, logout,
      submitInvoice, loadInvoices, showToast
    }}>
      {children}
    </SubDBContext.Provider>
  );
};
