import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { useAppContext } from '../context/AppContext';
import { Input } from '../components/ui/Input';
import { ProductIcon } from '../components/ui/ProductIcon';

export const Inventory = () => {
  const navigate = useNavigate();
  const { inventory, user, isSeeding } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const categories = ['all', ...new Set(inventory.map(p => p.cat))];
  
  const filtered = inventory.filter(p => {
    const mSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.cat.toLowerCase().includes(search.toLowerCase());
    const mFilter = filter === 'all' || p.cat === filter;
    return mSearch && mFilter;
  });

  return (
    <AppLayout>
      <div className="screen active">
        <Header 
          title="Stock Ledger" 
          subtitle={`${filtered.length}/${inventory.length} products · ${user.cat ? `🏷️ ${user.cat}` : 'All categories'}`}
        />
        
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--bdr)', background: 'var(--bg0)' }}>
           <Input 
             placeholder="Search items, brands, categories..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
             wrapperStyle={{ background: 'var(--inp)', border: '1.5px solid var(--bdr2)', borderRadius: 'var(--r8)', display: 'flex' }}
             prefix={<span className="material-symbols-outlined" style={{ color: 'var(--t3)', alignSelf: 'center', marginLeft: '.5rem', fontSize: '1.1rem' }}>search</span>}
             style={{ border: 'none', background: 'transparent' }}
           />
           
           <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '2px', marginTop: '.8rem', scrollbarWidth: 'none' }}>
              {categories.map((c) => (
                <button 
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`ifbtn ${filter === c ? 'act' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {c}
                </button>
              ))}
           </div>

           {/* Sub-DB Verified Stock Badge */}
           <div style={{
             marginTop: '.8rem', padding: '.5rem .8rem',
             background: 'rgba(212,165,116,0.06)', border: '1px solid rgba(212,165,116,0.2)',
             borderRadius: 'var(--r8)', display: 'flex', alignItems: 'center', gap: '.4rem'
           }}>
             <span className="material-symbols-outlined fi" style={{ fontSize: '.95rem', color: 'var(--g4)' }}>verified</span>
             <span style={{ fontSize: '.68rem', color: 'var(--t2)', fontWeight: 600 }}>
               Stock is automatically verified &amp; credited by your Sub-DB representative
             </span>
           </div>
        </div>

        <div className="scroller" style={{ padding: '1.25rem' }}>
          {isSeeding ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <span className="material-symbols-outlined aspin" style={{ fontSize: '3rem', color: 'var(--g4)' }}>sync</span>
              <p style={{ fontWeight: 800, marginTop: '1rem', fontSize: '1.1rem' }}>Loading Stock Ledger...</p>
              <p style={{ color: 'var(--t3)', fontSize: '.75rem', marginTop: '.4rem' }}>Syncing inventory records</p>
            </div>
          ) : !filtered.length ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--t3)' }}>inventory_2</span>
              <p style={{ color: 'var(--t2)', marginTop: '.75rem', fontWeight: 700 }}>No products in stock yet.</p>
              <p style={{ color: 'var(--t3)', fontSize: '.75rem', marginTop: '.3rem', lineHeight: 1.5 }}>
                Your stock will automatically update whenever your Ferrero Sub-DB representative scans and uploads physical bills.
              </p>
            </div>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', paddingBottom: '2rem' }}>
                {filtered.map((p, i) => (
                   <div key={p.id} className="au" style={{ animationDelay: `${i * .04}s`, background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r12)', padding: '.85rem .95rem', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
                      <div style={{ width: '2.8rem', height: '2.8rem', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         <ProductIcon product={p} fontSize="1.25rem" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                         <p style={{ fontWeight: 800, fontSize: '.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', flexWrap: 'wrap', marginTop: '.18rem' }}>
                            <span style={{ fontSize: '.62rem', padding: '.1rem .42rem', background: 'var(--bg3)', borderRadius: '9999px', color: 'var(--t2)' }}>{p.cat}</span>
                            <span style={{ fontSize: '.62rem', color: 'var(--t3)' }}>{p.unit}</span>
                            <span style={{ fontSize: '.62rem', color: p.qty < 5 ? '#ef4444' : 'var(--t3)' }}>{p.qty} in stock {p.qty < 5 && '⚠️'}</span>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                         <p style={{ fontWeight: 800, fontSize: '.9rem' }}>₹{p.sell}</p>
                         <p style={{ fontSize: '.62rem', color: 'var(--g4)' }}>earn ₹{p.earn}</p>
                         <p style={{ fontSize: '.6rem', color: 'var(--t3)' }}>buy ₹{p.buy}</p>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
