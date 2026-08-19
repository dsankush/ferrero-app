// ============================================================
//  FERRERO PARTNERCONNECT — BRAND DASHBOARD
//  Full-width Brand Analytics & Operator Portal
//  Access: /main_dashboard
// ============================================================

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Helper: HSL/Hex theme variables matching the screenshot
const COLORS = {
  accent: '#d4a574', // Gold
  accentHover: '#c09262',
  primary: '#c41e3a', // Ferrero Red
  bgCream: '#fcfaf6', // Main body background
  bgCard: '#ffffff', // Card background
  border: '#f2eae1', // Subtle gold/cream border
  textDark: '#1e1c19', // Dark charcoal/brown
  textMuted: '#7c766d', // Soft grey
  success: '#10b981', // Green
  warning: '#f59e0b', // Yellow
  info: '#3b82f6', // Blue
};

// Mock data for fallback and overview metrics
const OVERVIEW_STATS = {
  totalRetailers: { value: '1,248', change: '+8% vs last month', isPositive: true },
  invoicesProcessed: { value: '342', change: '+28 vs last month', isPositive: true },
  pointsIssued: { value: '2,45,680', change: '+18% vs last month', isPositive: true },
  pointsRedeemed: { value: '1,76,540', change: '+22% vs last month', isPositive: true },
  redemptionRate: { value: '72%', change: '+5% vs last month', isPositive: true },
};

const LEADERBOARD_DATA = [
  { rank: 1, name: 'Mumbai West', activeRetailers: '3,245', invoices: '45,680', points: '2.45 Cr', rate: '78%' },
  { rank: 2, name: 'Kolkata East', activeRetailers: '2,987', invoices: '38,542', points: '2.12 Cr', rate: '77%' },
  { rank: 3, name: 'Bangalore Central', activeRetailers: '2,562', invoices: '32,145', points: '1.78 Cr', rate: '75%' },
  { rank: 4, name: 'Pune Metro', activeRetailers: '2,153', invoices: '28,550', points: '1.45 Cr', rate: '74%' },
  { rank: 5, name: 'Chennai South', activeRetailers: '1,987', invoices: '25,403', points: '1.32 Cr', rate: '72%' },
];

const SKU_PERFORMANCE = [
  { name: 'Ferrero Rocher 24pc', salesLift: '+28%', participation: '78%', cost: '3.2 Cr', rate: '76%', img: 'https://images.unsplash.com/photo-1549007994-cb92ca8a3bd0?w=100&auto=format&fit=crop&q=60' },
  { name: 'Ferrero Moments Gift Pack', salesLift: '+24%', participation: '72%', cost: '2.1 Cr', rate: '74%', img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=100&auto=format&fit=crop&q=60' },
  { name: 'Kinder Joy', salesLift: '+20%', participation: '68%', cost: '1.4 Cr', rate: '73%', img: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=100&auto=format&fit=crop&q=60' },
];

const TOP_REDEEMED_REWARDS = [
  { rank: 1, name: 'Amazon Voucher ₹500', count: '1,25,680', brand: 'amazon' },
  { rank: 2, name: 'Myntra Voucher ₹500', count: '98,430', brand: 'myntra' },
  { rank: 3, name: 'Swiggy Voucher ₹250', count: '76,510', brand: 'swiggy' },
  { rank: 4, name: 'Reliance Retail Voucher ₹1000', count: '52,480', brand: 'reliance' },
  { rank: 5, name: 'Ferrero Premium Hamper', count: '41,230', brand: 'ferrero' },
];

// India Map coordinates & participation data
const MAP_REGIONS = [
  { id: 'delhi', name: 'Delhi NCR', x: 235, y: 175, value: '68%', color: '#d4a574' },
  { id: 'gujarat', name: 'Gujarat', x: 125, y: 245, value: '62%', color: '#e5be93' },
  { id: 'maharashtra', name: 'Maharashtra', x: 175, y: 315, value: '78%', color: '#b88958' },
  { id: 'karnataka', name: 'Karnataka', x: 185, y: 415, value: '72%', color: '#cda070' },
  { id: 'tamilnadu', name: 'Tamil Nadu', x: 220, y: 475, value: '63%', color: '#e5be93' },
  { id: 'westbengal', name: 'West Bengal', x: 335, y: 255, value: '65%', color: '#d4a574' },
];

export const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview | subdvs | distributors | retailers | invoices | rewards | redemptions | schemes | analytics | reports | users | notifications | settings
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Supabase lists state
  const [subdbUsers, setSubdbUsers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search states for tables
  const [subdbSearch, setSubdbSearch] = useState('');
  const [distSearch, setDistSearch] = useState('');
  const [retSearch, setRetSearch] = useState('');
  const [invSearch, setInvSearch] = useState('');

  // Notifications creation state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifRole, setNotifRole] = useState('retailer');
  const [notifStatus, setNotifStatus] = useState('');

  // Settings state
  const [pointsRatio, setPointsRatio] = useState('10'); // 10 points = 1 Rupee
  const [geminiKey, setGeminiKey] = useState('••••••••••••••••••••');
  const [showSettingsToast, setShowSettingsToast] = useState(false);

  // Add full-page class to body on mount
  useEffect(() => {
    document.documentElement.classList.add('full-page-mode');
    return () => document.documentElement.classList.remove('full-page-mode');
  }, []);

  // Fetch data on tab change or mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!isSupabaseConfigured) {
          // Fallbacks handled inside components
          setLoading(false);
          return;
        }

        // SubDVs
        if (activeTab === 'subdvs' || activeTab === 'overview') {
          const { data } = await supabase.from('subdb_users').select('*').order('created_at', { ascending: false });
          setSubdbUsers(data || []);
        }

        // Distributors & Retailers
        if (activeTab === 'distributors' || activeTab === 'retailers' || activeTab === 'overview') {
          const { data: profiles } = await supabase.from('profiles').select('*');
          if (profiles) {
            setDistributors(profiles.filter(p => p.role === 'distributor'));
            setRetailers(profiles.filter(p => p.role === 'retailer'));
          }
        }

        // Invoices
        if (activeTab === 'invoices' || activeTab === 'overview') {
          const { data } = await supabase.from('subdb_invoices').select('*').order('created_at', { ascending: false });
          setInvoices(data || []);
        }

        // Campaigns
        if (activeTab === 'schemes' || activeTab === 'overview') {
          const { data } = await supabase.from('offer_campaigns').select('*').order('created_at', { ascending: false });
          setCampaigns(data || []);
        }
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handlePostNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle || !notifBody) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data: users } = await supabase.from('profiles').select('id').eq('role', notifRole);
        if (users && users.length > 0) {
          const notifs = users.map(u => ({
            user_id: u.id,
            title: notifTitle,
            body: notifBody,
            role: notifRole,
            is_read: false,
            type: 'admin_broadcast',
          }));
          await supabase.from('notifications').insert(notifs);
        }
      }
      setNotifStatus('✅ Notification broadcasted successfully!');
      setNotifTitle('');
      setNotifBody('');
      setTimeout(() => setNotifStatus(''), 4000);
    } catch {
      setNotifStatus('❌ Failed to send notification.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setShowSettingsToast(true);
    setTimeout(() => setShowSettingsToast(false), 3000);
  };

  return (
    <div className="main-dashboard-container">
      <style>{DASHBOARD_CSS}</style>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🍫</div>
          <div>
            <h1 className="brand-title">Ferrero PartnerConnect</h1>
            <p className="brand-subtitle">Brand Dashboard</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'subdvs', label: 'SubDVs', icon: 'groups' },
            { id: 'distributors', label: 'Distributors', icon: 'domain' },
            { id: 'retailers', label: 'Retailers', icon: 'storefront' },
            { id: 'invoices', label: 'Invoices', icon: 'description' },
            { id: 'rewards', label: 'Rewards', icon: 'redeem' },
            { id: 'redemptions', label: 'Redemptions', icon: 'sell' },
            { id: 'schemes', label: 'Schemes', icon: 'campaign' },
            { id: 'analytics', label: 'Analytics', icon: 'analytics' },
            { id: 'reports', label: 'Reports', icon: 'summarize' },
            { id: 'users', label: 'Users & Roles', icon: 'manage_accounts' },
            { id: 'tickets', label: 'Grievances & Tickets', icon: 'support_agent' },
            { id: 'notifications', label: 'Notifications', icon: 'notifications' },
            { id: 'settings', label: 'Settings', icon: 'settings' },
          ].map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <i className="material-symbols-outlined">{item.icon}</i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {/* Top Header Bar */}
        <header className="topbar">
          <div className="topbar-welcome">
            <h2 className="topbar-title">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'subdvs' && 'Sub-Distributor Management'}
              {activeTab === 'distributors' && 'Distributor Directory'}
              {activeTab === 'retailers' && 'Retailer Network'}
              {activeTab === 'invoices' && 'Invoices Processed'}
              {activeTab === 'rewards' && 'Rewards Program'}
              {activeTab === 'redemptions' && 'Redemption Pipeline'}
              {activeTab === 'schemes' && 'Active Campaigns & Schemes'}
              {activeTab === 'analytics' && 'Detailed Analytics'}
              {activeTab === 'reports' && 'Export Reports'}
              {activeTab === 'users' && 'Users & Access Control'}
              {activeTab === 'tickets' && 'Retailer Grievances & Support Tickets'}
              {activeTab === 'notifications' && 'Announcements & Push Alerts'}
              {activeTab === 'settings' && 'Platform Settings'}
            </h2>
            <p className="topbar-subtitle">Welcome back, SubDV Operator</p>
          </div>

          <div className="topbar-actions">
            {activeTab === 'overview' && (
              <>
                <div className="date-picker">
                  <i className="material-symbols-outlined">calendar_today</i>
                  <span>20 May - 20 May 2024</span>
                  <i className="material-symbols-outlined">expand_more</i>
                </div>
                <button className="btn-secondary" onClick={() => window.print()}>
                  <i className="material-symbols-outlined">download</i>
                  <span>Export Report</span>
                </button>
              </>
            )}
            <div className="notif-badge-container">
              <i className="material-symbols-outlined">notifications</i>
              <span className="badge">3</span>
            </div>
            <div className="user-profile">
              <div className="avatar">SO</div>
              <div className="user-info">
                <span className="user-name">SubDV Operator</span>
                <span className="user-role">Ferrero India</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="panel-container">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'subdvs' && renderSubDVs()}
          {activeTab === 'distributors' && renderDistributors()}
          {activeTab === 'retailers' && renderRetailers()}
          {activeTab === 'invoices' && renderInvoices()}
          {activeTab === 'rewards' && renderRewards()}
          {activeTab === 'redemptions' && renderRedemptions()}
          {activeTab === 'schemes' && renderSchemes()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'tickets' && renderTicketsTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </main>
    </div>
  );

  // ────────────────────────────────────────────────────────
  //  TAB PANELS IMPLEMENTATION
  // ────────────────────────────────────────────────────────

  function renderOverview() {
    return (
      <div className="overview-tab">
        {/* KPI Metrics Row */}
        <section className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Total Retailers</span>
              <div className="kpi-icon-wrapper retailers">
                <i className="material-symbols-outlined">storefront</i>
              </div>
            </div>
            <p className="kpi-value">{isSupabaseConfigured && retailers.length > 0 ? retailers.length.toLocaleString() : OVERVIEW_STATS.totalRetailers.value}</p>
            <span className="kpi-trend trend-up">
              <i className="material-symbols-outlined">trending_up</i>
              <span>{OVERVIEW_STATS.totalRetailers.change}</span>
            </span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Invoices Processed</span>
              <div className="kpi-icon-wrapper invoices">
                <i className="material-symbols-outlined">receipt_long</i>
              </div>
            </div>
            <p className="kpi-value">{isSupabaseConfigured && invoices.length > 0 ? invoices.length.toLocaleString() : OVERVIEW_STATS.invoicesProcessed.value}</p>
            <span className="kpi-trend trend-up">
              <i className="material-symbols-outlined">trending_up</i>
              <span>{OVERVIEW_STATS.invoicesProcessed.change}</span>
            </span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Points Issued</span>
              <div className="kpi-icon-wrapper issued">
                <i className="material-symbols-outlined">token</i>
              </div>
            </div>
            <p className="kpi-value">{OVERVIEW_STATS.pointsIssued.value}</p>
            <span className="kpi-trend trend-up">
              <i className="material-symbols-outlined">trending_up</i>
              <span>{OVERVIEW_STATS.pointsIssued.change}</span>
            </span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Points Redeemed</span>
              <div className="kpi-icon-wrapper redeemed">
                <i className="material-symbols-outlined">check_circle</i>
              </div>
            </div>
            <p className="kpi-value">{OVERVIEW_STATS.pointsRedeemed.value}</p>
            <span className="kpi-trend trend-up">
              <i className="material-symbols-outlined">trending_up</i>
              <span>{OVERVIEW_STATS.pointsRedeemed.change}</span>
            </span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Redemption Rate</span>
              <div className="kpi-icon-wrapper rate">
                <i className="material-symbols-outlined">percent</i>
              </div>
            </div>
            <p className="kpi-value">{OVERVIEW_STATS.redemptionRate.value}</p>
            <span className="kpi-trend trend-up">
              <i className="material-symbols-outlined">trending_up</i>
              <span>{OVERVIEW_STATS.redemptionRate.change}</span>
            </span>
          </div>
        </section>

        {/* Map & Leaderboard Section */}
        <section className="mid-section">
          {/* India SVG Map */}
          <div className="card map-card">
            <div className="card-header">
              <h3 className="card-title">Retailer Participation by State</h3>
              <i className="material-symbols-outlined text-muted">info_outline</i>
            </div>
            <div className="map-wrapper">
              <svg viewBox="0 0 400 500" className="india-svg">
                {/* Simplified Indian Subcontinent outline */}
                <path d="M120 100 L160 50 L190 60 L200 40 L220 80 L230 110 L280 120 L270 170 L340 180 L350 200 L320 220 L350 240 L330 290 L300 280 L280 320 L240 330 L230 400 L210 490 L200 490 L180 440 L160 410 L170 340 L140 320 L130 280 L90 270 L100 240 L80 230 L110 180 Z" fill="#fff9f2" stroke="#ebdcd0" strokeWidth="1.5" />
                
                {/* State circles representing participation centers */}
                {MAP_REGIONS.map(region => (
                  <g
                    key={region.id}
                    className="map-marker-group"
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r="16"
                      fill={region.color}
                      className="map-circle"
                      opacity="0.8"
                    />
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r="24"
                      fill="none"
                      stroke={region.color}
                      strokeWidth="1.5"
                      className="map-circle-ping"
                    />
                    <text
                      x={region.x}
                      y={region.y + 4}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {region.value}
                    </text>
                    
                    {/* Tooltip anchor label */}
                    <rect
                      x={region.x - 30}
                      y={region.y - 32}
                      width="60"
                      height="14"
                      rx="3"
                      fill="#fff"
                      stroke="#d4a574"
                      strokeWidth="1"
                      className="marker-label-bg"
                    />
                    <text
                      x={region.x}
                      y={region.y - 22}
                      textAnchor="middle"
                      fill="#1e1c19"
                      fontSize="7"
                      fontWeight="bold"
                    >
                      {region.name}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Live hover tooltip */}
              {hoveredRegion && (
                <div
                  className="map-tooltip"
                  style={{
                    position: 'absolute',
                    top: `${hoveredRegion.y - 50}px`,
                    left: `${hoveredRegion.x + 30}px`,
                  }}
                >
                  <p className="tooltip-title">{hoveredRegion.name}</p>
                  <p className="tooltip-value">Participation: <strong>{hoveredRegion.value}</strong></p>
                  <p className="tooltip-desc">Status: Active Market</p>
                </div>
              )}
            </div>

            <div className="map-legend">
              <span className="legend-label">Low Participation</span>
              <div className="legend-gradient"></div>
              <span className="legend-label">High Participation</span>
            </div>
          </div>

          {/* SubDV Leaderboard */}
          <div className="card leaderboard-card">
            <div className="card-header">
              <h3 className="card-title">SubDV Leaderboard</h3>
              <button className="btn-link" onClick={() => setActiveTab('subdvs')}>View All</button>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SubDV</th>
                    <th className="text-right">Retailers Active</th>
                    <th className="text-right">Invoices Processed</th>
                    <th className="text-right">Rewards Issued</th>
                    <th className="text-right">Redemption Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADERBOARD_DATA.map((row, index) => (
                    <tr key={index}>
                      <td><span className={`rank-badge rank-${row.rank}`}>{row.rank}</span></td>
                      <td><strong>{row.name}</strong></td>
                      <td className="text-right">{row.activeRetailers}</td>
                      <td className="text-right">{row.invoices}</td>
                      <td className="text-right" style={{ color: COLORS.accent, fontWeight: 700 }}>{row.points}</td>
                      <td className="text-right"><span className="tag-rate">{row.rate}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-footer">
              <button className="btn-flat" onClick={() => setActiveTab('subdvs')}>View All SubDVs</button>
            </div>
          </div>
        </section>

        {/* Bottom Metrics Section */}
        <section className="bottom-section">
          {/* Top Products */}
          <div className="card product-card">
            <div className="card-header">
              <h3 className="card-title">Product Performance (Top SKUs)</h3>
              <button className="btn-link" onClick={() => setActiveTab('schemes')}>View All</button>
            </div>
            <div className="product-list">
              {SKU_PERFORMANCE.map((p, idx) => (
                <div className="product-row" key={idx}>
                  <img src={p.img} alt={p.name} className="product-img" />
                  <div className="product-details">
                    <span className="product-name">{p.name}</span>
                    <div className="product-meta">
                      <span>Sales Lift: <strong className="text-success">{p.salesLift}</strong></span>
                      <span>Participation: <strong>{p.participation}</strong></span>
                    </div>
                  </div>
                  <div className="product-stats text-right">
                    <span className="stat-points">{p.cost} Cost</span>
                    <span className="stat-rate">{p.rate} Red.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart: Rewards Analytics */}
          <div className="card rewards-donut-card">
            <div className="card-header">
              <h3 className="card-title">Rewards Analytics</h3>
            </div>
            <div className="donut-container">
              <div className="donut-svg-wrapper">
                <svg viewBox="0 0 100 100" className="donut-svg">
                  {/* Segment: Pending (Grey) 24% */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  {/* Segment: Redeemed (Green) 76% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={COLORS.success}
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="60.3"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Segment: Issued (Orange) 100% border overlay */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={COLORS.accent}
                    strokeWidth="1.5"
                    strokeDasharray="282.7"
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="donut-center-text">
                  <span className="center-value">12.8 Cr</span>
                  <span className="center-label">Total Points</span>
                </div>
              </div>

              <div className="donut-legend">
                <div className="legend-item">
                  <span className="legend-color-dot" style={{ backgroundColor: COLORS.accent }}></span>
                  <div className="legend-texts">
                    <span className="legend-title">Issued</span>
                    <span className="legend-val">12.8 Cr (100%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-color-dot" style={{ backgroundColor: COLORS.success }}></span>
                  <div className="legend-texts">
                    <span className="legend-title">Redeemed</span>
                    <span className="legend-val">9.7 Cr (76%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-color-dot" style={{ backgroundColor: '#e5e7eb' }}></span>
                  <div className="legend-texts">
                    <span className="legend-title">Pending</span>
                    <span className="legend-val">3.1 Cr (24%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Redeemed Rewards */}
          <div className="card top-redeemed-card">
            <div className="card-header">
              <h3 className="card-title">Top Redeemed Rewards</h3>
              <button className="btn-link" onClick={() => setActiveTab('rewards')}>View All</button>
            </div>
            <div className="redeemed-list">
              {TOP_REDEEMED_REWARDS.map((item, idx) => (
                <div className="redeemed-row" key={idx}>
                  <div className="redeemed-rank-circle">{item.rank}</div>
                  <div className="redeemed-icon-brand">
                    {item.brand === 'amazon' && 'a'}
                    {item.brand === 'myntra' && 'M'}
                    {item.brand === 'swiggy' && 'S'}
                    {item.brand === 'reliance' && 'R'}
                    {item.brand === 'ferrero' && '🍫'}
                  </div>
                  <div className="redeemed-info">
                    <span className="redeemed-name">{item.name}</span>
                  </div>
                  <div className="redeemed-count text-right">
                    <strong>{item.count}</strong>
                    <span className="text-muted" style={{ fontSize: '10px' }}>Redemptions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderSubDVs() {
    const list = subdbUsers.length > 0 ? subdbUsers : [
      { id: '1', name: 'Mumbai West Operator', phone: '+919988776655', emp_id: 'EMP-MUM-102', state: 'Maharashtra', district: 'Mumbai Suburban', is_active: true, created_at: '2026-06-20T10:00:00Z' },
      { id: '2', name: 'Kolkata East Operator', phone: '+918877665544', emp_id: 'EMP-KOL-204', state: 'West Bengal', district: 'Kolkata', is_active: true, created_at: '2026-06-21T11:30:00Z' },
      { id: '3', name: 'Bangalore Central Operator', phone: '+917766554433', emp_id: 'EMP-BLR-094', state: 'Karnataka', district: 'Bengaluru Urban', is_active: true, created_at: '2026-06-22T09:15:00Z' },
      { id: '4', name: 'Pune Metro Operator', phone: '+916655443322', emp_id: 'EMP-PUN-403', state: 'Maharashtra', district: 'Pune', is_active: false, created_at: '2026-06-23T14:40:00Z' },
      { id: '5', name: 'Chennai South Operator', phone: '+915544332211', emp_id: 'EMP-CHN-550', state: 'Tamil Nadu', district: 'Chennai', is_active: true, created_at: '2026-06-24T16:20:00Z' },
    ];

    const filtered = list.filter(u => {
      const name = (u.name || '').toLowerCase();
      const empId = (u.emp_id || '').toLowerCase();
      const phone = (u.phone || '');
      const state = (u.state || '').toLowerCase();
      const query = subdbSearch.toLowerCase();
      return name.includes(query) || empId.includes(query) || phone.includes(query) || state.includes(query);
    });

    return (
      <div className="card table-card">
        <div className="table-header-filters">
          <div className="search-box">
            <i className="material-symbols-outlined">search</i>
            <input
              type="text"
              placeholder="Search Sub-DB by name, EMP ID, phone or state..."
              value={subdbSearch}
              onChange={e => setSubdbSearch(e.target.value)}
            />
          </div>
          <span className="text-muted" style={{ fontSize: '13px' }}>Found {filtered.length} Sub-DB Operators</span>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>EMP ID</th>
                <th>Operator Name</th>
                <th>Phone Number</th>
                <th>State</th>
                <th>District</th>
                <th>Status</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td><code style={{ color: COLORS.accent, fontWeight: 700 }}>{u.emp_id || 'N/A'}</code></td>
                  <td><strong>{u.name || 'N/A'}</strong></td>
                  <td>{u.phone || 'N/A'}</td>
                  <td>{u.state || 'N/A'}</td>
                  <td>{u.district || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderDistributors() {
    const list = distributors.length > 0 ? distributors : [
      { id: '1', name: 'Rajesh Gupta', shop: 'Gupta Ferrero Rocher Wholesaler', loc: 'Indore, MP', phone: '+919876543210', wallet_balance: '12,450.00' },
      { id: '2', name: 'Alok Mishra', shop: 'Mishra Candy Distributors', loc: 'Bhopal, MP', phone: '+918765432109', wallet_balance: '8,210.50' },
      { id: '3', name: 'Sanjay Jain', shop: 'Jain Sweet & Cocoa Wholesalers', loc: 'Jabalpur, MP', phone: '+917654321098', wallet_balance: '15,670.00' },
    ];

    const filtered = list.filter(d => {
      const name = (d.name || '').toLowerCase();
      const shop = (d.shop || '').toLowerCase();
      const loc = (d.loc || '').toLowerCase();
      const query = distSearch.toLowerCase();
      return name.includes(query) || shop.includes(query) || loc.includes(query);
    });

    return (
      <div className="card table-card">
        <div className="table-header-filters">
          <div className="search-box">
            <i className="material-symbols-outlined">search</i>
            <input
              type="text"
              placeholder="Search Distributors by name, shop or location..."
              value={distSearch}
              onChange={e => setDistSearch(e.target.value)}
            />
          </div>
          <span className="text-muted" style={{ fontSize: '13px' }}>Found {filtered.length} Distributors</span>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Distributor Name</th>
                <th>Business Shop Name</th>
                <th>Location</th>
                <th>Contact Phone</th>
                <th className="text-right">Wallet Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name || 'N/A'}</strong></td>
                  <td>{d.shop || 'N/A'}</td>
                  <td>{d.loc || 'N/A'}</td>
                  <td>{d.phone || 'N/A'}</td>
                  <td className="text-right" style={{ color: COLORS.success, fontWeight: 700 }}>₹{d.wallet_balance || '0.00'}</td>
                  <td><span className="status-badge active">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderRetailers() {
    const list = retailers.length > 0 ? retailers : [
      { id: '1', name: 'Ramesh Kumar', shop: 'Kumar Sweet House', loc: 'Khetgaon, MP', phone: '+919999888877', wallet_balance: '3,482.50' },
      { id: '2', name: 'Naresh Chand', shop: 'Chand Kirana Stores', loc: 'Ujjain, MP', phone: '+918888777766', wallet_balance: '1,240.00' },
      { id: '3', name: 'Gopal Dass', shop: 'Dass Confectioneries', loc: 'Gwalior, MP', phone: '+917777666655', wallet_balance: '5,920.80' },
      { id: '4', name: 'Amit Shah', shop: 'Shah Retail Outlet', loc: 'Ahmedabad, Gujarat', phone: '+916666555544', wallet_balance: '890.00' },
    ];

    const filtered = list.filter(r => {
      const name = (r.name || '').toLowerCase();
      const shop = (r.shop || '').toLowerCase();
      const loc = (r.loc || '').toLowerCase();
      const query = retSearch.toLowerCase();
      return name.includes(query) || shop.includes(query) || loc.includes(query);
    });

    return (
      <div className="card table-card">
        <div className="table-header-filters">
          <div className="search-box">
            <i className="material-symbols-outlined">search</i>
            <input
              type="text"
              placeholder="Search Retailers by name, shop or region..."
              value={retSearch}
              onChange={e => setRetSearch(e.target.value)}
            />
          </div>
          <span className="text-muted" style={{ fontSize: '13px' }}>Found {filtered.length} Retailers</span>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Retailer Name</th>
                <th>Shop Name</th>
                <th>Location Address</th>
                <th>Phone Number</th>
                <th className="text-right">Wallet Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.name || 'N/A'}</strong></td>
                  <td>{r.shop || 'N/A'}</td>
                  <td>{r.loc || 'N/A'}</td>
                  <td>{r.phone || 'N/A'}</td>
                  <td className="text-right" style={{ color: COLORS.accent, fontWeight: 700 }}>₹{r.wallet_balance || '0.00'}</td>
                  <td><span className="status-badge active">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderInvoices() {
    const list = invoices.length > 0 ? invoices : [
      {
        id: 'i1',
        retailer_name: 'Kumar Sweet House',
        wholesaler_name: 'Gupta Ferrero Rocher Wholesaler',
        purchase_date: '2026-06-24',
        invoice_number: 'INV-2026-984',
        products: [
          { name: 'Ferrero Rocher 24pc', qty: 25, price: 850, unit: 'box' },
          { name: 'Kinder Joy', qty: 100, price: 45, unit: 'pcs' },
        ],
        total_amount: 25750,
        scan_confidence: 'high',
        status: 'verified',
        created_at: '2026-06-24T10:45:00Z',
      },
      {
        id: 'i2',
        retailer_name: 'Chand Kirana Stores',
        wholesaler_name: 'Mishra Candy Distributors',
        purchase_date: '2026-06-23',
        invoice_number: 'INV-MISH-109',
        products: [
          { name: 'Ferrero Moments Gift Pack', qty: 50, price: 340, unit: 'box' },
        ],
        total_amount: 17000,
        scan_confidence: 'high',
        status: 'verified',
        created_at: '2026-06-23T15:20:00Z',
      },
      {
        id: 'i3',
        retailer_name: 'Dass Confectioneries',
        wholesaler_name: 'Gupta Ferrero Rocher Wholesaler',
        purchase_date: '2026-06-22',
        invoice_number: 'INV-2026-802',
        products: [
          { name: 'Ferrero Rocher 24pc', qty: 10, price: 850, unit: 'box' },
          { name: 'Kinder Joy', qty: 50, price: 45, unit: 'pcs' },
        ],
        total_amount: 10750,
        scan_confidence: 'medium',
        status: 'submitted',
        created_at: '2026-06-22T11:00:00Z',
      },
    ];

    const filtered = list.filter(i => {
      const retName = (i.retailer_name || '').toLowerCase();
      const wholName = (i.wholesaler_name || '').toLowerCase();
      const invNum = (i.invoice_number || '').toLowerCase();
      const query = invSearch.toLowerCase();
      return retName.includes(query) || wholName.includes(query) || invNum.includes(query);
    });

    return (
      <div className="invoices-tab">
        <div className="card table-card">
          <div className="table-header-filters">
            <div className="search-box">
              <i className="material-symbols-outlined">search</i>
              <input
                type="text"
                placeholder="Search Invoices by retailer, wholesaler or invoice #..."
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
              />
            </div>
            <span className="text-muted" style={{ fontSize: '13px' }}>Found {filtered.length} Scanned Invoices</span>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Retailer Account</th>
                  <th>Wholesaler Supplier</th>
                  <th>Purchase Date</th>
                  <th className="text-right">Products Count</th>
                  <th className="text-right">Total Amount</th>
                  <th>OCR Confidence</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const productsCount = inv.products ? (Array.isArray(inv.products) ? inv.products.length : 0) : 0;
                  return (
                    <tr key={inv.id}>
                      <td><code style={{ fontWeight: 700 }}>{inv.invoice_number || 'N/A'}</code></td>
                      <td><strong>{inv.retailer_name}</strong></td>
                      <td>{inv.wholesaler_name}</td>
                      <td>{inv.purchase_date}</td>
                      <td className="text-right">{productsCount} products</td>
                      <td className="text-right" style={{ color: COLORS.accent, fontWeight: 700 }}>₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`confidence-badge ${inv.scan_confidence || 'medium'}`}>
                          {inv.scan_confidence ? inv.scan_confidence.toUpperCase() : 'MEDIUM'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${inv.status}`}>
                          {inv.status ? inv.status.toUpperCase() : 'SUBMITTED'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-small-flat" onClick={() => setSelectedInvoice(inv)}>
                          <i className="material-symbols-outlined">visibility</i>
                          <span>View Scan Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Scan Details Modal */}
        {selectedInvoice && (
          <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Invoice Details: {selectedInvoice.invoice_number}</h3>
                <button className="modal-close" onClick={() => setSelectedInvoice(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Retailer Name</span>
                    <span className="detail-val">{selectedInvoice.retailer_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Supplier Wholesaler</span>
                    <span className="detail-val">{selectedInvoice.wholesaler_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date of Purchase</span>
                    <span className="detail-val">{selectedInvoice.purchase_date}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Confidence Score</span>
                    <span className="detail-val">
                      <span className={`confidence-badge ${selectedInvoice.scan_confidence}`}>
                        {selectedInvoice.scan_confidence ? selectedInvoice.scan_confidence.toUpperCase() : 'HIGH'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="invoice-products-section">
                  <h4>Extracted Products ({selectedInvoice.products?.length || 0})</h4>
                  <table className="sub-table">
                    <thead>
                      <tr>
                        <th>Product SKU Name</th>
                        <th className="text-right">Quantity</th>
                        <th className="text-right">Price per Unit</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.products?.map((prod, idx) => (
                        <tr key={idx}>
                          <td>{prod.name}</td>
                          <td className="text-right">{prod.qty} {prod.unit || 'units'}</td>
                          <td className="text-right">₹{prod.price}</td>
                          <td className="text-right" style={{ color: COLORS.accent, fontWeight: 700 }}>₹{prod.qty * prod.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="invoice-total-summary">
                  <span>Grand Total amount:</span>
                  <strong>₹{Number(selectedInvoice.total_amount || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setSelectedInvoice(null)}>Close</button>
                <button className="btn-primary" onClick={() => setSelectedInvoice(null)}>Approve & Verify</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderRewards() {
    return (
      <div className="rewards-tab">
        <div className="rewards-grid">
          {TOP_REDEEMED_REWARDS.map((rew, index) => (
            <div className="reward-item-card" key={index}>
              <div className="reward-icon-badge">🛍️</div>
              <h4 className="reward-item-title">{rew.name}</h4>
              <p className="reward-item-points">5,000 Points</p>
              <div className="reward-item-meta">
                <span>Active Redemptions: <strong>{rew.count}</strong></span>
              </div>
              <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>Configure Reward</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderRedemptions() {
    return (
      <div className="card table-card">
        <div className="table-header-filters">
          <h4>Retailer Points Redemption Logs</h4>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Retailer Account</th>
                <th>Voucher Redeemed</th>
                <th>Points Deducted</th>
                <th>Redemption Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>TXN-REDEEM-908</code></td>
                <td><strong>Kumar Sweet House</strong></td>
                <td>Amazon Gift Card ₹500</td>
                <td style={{ color: COLORS.primary, fontWeight: 700 }}>-5,000 pts</td>
                <td>2026-06-25</td>
                <td><span className="status-badge status-verified">COMPLETED</span></td>
              </tr>
              <tr>
                <td><code>TXN-REDEEM-905</code></td>
                <td><strong>Chand Kirana Stores</strong></td>
                <td>Swiggy Coupon ₹250</td>
                <td style={{ color: COLORS.primary, fontWeight: 700 }}>-2,500 pts</td>
                <td>2026-06-24</td>
                <td><span className="status-badge status-verified">COMPLETED</span></td>
              </tr>
              <tr>
                <td><code>TXN-REDEEM-898</code></td>
                <td><strong>Dass Confectioneries</strong></td>
                <td>Myntra Voucher ₹500</td>
                <td style={{ color: COLORS.primary, fontWeight: 700 }}>-5,000 pts</td>
                <td>2026-06-23</td>
                <td><span className="status-badge status-submitted">PENDING APPROVAL</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSchemes() {
    const list = campaigns.length > 0 ? campaigns : [
      { id: '1', title: 'Commission Boost Offer', description: 'Earn 5% extra commission on stocking 10+ boxes of Ferrero Rocher 24pc', target_role: 'retailer', is_active: true, duration_days: 7, created_at: '2026-06-23T10:00:00Z' },
      { id: '2', title: 'Bulk Discount Season', description: 'Get 15% discount on bulk purchases from authorized distributors', target_role: 'retailer', is_active: true, duration_days: 14, created_at: '2026-06-24T12:00:00Z' },
    ];

    return (
      <div className="schemes-tab">
        <div className="rewards-grid">
          {list.map(c => (
            <div className="reward-item-card" key={c.id}>
              <div className="reward-icon-badge" style={{ backgroundColor: 'rgba(196,30,58,0.1)', color: COLORS.primary }}>📣</div>
              <h4 className="reward-item-title">{c.title}</h4>
              <p className="reward-item-desc">{c.description}</p>
              <div className="reward-item-meta" style={{ marginTop: '15px' }}>
                <span>Audience: <strong>{c.target_role?.toUpperCase()}</strong></span>
                <span>Duration: <strong>{c.duration_days} days</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <span className={`status-badge ${c.is_active ? 'active' : 'inactive'}`}>
                  {c.is_active ? 'LIVE' : 'EXPIRED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAnalyticsTab() {
    return (
      <div className="analytics-tab">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Points Allocation Trends (Weekly)</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 40px', borderBottom: '1px solid #ebdcd0' }}>
            {[
              { label: 'Week 1', issued: 120, redeemed: 80 },
              { label: 'Week 2', issued: 150, redeemed: 95 },
              { label: 'Week 3', issued: 190, redeemed: 130 },
              { label: 'Week 4', issued: 240, redeemed: 176 },
            ].map((week, idx) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', height: '100%', justifyContent: 'flex-end' }} key={idx}>
                <div style={{ width: '100%', display: 'flex', gap: '10px', alignItems: 'flex-end', height: '80%' }}>
                  <div style={{ flex: 1, backgroundColor: COLORS.accent, height: `${(week.issued / 250) * 100}%`, borderRadius: '4px 4px 0 0', position: 'relative' }} title={`Issued: ${week.issued}k`}></div>
                  <div style={{ flex: 1, backgroundColor: COLORS.success, height: `${(week.redeemed / 250) * 100}%`, borderRadius: '4px 4px 0 0', position: 'relative' }} title={`Redeemed: ${week.redeemed}k`}></div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textMuted }}>{week.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', padding: '15px 40px', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: COLORS.accent, borderRadius: '2px' }}></span> Points Issued (x1000)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: COLORS.success, borderRadius: '2px' }}></span> Points Redeemed (x1000)</span>
          </div>
        </div>
      </div>
    );
  }

  function downloadTicketsCSV() {
    const storedTickets = JSON.parse(localStorage.getItem('counterOS_supportTickets') || '[]');
    if (storedTickets.length === 0) {
      alert('No support tickets found to export.');
      return;
    }
    const headers = ['Ticket ID', 'Retailer Name', 'Phone', 'Category', 'Subject', 'Invoice Ref', 'Priority', 'Status', 'Date'];
    const rows = storedTickets.map(t => [
      t.ticket_id || t.id,
      `"${t.retailer_name || 'Retailer'}"`,
      t.retailer_phone || '',
      t.category || '',
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      t.invoice_number || 'N/A',
      t.priority || 'Medium',
      t.status || 'Open',
      t.created_at ? new Date(t.created_at).toLocaleDateString() : ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ferrero_Support_Tickets_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function renderReportsTab() {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <i className="material-symbols-outlined" style={{ fontSize: '64px', color: COLORS.accent, marginBottom: '20px' }}>download_for_offline</i>
        <h2>Generate Platform Excel/CSV Reports</h2>
        <p className="text-muted" style={{ maxWidth: '500px', margin: '10px auto 30px' }}>Export complete directories of Retailers, Distributors, Points, Scanned Invoices, and Raised Grievances into spreadsheets.</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => alert('Exporting Retailers CSV...')}>Export Retailers</button>
          <button className="btn-primary" onClick={() => alert('Exporting Invoices CSV...')}>Export Invoices History</button>
          <button className="btn-primary" onClick={downloadTicketsCSV} style={{ background: 'linear-gradient(135deg, #c41e3a, #d4a574)', border: 'none' }}>
            📥 Export Grievances & Tickets CSV
          </button>
          <button className="btn-secondary" onClick={() => alert('Exporting Leaderboards CSV...')}>Export SubDV Leaderboard</button>
        </div>
      </div>
    );
  }

  function renderTicketsTab() {
    const rawTickets = JSON.parse(localStorage.getItem('counterOS_supportTickets') || '[]');
    const defaultTickets = [
      { id: 't1', ticket_id: 'TKT-849201', retailer_name: 'Mahalaxmi Sweets', retailer_phone: '9876543210', category: 'wrong_upload', subject: 'Invoice #INV-9921 product quantity mismatch', invoice_number: 'INV-9921', priority: 'High', status: 'Open', created_at: '2026-08-19T10:30:00Z' },
      { id: 't2', ticket_id: 'TKT-519284', retailer_name: 'Bikaner Misthan', retailer_phone: '9876543211', category: 'claim_issue', subject: 'Voucher redemption code not received', invoice_number: 'VCH-9821', priority: 'Medium', status: 'Resolved', created_at: '2026-08-18T14:15:00Z' }
    ];
    const ticketList = rawTickets.length > 0 ? rawTickets : defaultTickets;

    const openCount = ticketList.filter(t => t.status !== 'Resolved').length;
    const resolvedCount = ticketList.filter(t => t.status === 'Resolved').length;

    return (
      <div className="tickets-tab">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(212,165,116,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="material-symbols-outlined" style={{ color: COLORS.accent, fontSize: '28px' }}>support_agent</i>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 'bold' }}>Total Tickets</p>
              <h2 style={{ margin: 0, fontSize: '24px' }}>{ticketList.length}</h2>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(196,30,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="material-symbols-outlined" style={{ color: COLORS.primary, fontSize: '28px' }}>error</i>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 'bold' }}>Open Grievances</p>
              <h2 style={{ margin: 0, fontSize: '24px', color: COLORS.primary }}>{openCount}</h2>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '28px' }}>check_circle</i>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 'bold' }}>Resolved</p>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#10b981' }}>{resolvedCount}</h2>
            </div>
          </div>
        </div>

        <div className="card table-card">
          <div className="table-header-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>Retailer Dispute &amp; Escalation Tickets</h4>
            <button className="btn-primary" onClick={downloadTicketsCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <i className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</i> Export CSV
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Retailer</th>
                  <th>Category</th>
                  <th>Subject &amp; Notes</th>
                  <th>Invoice Ref</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ticketList.map((t, idx) => (
                  <tr key={t.id || idx}>
                    <td><strong>#{t.ticket_id || t.id}</strong></td>
                    <td>
                      <div><strong>{t.retailer_name}</strong></div>
                      <small style={{ color: COLORS.textMuted }}>+91 {t.retailer_phone}</small>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f5efe6', color: COLORS.textDark, border: '1px solid #d4a574' }}>
                        {t.category?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 'bold' }}>{t.subject}</div>
                      <small style={{ color: COLORS.textMuted }}>{t.description}</small>
                    </td>
                    <td>
                      {t.invoice_number ? <span style={{ fontWeight: 'bold', color: COLORS.primary }}>#{t.invoice_number}</span> : '—'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: t.priority === 'High' ? COLORS.primary : COLORS.textDark }}>
                        {t.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${t.status === 'Resolved' ? 'active' : 'pending'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.status !== 'Resolved' ? (
                        <button
                          className="btn-sm"
                          style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={() => {
                            const updated = ticketList.map(item => item.ticket_id === t.ticket_id ? { ...item, status: 'Resolved' } : item);
                            localStorage.setItem('counterOS_supportTickets', JSON.stringify(updated));
                            alert(`Ticket #${t.ticket_id} marked as Resolved.`);
                            window.location.reload();
                          }}
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>✓ Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderUsersTab() {
    return (
      <div className="card table-card">
        <div className="table-header-filters">
          <h4>Operator Access Control List</h4>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>System Role</th>
                <th>Permissions Scope</th>
                <th>Last Login</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>admin_ferrero</strong></td>
                <td><span className="status-badge" style={{ backgroundColor: 'rgba(196,30,58,0.1)', color: COLORS.primary }}>SYSTEM ADMIN</span></td>
                <td>Full read & write all territories</td>
                <td>Just now</td>
                <td><span className="status-badge active">Active</span></td>
              </tr>
              <tr>
                <td><strong>subdb_operator_west</strong></td>
                <td><span className="status-badge" style={{ backgroundColor: 'rgba(212,165,116,0.1)', color: COLORS.accent }}>TERRITORY OPERATOR</span></td>
                <td>View & Verify Maharashtra & Gujarat invoices</td>
                <td>2 hours ago</td>
                <td><span className="status-badge active">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderNotificationsTab() {
    return (
      <div className="card" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: '20px' }}>Broadcast Announcement Notification</h3>
        {notifStatus && <div className="status-message" style={{ padding: '12px', borderRadius: '8px', marginBottom: '15px', background: COLORS.bgCream, border: `1px solid ${COLORS.border}` }}>{notifStatus}</div>}
        <form onSubmit={handlePostNotification}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>Audience Role</label>
            <select value={notifRole} onChange={e => setNotifRole(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ebdcd0', borderRadius: '8px', background: '#fff' }}>
              <option value="retailer">All Retailers</option>
              <option value="distributor">All Distributors</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>Notification Title</label>
            <input type="text" placeholder="Title..." value={notifTitle} onChange={e => setNotifTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ebdcd0', borderRadius: '8px' }} required />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>Body Message</label>
            <textarea placeholder="Write message..." rows="4" value={notifBody} onChange={e => setNotifBody(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ebdcd0', borderRadius: '8px' }} required></textarea>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Send Announcement</button>
        </form>
      </div>
    );
  }

  function renderSettingsTab() {
    return (
      <div className="card" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: '20px' }}>Platform Rules & Key Configurations</h3>
        {showSettingsToast && <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '15px', background: COLORS.bgCream, border: `1px solid ${COLORS.success}`, color: COLORS.success }}>Rules updated successfully!</div>}
        <form onSubmit={handleSaveSettings}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>Points Valuation Ratio (Points = ₹1)</label>
            <input type="number" value={pointsRatio} onChange={e => setPointsRatio(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ebdcd0', borderRadius: '8px' }} />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>Gemini OCR Vision API Key</label>
            <input type="text" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ebdcd0', borderRadius: '8px' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Save Platform Rules</button>
        </form>
      </div>
    );
  }
};

// ────────────────────────────────────────────────────────
//  DASHBOARD GLASSMORPHISM CSS STYLE DEFINITION
// ────────────────────────────────────────────────────────

const DASHBOARD_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');

  .main-dashboard-container {
    display: flex;
    min-height: 100vh;
    background-color: ${COLORS.bgCream};
    color: ${COLORS.textDark};
    font-family: 'Outfit', sans-serif;
  }

  /* Sidebar Design */
  .sidebar {
    width: 280px;
    background-color: #ffffff;
    border-right: 1px solid ${COLORS.border};
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: sticky;
    top: 0;
    flex-shrink: 0;
    box-shadow: 2px 0 10px rgba(0,0,0,0.01);
  }

  .sidebar-brand {
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid ${COLORS.border};
  }

  .brand-icon {
    font-size: 28px;
  }

  .brand-title {
    font-size: 15px;
    font-weight: 800;
    color: ${COLORS.primary};
    margin: 0;
  }

  .brand-subtitle {
    font-size: 11px;
    color: ${COLORS.textMuted};
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }

  .sidebar-menu {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
    flex: 1;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: none;
    border: none;
    border-radius: 10px;
    color: ${COLORS.textMuted};
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
  }

  .menu-item i {
    font-size: 20px;
    transition: color 0.2s;
  }

  .menu-item:hover {
    background-color: #fcf6ef;
    color: ${COLORS.accent};
  }

  .menu-item.active {
    background-color: #f7ede0;
    color: ${COLORS.accent};
    font-weight: 700;
  }

  /* Content Area */
  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-y: auto;
  }

  /* Topbar styling */
  .topbar {
    padding: 20px 32px;
    background-color: #ffffff;
    border-bottom: 1px solid ${COLORS.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .topbar-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    color: ${COLORS.textDark};
  }

  .topbar-subtitle {
    font-size: 13px;
    color: ${COLORS.textMuted};
    margin: 3px 0 0;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .date-picker {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: 1px solid ${COLORS.border};
    border-radius: 10px;
    background-color: #fff;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: ${COLORS.textDark};
  }

  .date-picker i {
    font-size: 16px;
    color: ${COLORS.accent};
  }

  .notif-badge-container {
    position: relative;
    cursor: pointer;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid ${COLORS.border};
  }

  .notif-badge-container .badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background-color: ${COLORS.primary};
    color: #fff;
    font-size: 9px;
    font-weight: bold;
    border-radius: 50%;
    padding: 2px 5px;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 16px;
    border-left: 1px solid ${COLORS.border};
  }

  .user-profile .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background-color: #f7ede0;
    color: ${COLORS.accent};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    border: 1px solid #ebdcd0;
  }

  .user-info {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-size: 13px;
    font-weight: 600;
  }

  .user-role {
    font-size: 11px;
    color: ${COLORS.textMuted};
  }

  /* Panels wrapper */
  .panel-container {
    padding: 32px;
    flex: 1;
  }

  /* Button presets */
  .btn-primary {
    background-color: ${COLORS.accent};
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    background-color: ${COLORS.accentHover};
  }

  .btn-secondary {
    background-color: #fff;
    border: 1px solid ${COLORS.border};
    color: ${COLORS.textDark};
    padding: 10px 18px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background-color: #fcf6ef;
    border-color: #d4a574;
  }

  .btn-link {
    background: none;
    border: none;
    color: ${COLORS.accent};
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
  }

  .btn-flat {
    background: none;
    border: none;
    color: ${COLORS.accent};
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    width: 100%;
    text-align: center;
  }

  .btn-small-flat {
    background: none;
    border: 1px solid #ebdcd0;
    border-radius: 6px;
    color: ${COLORS.accent};
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .btn-small-flat i {
    font-size: 14px;
  }

  /* KPI layout */
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
    margin-bottom: 24px;
  }

  .kpi-card {
    background-color: #ffffff;
    border: 1px solid ${COLORS.border};
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.005);
  }

  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .kpi-title {
    font-size: 13px;
    color: ${COLORS.textMuted};
    font-weight: 600;
  }

  .kpi-icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .kpi-icon-wrapper i {
    font-size: 18px;
  }

  .kpi-icon-wrapper.retailers { background-color: rgba(212,165,116,0.1); color: ${COLORS.accent}; }
  .kpi-icon-wrapper.invoices { background-color: rgba(16,185,129,0.1); color: ${COLORS.success}; }
  .kpi-icon-wrapper.issued { background-color: rgba(245,158,11,0.1); color: ${COLORS.warning}; }
  .kpi-icon-wrapper.redeemed { background-color: rgba(59,130,246,0.1); color: ${COLORS.info}; }
  .kpi-icon-wrapper.rate { background-color: rgba(196,30,58,0.1); color: ${COLORS.primary}; }

  .kpi-value {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 6px 0;
  }

  .kpi-trend {
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .kpi-trend i {
    font-size: 13px;
  }

  .trend-up { color: ${COLORS.success}; }
  .trend-down { color: ${COLORS.primary}; }

  /* Mid content layouts */
  .mid-section {
    display: grid;
    grid-template-columns: 4.5fr 5.5fr;
    gap: 24px;
    margin-bottom: 24px;
  }

  .card {
    background-color: #ffffff;
    border: 1px solid ${COLORS.border};
    border-radius: 16px;
    padding: 24px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }

  /* Map Visualizer */
  .map-wrapper {
    height: 320px;
    position: relative;
    display: flex;
    justify-content: center;
  }

  .india-svg {
    height: 100%;
    max-width: 100%;
  }

  .map-marker-group {
    cursor: pointer;
  }

  .map-circle {
    transition: all 0.2s ease;
  }

  .map-marker-group:hover .map-circle {
    transform: scale(1.15);
    opacity: 1;
  }

  .map-circle-ping {
    transform-origin: center;
    animation: marker-ping 2s infinite ease-out;
  }

  .marker-label-bg {
    opacity: 0.85;
  }

  .map-tooltip {
    background: #1e1c19;
    color: #fff;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    pointer-events: none;
    z-index: 10;
    min-width: 140px;
  }

  .tooltip-title {
    font-size: 12px;
    font-weight: bold;
    margin: 0 0 4px;
    color: ${COLORS.accent};
  }

  .tooltip-value {
    font-size: 11px;
    margin: 0 0 2px;
  }

  .tooltip-desc {
    font-size: 9px;
    color: #999;
    margin: 0;
  }

  @keyframes marker-ping {
    0% { transform: scale(0.6); opacity: 0.8; }
    100% { transform: scale(1.4); opacity: 0; }
  }

  .map-legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
  }

  .legend-label {
    font-size: 11px;
    color: ${COLORS.textMuted};
    font-weight: 600;
  }

  .legend-gradient {
    flex: 1;
    height: 6px;
    background: linear-gradient(90deg, #e5be93, #b88958);
    margin: 0 16px;
    border-radius: 3px;
  }

  /* Table generic */
  .table-responsive {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table th {
    font-size: 11px;
    color: ${COLORS.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
    padding: 12px 16px;
    border-bottom: 1px solid ${COLORS.border};
    text-align: left;
  }

  .table td {
    padding: 14px 16px;
    border-bottom: 1px solid ${COLORS.border};
    font-size: 13px;
  }

  .text-right {
    text-align: right !important;
  }

  .rank-badge {
    display: inline-flex;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
  }

  .rank-1 { background-color: #f7ede0; color: ${COLORS.accent}; }
  .rank-2 { background-color: #f3f4f6; color: #4b5563; }
  .rank-3 { background-color: #fef3c7; color: #d97706; }
  .rank-4, .rank-5 { background-color: #f3f4f6; color: #9ca3af; }

  .tag-rate {
    background-color: rgba(16,185,129,0.1);
    color: ${COLORS.success};
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .card-footer {
    padding-top: 16px;
    border-top: 1px solid ${COLORS.border};
    margin-top: 10px;
  }

  /* Bottom visual grid */
  .bottom-section {
    display: grid;
    grid-template-columns: 3.5fr 3fr 3.5fr;
    gap: 24px;
  }

  /* Top products performance styles */
  .product-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .product-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px dashed ${COLORS.border};
  }

  .product-row:last-child {
    border: none;
  }

  .product-img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid ${COLORS.border};
  }

  .product-details {
    flex: 1;
  }

  .product-name {
    font-size: 13px;
    font-weight: bold;
    display: block;
    margin-bottom: 4px;
  }

  .product-meta {
    font-size: 11px;
    color: ${COLORS.textMuted};
    display: flex;
    gap: 12px;
  }

  .product-stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-points {
    font-size: 13px;
    font-weight: bold;
    color: ${COLORS.accent};
  }

  .stat-rate {
    font-size: 11px;
    color: ${COLORS.success};
    font-weight: 700;
  }

  /* Donut chart */
  .donut-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .donut-svg-wrapper {
    position: relative;
    width: 140px;
    height: 140px;
  }

  .donut-svg {
    width: 100%;
    height: 100%;
  }

  .donut-center-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .center-value {
    font-size: 20px;
    font-weight: 800;
  }

  .center-label {
    font-size: 10px;
    color: ${COLORS.textMuted};
    text-transform: uppercase;
    font-weight: 600;
  }

  .donut-legend {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .legend-color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-texts {
    display: flex;
    justify-content: space-between;
    flex: 1;
    font-size: 12px;
  }

  .legend-title {
    color: ${COLORS.textMuted};
  }

  .legend-val {
    font-weight: 700;
  }

  /* Top Redeemed Lists */
  .redeemed-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .redeemed-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 10px;
    background-color: #fff9f2;
    border: 1px solid ${COLORS.border};
  }

  .redeemed-rank-circle {
    font-size: 11px;
    font-weight: 800;
    color: ${COLORS.accent};
  }

  .redeemed-icon-brand {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background-color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;
    border: 1px solid ${COLORS.border};
    color: ${COLORS.textDark};
  }

  .redeemed-info {
    flex: 1;
  }

  .redeemed-name {
    font-size: 12px;
    font-weight: bold;
  }

  .redeemed-count {
    display: flex;
    flex-direction: column;
  }

  /* Generic Table cards */
  .table-card {
    padding: 0;
    overflow: hidden;
  }

  .table-header-filters {
    padding: 20px 24px;
    border-bottom: 1px solid ${COLORS.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid ${COLORS.border};
    background-color: #fff;
    border-radius: 8px;
    width: 320px;
  }

  .search-box i {
    font-size: 18px;
    color: ${COLORS.textMuted};
  }

  .search-box input {
    border: none;
    outline: none;
    font-size: 13px;
    width: 100%;
    background: none;
  }

  .status-badge {
    padding: 4px 8px;
    font-size: 11px;
    font-weight: bold;
    border-radius: 6px;
    display: inline-block;
  }

  .status-badge.active { background-color: rgba(16,185,129,0.1); color: ${COLORS.success}; }
  .status-badge.inactive { background-color: rgba(156,163,175,0.1); color: #6b7280; }

  /* Invoice Scan Badges */
  .confidence-badge {
    padding: 2px 6px;
    font-size: 9px;
    font-weight: 800;
    border-radius: 4px;
  }

  .confidence-badge.high { background-color: rgba(16,185,129,0.1); color: ${COLORS.success}; }
  .confidence-badge.medium { background-color: rgba(245,158,11,0.1); color: ${COLORS.warning}; }
  .confidence-badge.low { background-color: rgba(196,30,58,0.1); color: ${COLORS.primary}; }

  .status-badge.status-verified { background-color: rgba(16,185,129,0.1); color: ${COLORS.success}; }
  .status-badge.status-submitted { background-color: rgba(245,158,11,0.1); color: ${COLORS.warning}; }
  .status-badge.status-rejected { background-color: rgba(196,30,58,0.1); color: ${COLORS.primary}; }

  /* Rewards tab */
  .rewards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .reward-item-card {
    background-color: #fff;
    border: 1px solid ${COLORS.border};
    border-radius: 16px;
    padding: 24px;
    text-align: center;
  }

  .reward-icon-badge {
    width: 48px;
    height: 48px;
    background-color: rgba(212,165,116,0.1);
    color: ${COLORS.accent};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin: 0 auto 16px;
  }

  .reward-item-title {
    font-size: 14px;
    font-weight: bold;
    margin: 0 0 6px;
  }

  .reward-item-desc {
    font-size: 12px;
    color: ${COLORS.textMuted};
    margin: 0 0 10px;
    line-height: 1.4;
  }

  .reward-item-points {
    font-size: 13px;
    font-weight: 800;
    color: ${COLORS.primary};
    margin: 0;
  }

  .reward-item-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: ${COLORS.textMuted};
    margin-top: 12px;
    border-top: 1px dashed ${COLORS.border};
    padding-top: 10px;
  }

  /* Invoices Scan details modal overlay */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 16px;
    width: 600px;
    max-width: 90%;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    overflow: hidden;
  }

  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid ${COLORS.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: bold;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: ${COLORS.textMuted};
  }

  .modal-body {
    padding: 24px;
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    font-size: 11px;
    color: ${COLORS.textMuted};
    text-transform: uppercase;
    font-weight: bold;
  }

  .detail-val {
    font-size: 13px;
    font-weight: 600;
  }

  .invoice-products-section h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
  }

  .sub-table {
    width: 100%;
    border-collapse: collapse;
  }

  .sub-table th {
    padding: 8px 12px;
    font-size: 10px;
    text-transform: uppercase;
    color: ${COLORS.textMuted};
    border-bottom: 1px solid ${COLORS.border};
    text-align: left;
  }

  .sub-table td {
    padding: 10px 12px;
    font-size: 12px;
    border-bottom: 1px solid ${COLORS.border};
  }

  .invoice-total-summary {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid ${COLORS.border};
    font-size: 14px;
  }

  .invoice-total-summary strong {
    font-size: 18px;
    color: ${COLORS.accent};
  }

  .modal-footer {
    padding: 16px 24px;
    background-color: #faf8f5;
    border-top: 1px solid ${COLORS.border};
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
`;
