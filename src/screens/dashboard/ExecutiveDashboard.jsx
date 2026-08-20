import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../components/ui/Toast';

export const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const { inventory, monthlyTargets, pointCredits, supportTickets = [], resolveSupportTicket, approvePendingInvoice, rejectPendingInvoice } = useAppContext();

  useEffect(() => {
    document.documentElement.classList.add('full-page-mode');
    document.body.classList.add('full-page-mode');
    return () => {
      document.documentElement.classList.remove('full-page-mode');
      document.body.classList.remove('full-page-mode');
    };
  }, []);

  const exportGrievancesCSV = () => {
    const headers = ['Ticket ID', 'Retailer Shop Name', 'Retailer Phone', 'Category', 'Subject / Issue', 'Description', 'Invoice Ref', 'Assigned Wholesaler (Sub-DB)', 'Priority', 'Status', 'Logged Date'];
    const rows = (supportTickets || []).map(t => [
      t.ticket_id || t.id,
      `"${t.retailer_name || t.retailer || 'Retailer'}"`,
      t.retailer_phone || t.phone || '',
      `"${t.category || 'Other'}"`,
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.invoice_number || 'N/A',
      `"${t.assigned_to || 'Sub-DB Rep'}"`,
      t.priority || 'Medium',
      t.status || 'Open',
      t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ferrero_Retailer_Queries_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Downloaded Ferrero Retailer Queries Report CSV!', 'success');
  };

  // ─── FILTER STATES ────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('main'); // 'main' | 'invoices_page'
  const [invoicesPageTab, setInvoicesPageTab] = useState('pending'); // 'pending' | 'verified' | 'rejected'
  const [allInvoices, setAllInvoices] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [rejectionModalInv, setRejectionModalInv] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('Illegible OCR Scan');
  const [selectedPendingInv, setSelectedPendingInv] = useState(null);
  const [expandedSubDBs, setExpandedSubDBs] = useState({});

  const toggleSubDBExpand = (id) => {
    setExpandedSubDBs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loadPendingInvoices = async () => {
    try {
      const raw = localStorage.getItem('subdb_invoices');
      let list = raw ? JSON.parse(raw) : [];
      if (list.length === 0) {
        list = [
          { id: 'inv-demo-1', invoice_number: 'INV-4891', wholesaler_name: 'Gupta Ferrero Rocher Wholesaler', retailer_name: 'Kumar Sweet House', purchase_date: '2026-08-20', total_amount: 18450, status: 'pending', products: [{ name: 'Ferrero Rocher 16pc', qty: 20, unit: 'Box', price: 650 }, { name: 'Raffaello 20pc', qty: 10, unit: 'Box', price: 545 }] },
          { id: 'inv-demo-2', invoice_number: 'INV-4620', wholesaler_name: 'MP Premium Confectioners', retailer_name: 'Agrawal Mishthan Bhandar', purchase_date: '2026-08-19', total_amount: 14100, status: 'verified', products: [{ name: 'Ferrero Rocher 48pc', qty: 10, unit: 'Box', price: 1410 }] },
          { id: 'inv-demo-3', invoice_number: 'INV-4211', wholesaler_name: 'Rajesh Sharma Wholesale', retailer_name: 'Patel Gift Store', purchase_date: '2026-08-18', total_amount: 9800, status: 'rejected', rejection_reason: 'Price Mismatch with Wholesale Rates', products: [{ name: 'Golden Gallery 18pc', qty: 8, unit: 'Box', price: 1225 }] }
        ];
      }
      setAllInvoices(list);
      setPendingInvoices(list.filter(i => i.status === 'pending'));
    } catch (e) {}
  };

  useEffect(() => {
    loadPendingInvoices();
    const interval = setInterval(loadPendingInvoices, 3000);
    return () => clearInterval(interval);
  }, []);

  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedASM, setSelectedASM] = useState('all');
  const [selectedSubDB, setSelectedSubDB] = useState('all');
  const [selectedRetailer, setSelectedRetailer] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('aug2026');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTableView, setActiveTableView] = useState('retailers'); // 'retailers' | 'subdb' | 'asm' | 'monthly_matrix' | 'sku'
  const [drilldownMonth, setDrilldownMonth] = useState('aug'); // 'jun' | 'jul' | 'aug'

  // ─── MASTER SUB-DB DATA ───────────────────────────────────────────────────
  const allSubDBData = [
    {
      id: 'subdb-1',
      name: 'Rajesh Sharma',
      empId: 'EMP-4821',
      reportingManager: 'Vikram Malhotra (ASM)',
      zone: 'Central',
      territory: 'Indore & Ujjain',
      retailersCount: 28,
      invoicesLogged: 142,
      boxesRestocked: 485,
      totalWholesaleSpend: 542000,
      targetQuota: 500,
      targetPct: 97,
      status: 'Top Performer',
      phone: '9826011234',
      topSKU: 'Ferrero Rocher 16pc'
    },
    {
      id: 'subdb-2',
      name: 'Manoj Patidar',
      empId: 'EMP-4822',
      reportingManager: 'Vikram Malhotra (ASM)',
      zone: 'Central',
      territory: 'Bhopal & Sehore',
      retailersCount: 24,
      invoicesLogged: 118,
      boxesRestocked: 390,
      totalWholesaleSpend: 436800,
      targetQuota: 450,
      targetPct: 86,
      status: 'On Track',
      phone: '9826022345',
      topSKU: 'Raffaello 20pc'
    },
    {
      id: 'subdb-3',
      name: 'Suresh Yadav',
      empId: 'EMP-5104',
      reportingManager: 'Amitabh Verma (ASM)',
      zone: 'North',
      territory: 'Delhi NCR (South)',
      retailersCount: 36,
      invoicesLogged: 184,
      boxesRestocked: 620,
      totalWholesaleSpend: 694400,
      targetQuota: 600,
      targetPct: 103,
      status: 'Target Achieved',
      phone: '9811033456',
      topSKU: 'Ferrero Rocher 48pc'
    },
    {
      id: 'subdb-4',
      name: 'Deepak Chouhan',
      empId: 'EMP-5105',
      reportingManager: 'Amitabh Verma (ASM)',
      zone: 'North',
      territory: 'Lucknow & Kanpur',
      retailersCount: 30,
      invoicesLogged: 132,
      boxesRestocked: 440,
      totalWholesaleSpend: 492800,
      targetQuota: 500,
      targetPct: 88,
      status: 'On Track',
      phone: '9811044567',
      topSKU: 'Ferrero Rocher 16pc'
    },
    {
      id: 'subdb-5',
      name: 'Sunil Deshmukh',
      empId: 'EMP-6201',
      reportingManager: 'Pooja Hegde (ASM)',
      zone: 'West',
      territory: 'Mumbai Suburbs',
      retailersCount: 42,
      invoicesLogged: 210,
      boxesRestocked: 710,
      totalWholesaleSpend: 795200,
      targetQuota: 700,
      targetPct: 101,
      status: 'Target Achieved',
      phone: '9820055678',
      topSKU: 'Golden Gallery 18pc'
    },
    {
      id: 'subdb-6',
      name: 'Praveen Gupta',
      empId: 'EMP-6202',
      reportingManager: 'Pooja Hegde (ASM)',
      zone: 'West',
      territory: 'Pune & PCMC',
      retailersCount: 31,
      invoicesLogged: 145,
      boxesRestocked: 490,
      totalWholesaleSpend: 548800,
      targetQuota: 550,
      targetPct: 89,
      status: 'On Track',
      phone: '9820066789',
      topSKU: 'Ferrero Rocher 16pc'
    },
    {
      id: 'subdb-7',
      name: 'K. Venkatesh',
      empId: 'EMP-7301',
      reportingManager: 'R. Soundararajan (ASM)',
      zone: 'South',
      territory: 'Bengaluru Central',
      retailersCount: 38,
      invoicesLogged: 175,
      boxesRestocked: 590,
      totalWholesaleSpend: 660800,
      targetQuota: 600,
      targetPct: 98,
      status: 'Top Performer',
      phone: '9845077890',
      topSKU: 'Ferrero Rocher 48pc'
    },
    {
      id: 'subdb-8',
      name: 'S. Anbarasan',
      empId: 'EMP-7302',
      reportingManager: 'R. Soundararajan (ASM)',
      zone: 'South',
      territory: 'Chennai & Tambaram',
      retailersCount: 32,
      invoicesLogged: 134,
      boxesRestocked: 450,
      totalWholesaleSpend: 504000,
      targetQuota: 500,
      targetPct: 90,
      status: 'On Track',
      phone: '9845088901',
      topSKU: 'Raffaello 20pc'
    }
  ];

  // ─── MASTER REPORTING MANAGERS (ASM) ──────────────────────────────────────
  const allASMData = [
    { id: 'asm-1', name: 'Vikram Malhotra', title: 'Area Sales Manager (MP-Central)', zone: 'Central', subDBCount: 2, subDBNames: ['Rajesh Sharma', 'Manoj Patidar'], totalRetailers: 52, totalInvoices: 260, totalBoxes: 875, totalSpend: 978800, targetAchievedPct: 92.1, topRep: 'Rajesh Sharma (97%)' },
    { id: 'asm-2', name: 'Amitabh Verma', title: 'Area Sales Manager (North-1)', zone: 'North', subDBCount: 2, subDBNames: ['Suresh Yadav', 'Deepak Chouhan'], totalRetailers: 66, totalInvoices: 316, totalBoxes: 1060, totalSpend: 1187200, targetAchievedPct: 96.3, topRep: 'Suresh Yadav (103%)' },
    { id: 'asm-3', name: 'Pooja Hegde', title: 'Area Sales Manager (West-2)', zone: 'West', subDBCount: 2, subDBNames: ['Sunil Deshmukh', 'Praveen Gupta'], totalRetailers: 73, totalInvoices: 355, totalBoxes: 1200, totalSpend: 1344000, targetAchievedPct: 96.0, topRep: 'Sunil Deshmukh (101%)' },
    { id: 'asm-4', name: 'R. Soundararajan', title: 'Area Sales Manager (South-1)', zone: 'South', subDBCount: 2, subDBNames: ['K. Venkatesh', 'S. Anbarasan'], totalRetailers: 70, totalInvoices: 309, totalBoxes: 1040, totalSpend: 1164800, targetAchievedPct: 94.5, topRep: 'K. Venkatesh (98%)' }
  ];

  // ─── MASTER RETAILER OUTLETS DATA (WITH MONTH-BY-MONTH HISTORY) ───────────
  const allRetailersData = [
    {
      id: 'ret-1',
      shop: 'Kumar Sweet House',
      owner: 'Ramesh Kumar',
      city: 'Indore',
      subDBId: 'subdb-1',
      subDB: 'Rajesh Sharma (EMP-4821)',
      asm: 'Vikram Malhotra (ASM)',
      zone: 'Central',
      invoices: 8,
      boxes: 38,
      spend: 42560,
      points: 1450,
      pan: 'ABCDE1234F',
      kyc: 'Verified',
      monthlyHistory: {
        jun: { month: 'June 2026', boxes: 26, spend: 29120, points: 980, targetPct: 86, invoices: 6, topSKU: 'Ferrero Rocher 16pc (14 bxs)' },
        jul: { month: 'July 2026', boxes: 34, spend: 38080, points: 1320, targetPct: 100, invoices: 7, topSKU: 'Ferrero Rocher 48pc (18 bxs)' },
        aug: { month: 'August 2026 (Live)', boxes: 38, spend: 42560, points: 1450, targetPct: 108, invoices: 8, topSKU: 'Golden Gallery 18pc (12 bxs)' }
      }
    },
    {
      id: 'ret-2',
      shop: 'Agrawal Mishthan Bhandar',
      owner: 'Sanjay Agrawal',
      city: 'Indore',
      subDBId: 'subdb-1',
      subDB: 'Rajesh Sharma (EMP-4821)',
      asm: 'Vikram Malhotra (ASM)',
      zone: 'Central',
      invoices: 10,
      boxes: 45,
      spend: 50400,
      points: 1820,
      pan: 'BCDEF2345G',
      kyc: 'Verified',
      monthlyHistory: {
        jun: { month: 'June 2026', boxes: 30, spend: 33600, points: 1100, targetPct: 90, invoices: 7, topSKU: 'Ferrero Rocher 16pc (18 bxs)' },
        jul: { month: 'July 2026', boxes: 40, spend: 44800, points: 1550, targetPct: 102, invoices: 9, topSKU: 'Raffaello 20pc (20 bxs)' },
        aug: { month: 'August 2026 (Live)', boxes: 45, spend: 50400, points: 1820, targetPct: 112, invoices: 10, topSKU: 'Ferrero Rocher 48pc (22 bxs)' }
      }
    },
    {
      id: 'ret-3',
      shop: 'Chhappan Sweets',
      owner: 'Nitin Jain',
      city: 'Bhopal',
      subDBId: 'subdb-2',
      subDB: 'Manoj Patidar (EMP-4822)',
      asm: 'Vikram Malhotra (ASM)',
      zone: 'Central',
      invoices: 7,
      boxes: 32,
      spend: 35840,
      points: 1200,
      pan: 'CDEFG3456H',
      kyc: 'Verified',
      monthlyHistory: {
        jun: { month: 'June 2026', boxes: 22, spend: 24640, points: 800, targetPct: 80, invoices: 5, topSKU: 'Ferrero Rocher 16pc (12 bxs)' },
        jul: { month: 'July 2026', boxes: 28, spend: 31360, points: 1050, targetPct: 92, invoices: 6, topSKU: 'Raffaello 20pc (14 bxs)' },
        aug: { month: 'August 2026 (Live)', boxes: 32, spend: 35840, points: 1200, targetPct: 96, invoices: 7, topSKU: 'Ferrero Rocher 48pc (15 bxs)' }
      }
    },
    {
      id: 'ret-4',
      shop: 'Bikanervala South Ex',
      owner: 'Harish Bikaneri',
      city: 'New Delhi',
      subDBId: 'subdb-3',
      subDB: 'Suresh Yadav (EMP-5104)',
      asm: 'Amitabh Verma (ASM)',
      zone: 'North',
      invoices: 14,
      boxes: 68,
      spend: 76160,
      points: 2950,
      pan: 'DEFGH4567I',
      kyc: 'Verified',
      monthlyHistory: {
        jun: { month: 'June 2026', boxes: 45, spend: 50400, points: 1900, targetPct: 95, invoices: 10, topSKU: 'Ferrero Rocher 48pc (24 bxs)' },
        jul: { month: 'July 2026', boxes: 58, spend: 64960, points: 2450, targetPct: 105, invoices: 12, topSKU: 'Golden Gallery 18pc (28 bxs)' },
        aug: { month: 'August 2026 (Live)', boxes: 68, spend: 76160, points: 2950, targetPct: 115, invoices: 14, topSKU: 'Ferrero Rocher 48pc (35 bxs)' }
      }
    },
    {
      id: 'ret-5',
      shop: 'Haldiram Sweets Connaught',
      owner: 'Rajeev Singhal',
      city: 'New Delhi',
      subDBId: 'subdb-3',
      subDB: 'Suresh Yadav (EMP-5104)',
      asm: 'Amitabh Verma (ASM)',
      zone: 'North',
      invoices: 12,
      boxes: 58,
      spend: 64960,
      points: 2400,
      pan: 'EFGHI5678J',
      kyc: 'Verified',
      monthlyHistory: {
        jun: { month: 'June 2026', boxes: 40, spend: 44800, points: 1650, targetPct: 90, invoices: 9, topSKU: 'Ferrero Rocher 16pc (22 bxs)' },
        jul: { month: 'July 2026', boxes: 50, spend: 56000, points: 2100, targetPct: 102, invoices: 11, topSKU: 'Raffaello 20pc (24 bxs)' },
        aug: { month: 'August 2026 (Live)', boxes: 58, spend: 64960, points: 2400, targetPct: 110, invoices: 12, topSKU: 'Ferrero Rocher 48pc (30 bxs)' }
      }
    },
    {
      id: 'ret-6',
      shop: 'Chitale Bandhu Mithaiwale',
      owner: 'Milind Chitale',
      city: 'Pune',
      subDBId: 'subdb-6',
      subDB: 'Praveen Gupta (EMP-6202)',
      asm: 'Pooja Hegde (ASM)',
      zone: 'West',
      invoices: 15,
      boxes: 72,
      spend: 80640,
      points: 3100,
      pan: 'FGHIJ6789K',
      kyc: 'Verified',
      monthlyHistory: {
        jun: { month: 'June 2026', boxes: 48, spend: 53760, points: 2050, targetPct: 94, invoices: 11, topSKU: 'Ferrero Rocher 16pc (26 bxs)' },
        jul: { month: 'July 2026', boxes: 62, spend: 69440, points: 2650, targetPct: 106, invoices: 13, topSKU: 'Golden Gallery 18pc (30 bxs)' },
        aug: { month: 'August 2026 (Live)', boxes: 72, spend: 80640, points: 3100, targetPct: 116, invoices: 15, topSKU: 'Ferrero Rocher 48pc (38 bxs)' }
      }
    },
    {
      id: 'ret-7',
      shop: 'K.C. Das Sweets',
      owner: 'Arunav Das',
      city: 'Bengaluru',
      subDBId: 'subdb-7',
      subDB: 'K. Venkatesh (EMP-7301)',
      asm: 'R. Soundararajan (ASM)',
      zone: 'South',
      invoices: 11,
      boxes: 52,
      spend: 58240,
      points: 2150,
      pan: 'GHIJK7890L',
      kyc: 'Verified',
      monthlyHistory: {
        jun: { month: 'June 2026', boxes: 35, spend: 39200, points: 1400, targetPct: 88, invoices: 8, topSKU: 'Ferrero Rocher 16pc (18 bxs)' },
        jul: { month: 'July 2026', boxes: 44, spend: 49280, points: 1800, targetPct: 98, invoices: 10, topSKU: 'Raffaello 20pc (22 bxs)' },
        aug: { month: 'August 2026 (Live)', boxes: 52, spend: 58240, points: 2150, targetPct: 106, invoices: 11, topSKU: 'Ferrero Rocher 48pc (26 bxs)' }
      }
    }
  ];

  // ─── SKU BREAKDOWN DATA ───────────────────────────────────────────────────
  const skuBreakdown = [
    { code: 'FR-16', name: 'Ferrero Rocher 16-Piece Gift Box', cat: 'Chocolates', boxes: 1840, sharePct: 44, value: 2060800, growth: '+22.4%' },
    { code: 'FR-48', name: 'Ferrero Rocher 48-Piece Pyramid Hamper', cat: 'Festive Hampers', boxes: 980, sharePct: 23, value: 1646400, growth: '+31.8%' },
    { code: 'RAF-20', name: 'Raffaello Coconut Confectionery 20pc', cat: 'Specialty Conf.', boxes: 820, sharePct: 20, value: 688800, growth: '+14.2%' },
    { code: 'GG-18', name: 'Ferrero Golden Gallery 18-Piece Luxe', cat: 'Luxury Assortment', boxes: 535, sharePct: 13, value: 469000, growth: '+18.6%' }
  ];

  // ─── DYNAMIC RETAILERS FILTER LIST ────────────────────────────────────────
  const filteredRetailers = useMemo(() => {
    return allRetailersData.filter(item => {
      const matchZone = selectedZone === 'all' || item.zone.toLowerCase() === selectedZone.toLowerCase();
      const matchASM = selectedASM === 'all' || item.asm.toLowerCase().includes(selectedASM.toLowerCase());
      const matchSubDB = selectedSubDB === 'all' || item.subDBId === selectedSubDB || item.subDB.toLowerCase().includes(selectedSubDB.toLowerCase());
      const matchRetailer = selectedRetailer === 'all' || item.id === selectedRetailer;
      const matchSearch = searchQuery === '' ||
        item.shop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subDB.toLowerCase().includes(searchQuery.toLowerCase());

      return matchZone && matchASM && matchSubDB && matchRetailer && matchSearch;
    });
  }, [selectedZone, selectedASM, selectedSubDB, selectedRetailer, searchQuery]);

  // ─── DYNAMIC SUB-DB FILTER LIST ───────────────────────────────────────────
  const filteredSubDBs = useMemo(() => {
    return allSubDBData.filter(item => {
      const matchZone = selectedZone === 'all' || item.zone.toLowerCase() === selectedZone.toLowerCase();
      const matchASM = selectedASM === 'all' || item.reportingManager.toLowerCase().includes(selectedASM.toLowerCase());
      const matchSubDB = selectedSubDB === 'all' || item.id === selectedSubDB;
      const matchSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reportingManager.toLowerCase().includes(searchQuery.toLowerCase());

      return matchZone && matchASM && matchSubDB && matchSearch;
    });
  }, [selectedZone, selectedASM, selectedSubDB, searchQuery]);

  // ─── MONTHLY METRICS CALCULATION (AGGREGATE VS SPECIFIC RETAILER) ─────────
  const isSpecificRetailerSelected = selectedRetailer !== 'all';
  const focusedRetailer = useMemo(() => {
    if (isSpecificRetailerSelected) {
      return allRetailersData.find(r => r.id === selectedRetailer) || allRetailersData[0];
    }
    return null;
  }, [selectedRetailer, isSpecificRetailerSelected]);

  // Aggregate monthly progression across all filtered retailers or individual retailer
  const monthlyMetrics = useMemo(() => {
    if (isSpecificRetailerSelected && focusedRetailer) {
      const h = focusedRetailer.monthlyHistory;
      return {
        jun: h.jun,
        jul: h.jul,
        aug: h.aug,
        total3MBorders: h.jun.boxes + h.jul.boxes + h.aug.boxes,
        total3MSpend: h.jun.spend + h.jul.spend + h.aug.spend,
        total3MPoints: h.jun.points + h.jul.points + h.aug.points,
        avg3MTargetPct: Math.round((h.jun.targetPct + h.jul.targetPct + h.aug.targetPct) / 3),
        scopeName: `${focusedRetailer.shop} · ${focusedRetailer.city} (${focusedRetailer.owner})`,
        scopeSubDB: `Assigned Sub-DB: ${focusedRetailer.subDB}`,
        scopeBadge: 'Individual Retailer Progression'
      };
    }

    // National / Territory Aggregate across all filtered sweet shops
    const junBoxes = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jun.boxes, 0);
    const junSpend = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jun.spend, 0);
    const junPts = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jun.points, 0);
    const junInvoices = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jun.invoices, 0);
    const junAvgTarget = Math.round(filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jun.targetPct, 0) / (filteredRetailers.length || 1));

    const julBoxes = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jul.boxes, 0);
    const julSpend = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jul.spend, 0);
    const julPts = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jul.points, 0);
    const julInvoices = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jul.invoices, 0);
    const julAvgTarget = Math.round(filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.jul.targetPct, 0) / (filteredRetailers.length || 1));

    const augBoxes = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.aug.boxes, 0);
    const augSpend = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.aug.spend, 0);
    const augPts = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.aug.points, 0);
    const augInvoices = filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.aug.invoices, 0);
    const augAvgTarget = Math.round(filteredRetailers.reduce((acc, r) => acc + r.monthlyHistory.aug.targetPct, 0) / (filteredRetailers.length || 1));

    return {
      jun: { month: 'June 2026', boxes: junBoxes, spend: junSpend, points: junPts, targetPct: junAvgTarget, invoices: junInvoices, topSKU: 'Ferrero Rocher 16pc (National Mix)' },
      jul: { month: 'July 2026', boxes: julBoxes, spend: julSpend, points: julPts, targetPct: julAvgTarget, invoices: julInvoices, topSKU: 'Ferrero Rocher 48pc & Raffaello Mix' },
      aug: { month: 'August 2026 (Live)', boxes: augBoxes, spend: augSpend, points: augPts, targetPct: augAvgTarget, invoices: augInvoices, topSKU: 'Ferrero Rocher 48pc Hamper (Festive Surge)' },
      total3MBorders: junBoxes + julBoxes + augBoxes,
      total3MSpend: junSpend + julSpend + augSpend,
      total3MPoints: junPts + julPts + augPts,
      avg3MTargetPct: Math.round((junAvgTarget + julAvgTarget + augAvgTarget) / 3),
      scopeName: `All Outlets Monthly Restock & Target Progression`,
      scopeSubDB: `Aggregated across ${filteredRetailers.length} Sweet Shops · ${filteredSubDBs.length} Sub-DB Reps`,
      scopeBadge: 'All Outlets National Aggregation'
    };
  }, [isSpecificRetailerSelected, focusedRetailer, filteredRetailers, filteredSubDBs]);

  // Aggregate KPI metrics based on filtered Retailers
  const totalSpend = filteredRetailers.reduce((acc, curr) => acc + curr.spend, 0);
  const totalBoxes = filteredRetailers.reduce((acc, curr) => acc + curr.boxes, 0);
  const totalInvoices = filteredRetailers.reduce((acc, curr) => acc + curr.invoices, 0);
  const totalPoints = filteredRetailers.reduce((acc, curr) => acc + curr.points, 0);

  // ─── FILTER STATUS CHECK ──────────────────────────────────────────────────
  const [showExportModal, setShowExportModal] = useState(false);

  const isAnyFilterActive = useMemo(() => {
    return (
      selectedZone !== 'all' ||
      selectedASM !== 'all' ||
      selectedSubDB !== 'all' ||
      selectedRetailer !== 'all' ||
      selectedPeriod !== 'aug2026' ||
      selectedCategory !== 'all' ||
      searchQuery.trim() !== '' ||
      isCustomDate
    );
  }, [selectedZone, selectedASM, selectedSubDB, selectedRetailer, selectedPeriod, selectedCategory, searchQuery, isCustomDate]);

  // ─── MASTER DATASET EXPORTER (TOP BUTTON) ──────────────────────────────────
  const downloadMasterDataset = (scope = 'entire') => {
    const dataToExport = scope === 'entire' ? allRetailersData : filteredRetailers;
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Ferrero_${scope === 'entire' ? 'National_Master' : 'Filtered'}_Report_${dateStr}.csv`;

    const headers = [
      'Retailer Shop Name', 'Owner Name', 'City', 'Zone', 'Reporting ASM', 'Sub-DB Field Rep',
      'June Restock Boxes', 'June Spend (INR)', 'June Target %',
      'July Restock Boxes', 'July Spend (INR)', 'July Target %',
      'August Restock Boxes', 'August Spend (INR)', 'August Target %',
      '3-Month Total Boxes', '3-Month Total Spend (INR)', '3-Month Total Points', 'Avg Quota %',
      'PAN Number', '194R KYC Status'
    ];

    const rows = dataToExport.map(rt => {
      const j = rt.monthlyHistory.jun;
      const jl = rt.monthlyHistory.jul;
      const a = rt.monthlyHistory.aug;
      const totBoxes = j.boxes + jl.boxes + a.boxes;
      const totSpend = j.spend + jl.spend + a.spend;
      const totPts = j.points + jl.points + a.points;
      const avgTarget = Math.round((j.targetPct + jl.targetPct + a.targetPct) / 3);

      return [
        `"${rt.shop}"`, `"${rt.owner}"`, rt.city, rt.zone, `"${rt.asm}"`, `"${rt.subDB}"`,
        j.boxes, j.spend, `${j.targetPct}%`,
        jl.boxes, jl.spend, `${jl.targetPct}%`,
        a.boxes, a.spend, `${a.targetPct}%`,
        totBoxes, totSpend, totPts, Math.round(totPts * 0.4), `${avgTarget}%`,
        rt.kyc
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📥 Exported ${scope === 'entire' ? 'Entire National Master' : 'Filtered Master'} Dataset (${dataToExport.length} outlets)!`, 'success');
  };

  const handleTopExportClick = () => {
    if (isAnyFilterActive) {
      setShowExportModal(true);
    } else {
      downloadMasterDataset('entire');
    }
  };

  // ─── SPECIFIC TABLE EXPORTER (BELOW TABLE BUTTON) ──────────────────────────
  const handleTableExportClick = () => {
    let headers = [];
    let rows = [];
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Ferrero_${activeTableView}_Table_Export_${dateStr}.csv`;

    if (activeTableView === 'retailers') {
      headers = ['Shop Name', 'Owner', 'City', 'Assigned Sub-DB', 'Reporting ASM', 'Zone', 'Invoices Logged', 'Boxes Credited (Aug)', 'Wholesale Spend (INR)', 'Points Earned', 'Points Redeemed', 'Voucher Value Redeemed (INR)', 'KYC Status'];
      rows = filteredRetailers.map(rt => [
        `"${rt.shop}"`, `"${rt.owner}"`, rt.city, `"${rt.subDB}"`, `"${rt.asm}"`, rt.zone, rt.invoices, rt.boxes, rt.spend, rt.points, Math.round(rt.points * 0.4), Math.round(rt.spend * 0.05), rt.kyc
      ]);
    } else if (activeTableView === 'monthly_matrix') {
      headers = ['Shop Name', 'City', 'Assigned Sub-DB Rep', 'Jun Boxes', 'Jun Spend (INR)', 'Jun Quota %', 'Jul Boxes', 'Jul Spend (INR)', 'Jul Quota %', 'Aug Boxes', 'Aug Spend (INR)', 'Aug Quota %', '3-Month Quota Avg'];
      rows = filteredRetailers.map(rt => [
        `"${rt.shop}"`, rt.city, `"${rt.subDB}"`,
        rt.monthlyHistory.jun.boxes, rt.monthlyHistory.jun.spend, `${rt.monthlyHistory.jun.targetPct}%`,
        rt.monthlyHistory.jul.boxes, rt.monthlyHistory.jul.spend, `${rt.monthlyHistory.jul.targetPct}%`,
        rt.monthlyHistory.aug.boxes, rt.monthlyHistory.aug.spend, `${rt.monthlyHistory.aug.targetPct}%`,
        `${Math.round((rt.monthlyHistory.jun.targetPct + rt.monthlyHistory.jul.targetPct + rt.monthlyHistory.aug.targetPct) / 3)}%`
      ]);
    } else if (activeTableView === 'subdb') {
      headers = ['Sub-DB Rep Name', 'Employee ID', 'Reporting Manager (ASM)', 'Zone', 'Territory', 'Connected Retailers', 'Bills Scanned', 'Boxes Restocked', 'Wholesale Spend (INR)', 'Top SKU', 'Status'];
      rows = filteredSubDBs.map(r => [
        `"${r.name}"`, r.empId, `"${r.reportingManager}"`, r.zone, `"${r.territory}"`, r.retailersCount, r.invoicesLogged, r.boxesRestocked, r.totalWholesaleSpend, `"${r.topSKU}"`, r.status
      ]);
    } else if (activeTableView === 'tickets') {
      headers = ['Ticket ID', 'Retailer Shop Name', 'Retailer Phone', 'Category', 'Subject / Issue', 'Description', 'Invoice Ref', 'Assigned Wholesaler (Sub-DB)', 'Priority', 'Status', 'Logged Date'];
      rows = supportTickets.map(t => [
        t.ticket_id || t.id,
        `"${t.retailer_name || t.retailer || 'Retailer'}"`,
        t.retailer_phone || t.phone || '',
        `"${t.category || 'Other'}"`,
        `"${(t.subject || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.invoice_number || 'N/A',
        `"${t.assigned_to || 'Sub-DB'}"`,
        t.priority || 'Medium',
        t.status || 'Open',
        t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'
      ]);
    } else if (activeTableView === 'asm') {
      headers = ['Area Sales Manager', 'Role', 'Zone', 'Supervised Sub-DBs', 'Total Retailers', 'Total Bills', 'Boxes Restocked', 'Wholesale Spend (INR)', 'Target %', 'Top Sub-DB Rep'];
      rows = allASMData.map(a => [
        `"${a.name}"`, `"${a.title}"`, a.zone, `"${a.subDBNames.join(', ')}"`, a.totalRetailers, a.totalInvoices, a.totalBoxes, a.totalSpend, `${a.targetAchievedPct}%`, `"${a.topRep}"`
      ]);
    } else {
      headers = ['SKU Code', 'Product Name', 'Category', 'Boxes Restocked', 'Share %', 'Wholesale Value (INR)', 'Growth MoM'];
      rows = skuBreakdown.map(s => [
        s.code, `"${s.name}"`, `"${s.cat}"`, s.boxes, `${s.sharePct}%`, s.value, s.growth
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📥 Exported current ${activeTableView.replace('_', ' ').toUpperCase()} view to Excel/CSV!`, 'success');
  };

  const handleResetFilters = () => {
    setSelectedZone('all');
    setSelectedASM('all');
    setSelectedSubDB('all');
    setSelectedRetailer('all');
    setSelectedPeriod('aug2026');
    setIsCustomDate(false);
    setStartDate('2026-08-01');
    setEndDate('2026-08-31');
    setSelectedCategory('all');
    setSearchQuery('');
    showToast('🔄 All filters reset to default National view', 'info');
  };

  if (currentView === 'invoices_page') {
    const verifiedInvoices = allInvoices.filter(i => i.status === 'verified');
    const rejectedInvoices = allInvoices.filter(i => i.status === 'rejected');
    const totalVerifiedAmt = verifiedInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0) || 542000;

    return (
      <div style={{ minHeight: '100vh', width: '100%', background: '#0d0806', color: '#f3f4f6', fontFamily: 'var(--fb, sans-serif)', padding: '2rem 3rem', overflowY: 'auto' }}>
        
        {/* ── DEDICATED PAGE HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid rgba(212,165,116,.25)', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '3.8rem', height: '3.8rem', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 6px 20px rgba(16,185,129,.3)' }}>
              🧾
            </div>
            <div>
              <span style={{ fontSize: '.75rem', fontWeight: 900, background: 'rgba(16,185,129,.2)', color: '#10b981', padding: '.2rem .6rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '.08em', border: '1px solid #10b981' }}>
                Executive Audit &amp; Sub-DB Verification Management Hub
              </span>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#fff', margin: '.3rem 0 0 0' }}>
                Sub-DB Invoices Verification &amp; Audit Hub
              </h1>
              <p style={{ fontSize: '.8rem', color: '#aaa', margin: '3px 0 0 0' }}>
                Audit submitted wholesaler bills, verify line items, approve stock &amp; target credits, or log rejection reasons with automated Sub-DB alerts.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('main')}
            style={{
              padding: '.75rem 1.5rem',
              background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: 900,
              fontSize: '.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '.5rem',
              boxShadow: '0 4px 16px rgba(212,165,116,0.3)'
            }}
          >
            ← Back to Main Dashboard
          </button>
        </div>

        {/* ── SUMMARY STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: '#160e0a', border: '1.5px solid #d4a574', borderRadius: '16px', padding: '1.25rem' }}>
            <p style={{ fontSize: '.72rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>⏳ Pending Approvals</p>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#d4a574', margin: '.2rem 0 0 0' }}>{pendingInvoices.length} Bills</p>
            <p style={{ fontSize: '.7rem', color: '#888', margin: '4px 0 0 0' }}>Awaiting executive audit</p>
          </div>

          <div style={{ background: '#160e0a', border: '1.5px solid #10b981', borderRadius: '16px', padding: '1.25rem' }}>
            <p style={{ fontSize: '.72rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>✅ Approved &amp; Verified</p>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: '.2rem 0 0 0' }}>{verifiedInvoices.length} Bills</p>
            <p style={{ fontSize: '.7rem', color: '#888', margin: '4px 0 0 0' }}>Credited to retailer stock</p>
          </div>

          <div style={{ background: '#160e0a', border: '1.5px solid #ef4444', borderRadius: '16px', padding: '1.25rem' }}>
            <p style={{ fontSize: '.72rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>✕ Rejected Log</p>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', margin: '.2rem 0 0 0' }}>{rejectedInvoices.length} Bills</p>
            <p style={{ fontSize: '.7rem', color: '#888', margin: '4px 0 0 0' }}>Sub-DB notification sent</p>
          </div>

          <div style={{ background: '#160e0a', border: '1.5px solid #38bdf8', borderRadius: '16px', padding: '1.25rem' }}>
            <p style={{ fontSize: '.72rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>🛡️ Total Audited Value</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', margin: '.2rem 0 0 0' }}>₹{totalVerifiedAmt.toLocaleString('en-IN')}</p>
            <p style={{ fontSize: '.7rem', color: '#888', margin: '4px 0 0 0' }}>Wholesale restock spend</p>
          </div>
        </div>

        {/* ── TAB FILTER BAR ── */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '.75rem' }}>
          {[
            { id: 'pending', label: `⏳ Pending Verification Queue (${pendingInvoices.length})`, color: '#d4a574' },
            { id: 'verified', label: `✅ Approved & Verified History (${verifiedInvoices.length})`, color: '#10b981' },
            { id: 'rejected', label: `✕ Rejected Invoices & Audit Trail (${rejectedInvoices.length})`, color: '#ef4444' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setInvoicesPageTab(tab.id)}
              style={{
                padding: '.7rem 1.4rem',
                borderRadius: '10px',
                background: invoicesPageTab === tab.id ? tab.color : 'rgba(255,255,255,0.04)',
                border: invoicesPageTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: invoicesPageTab === tab.id ? '#1d120d' : '#ccc',
                fontWeight: 900,
                fontSize: '.85rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: PENDING VERIFICATION QUEUE ── */}
        {invoicesPageTab === 'pending' && (
          <div>
            {pendingInvoices.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', background: '#160e0a', borderRadius: '16px', border: '1px border-dashed rgba(212,165,116,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: '#10b981', display: 'block', marginBottom: '.5rem' }}>task_alt</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0 }}>No Invoices Awaiting Audit</h3>
                <p style={{ fontSize: '.8rem', color: '#888', margin: '4px 0 0 0' }}>All submitted Sub-DB invoices have been processed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingInvoices.map((inv, idx) => (
                  <div key={inv.id || idx} style={{ background: '#160e0a', border: '1.5px solid #d4a574', borderRadius: '16px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.4rem' }}>
                        <span style={{ fontSize: '.7rem', fontWeight: 900, background: 'rgba(212,165,116,0.2)', color: '#d4a574', padding: '.2rem .6rem', borderRadius: '6px' }}>
                          #{inv.invoice_number}
                        </span>
                        <span style={{ fontSize: '.7rem', color: '#aaa' }}>📅 {inv.purchase_date}</span>
                        <span style={{ fontSize: '.68rem', fontWeight: 800, padding: '.15rem .5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                          Digital Scan Confidence: 98%
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', margin: '0 0 .2rem 0' }}>
                        🏪 {inv.retailer_name}
                      </h4>
                      <p style={{ fontSize: '.78rem', color: 'var(--g4)', fontWeight: 700, margin: '0 0 .4rem 0' }}>
                        Wholesaler (Sub-DB): {inv.wholesaler_name}
                      </p>

                      <p style={{ fontSize: '.75rem', color: '#ccc', margin: 0 }}>
                        📦 Line Items: {(inv.products || inv.items_json || []).map(p => `${p.name} (${p.qty} ${p.unit || 'Box'})`).join(' · ') || 'Ferrero Products'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.75rem', marginLeft: '2rem' }}>
                      <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981', margin: 0 }}>
                        ₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}
                      </p>
                      <div style={{ display: 'flex', gap: '.6rem' }}>
                        <button
                          onClick={async () => {
                            await approvePendingInvoice(inv.id);
                            loadPendingInvoices();
                          }}
                          style={{
                            padding: '.55rem 1.1rem', background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 900, fontSize: '.82rem', cursor: 'pointer'
                          }}
                        >
                          ✓ Approve &amp; Verify
                        </button>
                        <button
                          onClick={() => setRejectionModalInv(inv)}
                          style={{
                            padding: '.55rem 1rem', background: 'rgba(239,68,68,0.15)',
                            border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontWeight: 900, fontSize: '.82rem', cursor: 'pointer'
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: VERIFIED & APPROVED HISTORY ── */}
        {invoicesPageTab === 'verified' && (
          <div style={{ background: '#160e0a', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', borderBottom: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase', fontSize: '.72rem' }}>
                  <th style={{ padding: '1rem' }}>Invoice No</th>
                  <th style={{ padding: '1rem' }}>Retailer Shop</th>
                  <th style={{ padding: '1rem' }}>Wholesaler Sub-DB</th>
                  <th style={{ padding: '1rem' }}>Items Breakdown</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Points Disbursed</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {verifiedInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 900, color: '#fff' }}>#{inv.invoice_number}</td>
                    <td style={{ padding: '1rem', fontWeight: 800, color: '#d4a574' }}>🏪 {inv.retailer_name}</td>
                    <td style={{ padding: '1rem', color: '#ccc' }}>🏢 {inv.wholesaler_name}</td>
                    <td style={{ padding: '1rem', color: '#aaa', fontSize: '.78rem' }}>{(inv.products || []).map(p => `${p.name} (${p.qty})`).join(', ')}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, color: '#ffd060' }}>+5,000 pts</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '.68rem', fontWeight: 900, padding: '.25rem .6rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981' }}>
                        ✓ Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 3: REJECTED INVOICES LOG & AUDIT TRAIL ── */}
        {invoicesPageTab === 'rejected' && (
          <div style={{ background: '#160e0a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderBottom: '1px solid rgba(239,68,68,0.2)', textTransform: 'uppercase', fontSize: '.72rem' }}>
                  <th style={{ padding: '1rem' }}>Invoice No</th>
                  <th style={{ padding: '1rem' }}>Retailer Shop</th>
                  <th style={{ padding: '1rem' }}>Wholesaler Sub-DB</th>
                  <th style={{ padding: '1rem' }}>Rejection Reason</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Sub-DB Notification</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rejectedInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 900, color: '#fff' }}>#{inv.invoice_number}</td>
                    <td style={{ padding: '1rem', fontWeight: 800, color: '#d4a574' }}>🏪 {inv.retailer_name}</td>
                    <td style={{ padding: '1rem', color: '#ccc' }}>🏢 {inv.wholesaler_name}</td>
                    <td style={{ padding: '1rem', color: '#ef4444', fontWeight: 700 }}>⚠️ {inv.rejection_reason || 'Price Mismatch during Audit'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: '#aaa' }}>₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '.68rem', fontWeight: 800, padding: '.2rem .5rem', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                        Sent to Sub-DB
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '.68rem', fontWeight: 900, padding: '.25rem .6rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }}>
                        ✕ Rejected
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── REJECTION REASON MODAL ON PAGE ── */}
        {rejectionModalInv && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ background: '#160e0a', border: '2px solid #ef4444', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.9)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ef4444', margin: '0 0 .5rem 0' }}>
                ✕ Reject Invoice #{rejectionModalInv.invoice_number}
              </h3>
              <p style={{ fontSize: '.78rem', color: '#ccc', marginBottom: '1rem' }}>
                Logging a rejection will notify <strong>{rejectionModalInv.wholesaler_name}</strong> and move the bill to the rejected history log.
              </p>

              <label style={{ fontSize: '.7rem', fontWeight: 800, color: '#aaa', display: 'block', marginBottom: '.3rem' }}>Select Rejection Reason *</label>
              <select
                style={{ width: '100%', padding: '.65rem', background: '#221510', border: '1px solid #ef4444', borderRadius: '8px', color: '#fff', fontSize: '.82rem', marginBottom: '1.25rem' }}
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
              >
                <option value="Illegible / Unclear Scanned PDF Image">Illegible / Unclear Scanned PDF Image</option>
                <option value="Price Mismatch with Wholesale Master Rates">Price Mismatch with Wholesale Master Rates</option>
                <option value="Duplicate Invoice Submission">Duplicate Invoice Submission</option>
                <option value="Unregistered Retailer Outlet Account">Unregistered Retailer Outlet Account</option>
                <option value="Quantity Mismatch during Audit">Quantity Mismatch during Audit</option>
              </select>

              <div style={{ display: 'flex', gap: '.75rem' }}>
                <button
                  onClick={async () => {
                    await rejectPendingInvoice(rejectionModalInv.id, rejectionReasonInput);
                    setRejectionModalInv(null);
                    loadPendingInvoices();
                  }}
                  style={{ flex: 1.5, padding: '.75rem', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 900, fontSize: '.85rem', cursor: 'pointer' }}
                >
                  Confirm Rejection &amp; Notify Sub-DB
                </button>
                <button
                  onClick={() => setRejectionModalInv(null)}
                  style={{ flex: 1, padding: '.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid #666', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#0d0806', color: '#f3f4f6', fontFamily: 'var(--fb, sans-serif)', padding: '1.5rem 2.5rem', overflowY: 'auto' }}>
      
      {/* ══════════════════════════════════════════════════════════════════════════
          1. DESKTOP EXECUTIVE HEADER BAR
         ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1.5px solid rgba(212,165,116,.2)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', boxShadow: '0 4px 14px rgba(212,165,116,.3)' }}>
            🌰
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 900, background: 'rgba(212,165,116,.2)', color: 'var(--g4)', padding: '.2rem .6rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '.08em', border: '1px solid #d4a574' }}>
                Company Operations &amp; Retailer Intelligence
              </span>
              <span style={{ fontSize: '.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '.3rem', fontWeight: 700 }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Live Realtime
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: '.2rem 0 0 0', letterSpacing: '-.02em' }}>
              Ferrero India · Multi-Level Executive, Sub-DB &amp; Retailer Analytics
            </h1>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <button
            onClick={handleTopExportClick}
            style={{
              padding: '.65rem 1.25rem', background: 'linear-gradient(135deg, #d4a574, #b8860b)',
              border: 'none', borderRadius: '10px', color: '#1d120d', fontWeight: 900, fontSize: '.82rem',
              display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,165,116,.2)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>download</span>
            Download Excel / CSV
          </button>

          <button
            onClick={() => setCurrentView('invoices_page')}
            style={{
              padding: '.65rem 1.15rem', background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 900, fontSize: '.82rem',
              display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,.3)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>verified</span>
            📥 Verify Sub-DB Invoices {pendingInvoices.length > 0 ? `(${pendingInvoices.length} Pending)` : ''}
          </button>

          <button
            onClick={exportGrievancesCSV}
            style={{
              padding: '.65rem 1.1rem', background: 'rgba(212,165,116,0.15)',
              border: '1px solid #d4a574', borderRadius: '10px', color: '#d4a574', fontWeight: 900, fontSize: '.82rem',
              display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,165,116,.2)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>support_agent</span>
            📥 Grievances CSV Report
          </button>

          <button
            onClick={() => navigate('/home')}
            style={{
              padding: '.65rem 1.1rem', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(212,165,116,.3)', borderRadius: '10px', color: 'var(--g4)', fontWeight: 800, fontSize: '.82rem',
              display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>phone_iphone</span>
            Retailer App
          </button>

          <button
            onClick={() => navigate('/subdb_platform/login')}
            style={{
              padding: '.65rem 1.1rem', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(212,165,116,.3)', borderRadius: '10px', color: '#fff', fontWeight: 800, fontSize: '.82rem',
              display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>badge</span>
            Sub-DB Portal
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          2. COMPREHENSIVE MULTI-LEVEL FILTER CONTROL BAR (WITH RETAILER & DATES)
         ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#160e0a', border: '1.5px solid rgba(212,165,116,.25)', borderRadius: '16px',
        padding: '1.1rem 1.5rem', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        {/* Filter Bar Header with Reset Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--g4)', fontSize: '1.1rem' }}>tune</span>
            <span style={{ fontSize: '.78rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Multi-Level Filters &amp; Granular Parameters
            </span>
            {isAnyFilterActive ? (
              <span style={{ fontSize: '.68rem', fontWeight: 800, background: 'rgba(212,165,116,.2)', color: 'var(--g4)', padding: '.15rem .5rem', borderRadius: '9999px', border: '1px solid #d4a574' }}>
                Active Filters Applied
              </span>
            ) : (
              <span style={{ fontSize: '.68rem', color: '#888' }}>(Showing National All-Data)</span>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            style={{
              padding: '.35rem .85rem',
              background: isAnyFilterActive ? 'rgba(196,30,58,0.2)' : 'rgba(255,255,255,0.04)',
              border: isAnyFilterActive ? '1px solid #c41e3a' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: isAnyFilterActive ? '#ff8080' : '#888',
              fontWeight: 800, fontSize: '.74rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '.35rem', transition: 'all .2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '.9rem' }}>restart_alt</span>
            Reset Filters
          </button>
        </div>

        {/* Top Filter Row: Zone, ASM, Sub-DB, Retailer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          
          {/* 1. Zone */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
              🌍 Territory / Zone
            </label>
            <select
              value={selectedZone}
              onChange={e => { setSelectedZone(e.target.value); setSelectedSubDB('all'); setSelectedRetailer('all'); }}
              style={{ width: '100%', background: '#241711', border: '1px solid rgba(212,165,116,.3)', borderRadius: '8px', padding: '.55rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none' }}
            >
              <option value="all">All Zones (National)</option>
              <option value="central">Central Zone (MP/CG)</option>
              <option value="north">North Zone (NCR/UP)</option>
              <option value="west">West Zone (MH/GJ)</option>
              <option value="south">South Zone (KA/TN)</option>
            </select>
          </div>

          {/* 2. Reporting Manager (ASM) */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
              👔 Reporting Manager (ASM)
            </label>
            <select
              value={selectedASM}
              onChange={e => { setSelectedASM(e.target.value); setSelectedSubDB('all'); setSelectedRetailer('all'); }}
              style={{ width: '100%', background: '#241711', border: '1px solid rgba(212,165,116,.3)', borderRadius: '8px', padding: '.55rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none' }}
            >
              <option value="all">All Reporting Managers</option>
              <option value="Vikram Malhotra">Vikram Malhotra (ASM Central)</option>
              <option value="Amitabh Verma">Amitabh Verma (ASM North)</option>
              <option value="Pooja Hegde">Pooja Hegde (ASM West)</option>
              <option value="R. Soundararajan">R. Soundararajan (ASM South)</option>
            </select>
          </div>

          {/* 3. Sub-DB Representative */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
              📋 Sub-DB Field Rep
            </label>
            <select
              value={selectedSubDB}
              onChange={e => { setSelectedSubDB(e.target.value); setSelectedRetailer('all'); }}
              style={{ width: '100%', background: '#241711', border: '1px solid rgba(212,165,116,.3)', borderRadius: '8px', padding: '.55rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none' }}
            >
              <option value="all">All Sub-DB Reps ({filteredSubDBs.length})</option>
              {allSubDBData.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.empId}) - {s.territory}</option>
              ))}
            </select>
          </div>

          {/* 4. RETAILER LEVEL FILTER */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
              🏪 Specific Retailer Outlet
            </label>
            <select
              value={selectedRetailer}
              onChange={e => setSelectedRetailer(e.target.value)}
              style={{ width: '100%', background: '#241711', border: '1.5px solid #10b981', borderRadius: '8px', padding: '.55rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none', fontWeight: 700 }}
            >
              <option value="all">All Sweet Shops &amp; Outlets ({filteredRetailers.length})</option>
              {allRetailersData.map(r => (
                <option key={r.id} value={r.id}>{r.shop} ({r.city}) · {r.owner}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Bottom Filter Row: Date-wise Filtration, Category, Live Search */}
        <div style={{ display: 'grid', gridTemplateColumns: isCustomDate ? '1.5fr 1fr 1fr 1fr 1.5fr' : '1.5fr 1fr 1.5fr', gap: '1rem', alignItems: 'center' }}>
          
          {/* Period Selector */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
              📅 Date / Period Filtration
            </label>
            <select
              value={selectedPeriod}
              onChange={e => {
                const val = e.target.value;
                setSelectedPeriod(val);
                setIsCustomDate(val === 'custom');
              }}
              style={{ width: '100%', background: '#241711', border: '1px solid rgba(212,165,116,.3)', borderRadius: '8px', padding: '.55rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none' }}
            >
              <option value="aug2026">August 2026 (Live MTD)</option>
              <option value="jul2026">July 2026</option>
              <option value="jun2026">June 2026</option>
              <option value="q3fy26">Q3 FY2026 (Festive Quarter: Jul - Sep)</option>
              <option value="q2fy26">Q2 FY2026 (Apr - Jun)</option>
              <option value="all_ytd">All Historical (2026 YTD)</option>
              <option value="custom">⚙️ Custom Date Range...</option>
            </select>
          </div>

          {/* Custom Date Range Pickers (if enabled) */}
          {isCustomDate && (
            <>
              <div>
                <label style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ width: '100%', background: '#241711', border: '1px solid rgba(212,165,116,.3)', borderRadius: '8px', padding: '.5rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ width: '100%', background: '#241711', border: '1px solid rgba(212,165,116,.3)', borderRadius: '8px', padding: '.5rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none' }}
                />
              </div>
            </>
          )}

          {/* Category */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
              🎁 Product Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ width: '100%', background: '#241711', border: '1px solid rgba(212,165,116,.3)', borderRadius: '8px', padding: '.55rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none' }}
            >
              <option value="all">All Ferrero SKUs</option>
              <option value="rocher">Ferrero Rocher</option>
              <option value="raffaello">Raffaello</option>
              <option value="goldengallery">Golden Gallery</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', display: 'block', marginBottom: '.3rem' }}>
              🔍 Search Any Record / Outlet / PAN
            </label>
            <input
              type="text"
              placeholder="Search Retailer, Sub-DB, City, PAN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: '#241711', border: '1px solid rgba(212,165,116,.3)', borderRadius: '8px', padding: '.55rem .75rem', color: '#fff', fontSize: '.82rem', outline: 'none' }}
            />
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          3. EXECUTIVE TOP KPI METRIC TILES
         ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        
        <div style={{ background: '#160e0a', border: '1.5px solid #d4a574', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase' }}>Wholesale Spend</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '.3rem 0 0 0' }}>
            ₹{(totalSpend / 100000).toFixed(1)} <span style={{ fontSize: '.82rem', color: 'var(--g4)', fontWeight: 700 }}>Lakhs</span>
          </h2>
          <p style={{ fontSize: '.68rem', color: '#10b981', margin: '.2rem 0 0 0', fontWeight: 700 }}>↑ 18.2% vs last month</p>
        </div>

        <div style={{ background: '#160e0a', border: '1.5px solid #d4a574', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase' }}>Boxes Restocked</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '.3rem 0 0 0' }}>
            {totalBoxes.toLocaleString('en-IN')} <span style={{ fontSize: '.82rem', color: '#999', fontWeight: 700 }}>units</span>
          </h2>
          <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: '.2rem 0 0 0' }}>Filtered Period Total</p>
        </div>

        <div style={{ background: '#160e0a', border: '1.5px solid #d4a574', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase' }}>Active Sweet Shops</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981', margin: '.3rem 0 0 0' }}>
            {filteredRetailers.length} <span style={{ fontSize: '.82rem', color: '#999', fontWeight: 700 }}>outlets</span>
          </h2>
          <p style={{ fontSize: '.68rem', color: '#10b981', margin: '.2rem 0 0 0', fontWeight: 700 }}>100% KYC verified</p>
        </div>

        <div style={{ background: '#160e0a', border: '1.5px solid #d4a574', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase' }}>Sub-DB Field Reps</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--g4)', margin: '.3rem 0 0 0' }}>
            {filteredSubDBs.length} <span style={{ fontSize: '.82rem', color: '#999', fontWeight: 700 }}>reps</span>
          </h2>
          <p style={{ fontSize: '.68rem', color: 'var(--t3)', margin: '.2rem 0 0 0' }}>Under {allASMData.length} ASMs</p>
        </div>

        <div style={{ background: '#160e0a', border: '1.5px solid #d4a574', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase' }}>Points Distributed</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffd060', margin: '.3rem 0 0 0' }}>
            {totalPoints.toLocaleString('en-IN')} <span style={{ fontSize: '.82rem', color: '#999', fontWeight: 700 }}>pts</span>
          </h2>
          <p style={{ fontSize: '.68rem', color: '#10b981', margin: '.2rem 0 0 0', fontWeight: 700 }}>Dual loyalty ledger</p>
        </div>

        <div style={{ background: '#160e0a', border: '1.5px solid #d4a574', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase' }}>Invoices Logged</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '.3rem 0 0 0' }}>
            {totalInvoices} <span style={{ fontSize: '.82rem', color: '#999', fontWeight: 700 }}>bills</span>
          </h2>
          <p style={{ fontSize: '.68rem', color: 'var(--g4)', margin: '.2rem 0 0 0', fontWeight: 700 }}>100% Digital Verification</p>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          4. INTERACTIVE MONTHLY BAR CHART & DRILL-DOWN (PER RETAILER & TERRITORY)
         ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* CHART: MONTH-BY-MONTH RESTOCK BARS (AGGREGATE OR SPECIFIC RETAILER) */}
        <div style={{ background: '#160e0a', border: '1.5px solid rgba(212,165,116,.3)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{
                  fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', padding: '.15rem .5rem', borderRadius: '4px',
                  background: isSpecificRetailerSelected ? 'rgba(16,185,129,.12)' : 'rgba(212,165,116,.15)',
                  color: isSpecificRetailerSelected ? '#10b981' : 'var(--g4)',
                  border: `1px solid ${isSpecificRetailerSelected ? '#10b981' : '#d4a574'}`
                }}>
                  {monthlyMetrics.scopeBadge}
                </span>
                <span style={{ fontSize: '.72rem', color: 'var(--t3)' }}>
                  <strong style={{ color: 'var(--g4)' }}>{monthlyMetrics.scopeSubDB}</strong>
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: '.3rem 0 0 0' }}>
                {monthlyMetrics.scopeName}
              </h3>
            </div>

            {/* Drilldown Month Buttons */}
            <div style={{ display: 'flex', gap: '.4rem', background: '#241711', padding: '.25rem', borderRadius: '8px', border: '1px solid rgba(212,165,116,.2)' }}>
              {['jun', 'jul', 'aug'].map(m => (
                <button
                  key={m}
                  onClick={() => setDrilldownMonth(m)}
                  style={{
                    padding: '.35rem .75rem', borderRadius: '6px',
                    background: drilldownMonth === m ? 'linear-gradient(135deg, #d4a574, #c41e3a)' : 'transparent',
                    border: 'none', color: drilldownMonth === m ? '#1d120d' : '#888',
                    fontWeight: 800, fontSize: '.72rem', cursor: 'pointer', textTransform: 'uppercase'
                  }}
                >
                  {m === 'jun' ? 'June' : m === 'jul' ? 'July' : 'August (Live)'}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Month Bar Chart */}
          <div style={{ height: '170px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', paddingBottom: '.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { id: 'jun', label: 'June 2026', data: monthlyMetrics.jun, height: `${Math.min(100, Math.max(25, (monthlyMetrics.jun.boxes / (isSpecificRetailerSelected ? 80 : 450)) * 100))}%` },
              { id: 'jul', label: 'July 2026', data: monthlyMetrics.jul, height: `${Math.min(100, Math.max(30, (monthlyMetrics.jul.boxes / (isSpecificRetailerSelected ? 80 : 450)) * 100))}%` },
              { id: 'aug', label: 'August 2026 (Live)', data: monthlyMetrics.aug, height: `${Math.min(100, Math.max(35, (monthlyMetrics.aug.boxes / (isSpecificRetailerSelected ? 80 : 450)) * 100))}%` }
            ].map(col => {
              const isSelected = drilldownMonth === col.id;
              return (
                <div
                  key={col.id}
                  onClick={() => setDrilldownMonth(col.id)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end',
                    cursor: 'pointer', opacity: isSelected ? 1 : 0.65, transition: 'all .2s'
                  }}
                >
                  <span style={{ fontSize: '.75rem', fontWeight: 900, color: isSelected ? 'var(--g4)' : '#aaa', marginBottom: '.3rem' }}>
                    {col.data.boxes.toLocaleString('en-IN')} Boxes ({col.data.targetPct}%)
                  </span>
                  <div style={{
                    width: '100%', height: col.height,
                    background: isSelected ? 'linear-gradient(180deg, #d4a574, #c41e3a)' : '#332017',
                    borderRadius: '8px 8px 0 0', border: isSelected ? '1.5px solid #ffd060' : 'none',
                    boxShadow: isSelected ? '0 0 16px rgba(212,165,116,.4)' : 'none'
                  }}></div>
                  <span style={{ fontSize: '.75rem', color: isSelected ? '#fff' : '#999', marginTop: '.5rem', fontWeight: 800 }}>
                    {col.label}
                  </span>
                  <span style={{ fontSize: '.68rem', color: 'var(--g4)', fontWeight: 700 }}>
                    ₹{(col.data.spend / (isSpecificRetailerSelected ? 1 : 100000)).toFixed(1)} {isSpecificRetailerSelected ? '' : 'Lakhs'} · +{col.data.points.toLocaleString('en-IN')} pts
                  </span>
                </div>
              );
            })}
          </div>

          {/* Month Summary Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '.78rem', color: '#999' }}>
            <span>3-Month Cumulative: <strong style={{ color: '#fff' }}>{monthlyMetrics.total3MBorders.toLocaleString('en-IN')} Boxes (₹{(monthlyMetrics.total3MSpend / 100000).toFixed(1)} Lakhs)</strong></span>
            <span>Average Target Completion: <strong style={{ color: '#10b981' }}>{monthlyMetrics.avg3MTargetPct}%</strong></span>
          </div>
        </div>

        {/* MONTHLY BIFURCATION DRILL-DOWN CARD */}
        <div style={{ background: '#160e0a', border: '1.5px solid rgba(212,165,116,.3)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase' }}>
                Month Bifurcation Details
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', margin: '.2rem 0 0 0' }}>
                {drilldownMonth === 'jun' ? 'June 2026' : drilldownMonth === 'jul' ? 'July 2026' : 'August 2026 (Live)'} Breakdown
              </h3>
            </div>
            <span style={{
              fontSize: '.7rem', fontWeight: 800, padding: '.25rem .6rem', borderRadius: '9999px',
              background: monthlyMetrics[drilldownMonth].targetPct >= 100 ? 'rgba(16,185,129,.15)' : 'rgba(212,165,116,.15)',
              color: monthlyMetrics[drilldownMonth].targetPct >= 100 ? '#10b981' : 'var(--g4)',
              border: `1px solid ${monthlyMetrics[drilldownMonth].targetPct >= 100 ? '#10b981' : '#d4a574'}`
            }}>
              {monthlyMetrics[drilldownMonth].targetPct}% Quota Met
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', fontSize: '.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#888' }}>Wholesale Restock Value</span>
              <strong style={{ color: '#fff' }}>₹{monthlyMetrics[drilldownMonth].spend.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#888' }}>Total Restocked Boxes</span>
              <strong style={{ color: 'var(--g4)' }}>{monthlyMetrics[drilldownMonth].boxes.toLocaleString('en-IN')} Boxes</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#888' }}>Top Ordered SKU</span>
              <strong style={{ color: '#fff' }}>{monthlyMetrics[drilldownMonth].topSKU}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#888' }}>Sub-DB Invoices Processed</span>
              <strong style={{ color: '#fff' }}>{monthlyMetrics[drilldownMonth].invoices} verified bills</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0' }}>
              <span style={{ color: '#888' }}>Points Credited &amp; TDS</span>
              <strong style={{ color: '#ffd060' }}>+{monthlyMetrics[drilldownMonth].points.toLocaleString('en-IN')} pts · 10% TDS (194R)</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          5. MULTI-LEVEL DATA TABLES SECTION WITH 5 TAB VIEWS
         ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: '#160e0a', border: '1.5px solid rgba(212,165,116,.25)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>
        
        {/* Table View Switcher Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid rgba(212,165,116,.2)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '.6rem' }}>
            {[
              { id: 'retailers', label: 'By Retailer Outlet Accounts', icon: 'storefront', count: filteredRetailers.length },
              { id: 'monthly_matrix', label: 'Monthly Quota & Restock Matrix', icon: 'calendar_month', count: filteredRetailers.length },
              { id: 'subdb', label: 'By Sub-DB Representative', icon: 'badge', count: filteredSubDBs.length },
              { id: 'asm', label: 'By Reporting Manager (ASM Rollup)', icon: 'supervisor_account', count: allASMData.length },
              { id: 'sku', label: 'By Product SKU Performance', icon: 'inventory_2', count: skuBreakdown.length },
              { id: 'hierarchy', label: 'Sub-DB Retailer Hierarchy Tree', icon: 'account_tree', count: filteredSubDBs.length },
              { id: 'tickets', label: 'Grievances & Dispute Tickets', icon: 'support_agent', count: supportTickets.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTableView(tab.id)}
                style={{
                  padding: '.6rem 1.1rem', borderRadius: '10px',
                  background: activeTableView === tab.id ? 'linear-gradient(135deg, #d4a574, #c41e3a)' : 'rgba(255,255,255,0.04)',
                  border: activeTableView === tab.id ? 'none' : '1px solid rgba(212,165,116,.2)',
                  color: activeTableView === tab.id ? '#1d120d' : '#999',
                  fontWeight: 900, fontSize: '.8rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '.4rem', transition: 'all .2s'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{tab.icon}</span>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <button
            onClick={handleTableExportClick}
            style={{
              background: 'transparent', border: '1px solid rgba(212,165,116,.4)', borderRadius: '8px',
              padding: '.45rem .9rem', color: 'var(--g4)', fontSize: '.75rem', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '.3rem'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '.9rem' }}>file_download</span>
            Export Current Table ({activeTableView.replace('_', ' ').toUpperCase()})
          </button>
        </div>

                {/* ─── TABLE: PENDING INVOICE APPROVALS QUEUE ─── */}
        {activeTableView === 'pending_invoices' && (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#10b981', margin: 0 }}>📥 Pending Sub-DB Invoice Verification Queue</h3>
                <p style={{ fontSize: '.75rem', color: '#999', margin: '2px 0 0 0' }}>Review and approve submitted invoices to credit retailer stock, advance target quotas, and trigger point rewards.</p>
              </div>
            </div>

            {(pendingInvoices.length === 0) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px border-dashed rgba(212,165,116,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#10b981', display: 'block', marginBottom: '.5rem' }}>task_alt</span>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 .25rem 0' }}>No Invoices Pending Verification</p>
                <p style={{ fontSize: '.75rem', color: '#888', margin: 0 }}>All submitted Sub-DB invoices have been audited and approved.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.84rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(16,185,129,.1)', borderBottom: '2px solid #10b981', color: '#10b981', textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>
                    <th style={{ padding: '.9rem 1rem' }}>Invoice Ref</th>
                    <th style={{ padding: '.9rem 1rem' }}>Retailer Shop</th>
                    <th style={{ padding: '.9rem 1rem' }}>Sub-DB Wholesaler</th>
                    <th style={{ padding: '.9rem 1rem' }}>Scanned Products</th>
                    <th style={{ padding: '.9rem 1rem', textAlign: 'right' }}>Total Amount</th>
                    <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Scan Confidence</th>
                    <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvoices.map((inv, idx) => (
                    <tr key={inv.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '.9rem 1rem', fontWeight: 900, color: '#fff' }}>#{inv.invoice_number}</td>
                      <td style={{ padding: '.9rem 1rem', fontWeight: 800, color: '#d4a574' }}>🏪 {inv.retailer_name}</td>
                      <td style={{ padding: '.9rem 1rem', color: '#ccc' }}>🏢 {inv.wholesaler_name}</td>
                      <td style={{ padding: '.9rem 1rem', color: '#aaa', fontSize: '.78rem' }}>
                        {(inv.products || inv.items_json || []).map(p => `${p.name} (${p.qty})`).join(', ') || 'Ferrero Products'}
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '.68rem', fontWeight: 800, padding: '.2rem .5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                          High (98%)
                        </span>
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedPendingInv(inv)}
                          style={{
                            padding: '.4rem .9rem', background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 900, fontSize: '.75rem', cursor: 'pointer'
                          }}
                        >
                          Verify &amp; Approve →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}


        {/* ─── TABLE 1: BY RETAILER OUTLET ACCOUNTS ─── */}
        {activeTableView === 'retailers' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.84rem' }}>
              <thead>
                <tr style={{ background: 'rgba(212,165,116,.08)', borderBottom: '2px solid rgba(212,165,116,.3)', color: 'var(--g4)', textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>
                  <th style={{ padding: '.9rem 1rem' }}>Retailer Shop</th>
                  <th style={{ padding: '.9rem 1rem' }}>Owner &amp; Location</th>
                  <th style={{ padding: '.9rem 1rem' }}>Assigned Sub-DB Rep</th>
                  <th style={{ padding: '.9rem 1rem' }}>Reporting ASM</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Invoices</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Boxes Credited</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'right' }}>Wholesale Spend</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Points Earned</th>
                  <th style={{ padding: '.9rem 1rem' }}>PAN &amp; KYC Status</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRetailers.map((ret, idx) => (
                  <tr key={ret.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: selectedRetailer === ret.id ? 'rgba(212,165,116,0.12)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '.9rem 1rem' }}>
                      <p style={{ fontWeight: 800, color: '#fff', margin: 0 }}>{ret.shop}</p>
                      <span style={{ fontSize: '.7rem', color: 'var(--g4)' }}>{ret.city} ({ret.zone} Zone)</span>
                    </td>
                    <td style={{ padding: '.9rem 1rem', fontWeight: 700 }}>{ret.owner}</td>
                    <td style={{ padding: '.9rem 1rem', color: 'var(--g4)', fontWeight: 700 }}>{ret.subDB}</td>
                    <td style={{ padding: '.9rem 1rem', color: '#999' }}>{ret.asm}</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800 }}>{ret.invoices} bills</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--g4)' }}>{ret.boxes} bxs</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'right', fontWeight: 900, color: '#fff' }}>₹{ret.spend.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 900, color: '#ffd060' }}>+{ret.points} pts</td>
                    <td style={{ padding: '.9rem 1rem' }}>
                      <span style={{ fontSize: '.68rem', fontWeight: 800, background: 'rgba(16,185,129,.15)', border: '1px solid #10b981', color: '#10b981', padding: '.2rem .55rem', borderRadius: '9999px' }}>
                        ✓ {ret.pan}
                      </span>
                    </td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedRetailer(selectedRetailer === ret.id ? 'all' : ret.id)}
                        style={{
                          padding: '.35rem .75rem', borderRadius: '6px',
                          background: selectedRetailer === ret.id ? 'var(--g4)' : 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(212,165,116,.3)', color: selectedRetailer === ret.id ? '#1d120d' : 'var(--g4)',
                          fontWeight: 800, fontSize: '.72rem', cursor: 'pointer'
                        }}
                      >
                        {selectedRetailer === ret.id ? 'Viewing (Reset)' : 'Focus Chart'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TABLE 2: MONTHLY QUOTA & RESTOCK MATRIX ─── */}
        {activeTableView === 'monthly_matrix' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.84rem' }}>
              <thead>
                <tr style={{ background: 'rgba(212,165,116,.08)', borderBottom: '2px solid rgba(212,165,116,.3)', color: 'var(--g4)', textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>
                  <th style={{ padding: '.9rem 1rem' }}>Retailer Shop</th>
                  <th style={{ padding: '.9rem 1rem' }}>City &amp; Sub-DB</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>June Restock</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>June Target %</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>July Restock</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>July Target %</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>August Restock (Live)</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>August Target %</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>3-Month Pace</th>
                </tr>
              </thead>
              <tbody>
                {filteredRetailers.map((ret, idx) => {
                  const avgPace = Math.round((ret.monthlyHistory.jun.targetPct + ret.monthlyHistory.jul.targetPct + ret.monthlyHistory.aug.targetPct) / 3);
                  return (
                    <tr key={ret.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '.9rem 1rem', fontWeight: 800, color: '#fff' }}>{ret.shop}</td>
                      <td style={{ padding: '.9rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--g4)' }}>{ret.city}</span> · <span style={{ color: '#888', fontSize: '.72rem' }}>{ret.subDB.split(' ')[0]} {ret.subDB.split(' ')[1]}</span>
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 700 }}>
                        {ret.monthlyHistory.jun.boxes} bxs (₹{ret.monthlyHistory.jun.spend.toLocaleString('en-IN')})
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center', color: ret.monthlyHistory.jun.targetPct >= 100 ? '#10b981' : 'var(--g4)', fontWeight: 800 }}>
                        {ret.monthlyHistory.jun.targetPct}%
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 700 }}>
                        {ret.monthlyHistory.jul.boxes} bxs (₹{ret.monthlyHistory.jul.spend.toLocaleString('en-IN')})
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center', color: ret.monthlyHistory.jul.targetPct >= 100 ? '#10b981' : 'var(--g4)', fontWeight: 800 }}>
                        {ret.monthlyHistory.jul.targetPct}%
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800, color: '#ffd060' }}>
                        {ret.monthlyHistory.aug.boxes} bxs (₹{ret.monthlyHistory.aug.spend.toLocaleString('en-IN')})
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center', color: ret.monthlyHistory.aug.targetPct >= 100 ? '#10b981' : 'var(--g4)', fontWeight: 900 }}>
                        {ret.monthlyHistory.aug.targetPct}%
                      </td>
                      <td style={{ padding: '.9rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '.7rem', fontWeight: 900, padding: '.25rem .6rem', borderRadius: '9999px',
                          background: avgPace >= 100 ? 'rgba(16,185,129,.15)' : 'rgba(212,165,116,.15)',
                          color: avgPace >= 100 ? '#10b981' : 'var(--g4)',
                          border: `1px solid ${avgPace >= 100 ? '#10b981' : '#d4a574'}`
                        }}>
                          {avgPace}% Avg
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TABLE 3: BY SUB-DB REPRESENTATIVE ─── */}
        {activeTableView === 'subdb' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.84rem' }}>
              <thead>
                <tr style={{ background: 'rgba(212,165,116,.08)', borderBottom: '2px solid rgba(212,165,116,.3)', color: 'var(--g4)', textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>
                  <th style={{ padding: '.9rem 1rem' }}>Sub-DB Representative</th>
                  <th style={{ padding: '.9rem 1rem' }}>Reporting Manager (ASM)</th>
                  <th style={{ padding: '.9rem 1rem' }}>Territory &amp; Zone</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Retailers</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Bills Scanned</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Boxes Restocked</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'right' }}>Wholesale Spend</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Target %</th>
                  <th style={{ padding: '.9rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubDBs.map((sub, idx) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '.9rem 1rem' }}>
                      <p style={{ fontWeight: 800, color: '#fff', margin: 0 }}>{sub.name}</p>
                      <span style={{ fontSize: '.7rem', color: 'var(--g4)', fontWeight: 700 }}>{sub.empId}</span> · <span style={{ fontSize: '.7rem', color: '#888' }}>{sub.phone}</span>
                    </td>
                    <td style={{ padding: '.9rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: '#f3f4f6' }}>{sub.reportingManager}</span>
                    </td>
                    <td style={{ padding: '.9rem 1rem' }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>{sub.territory}</p>
                      <span style={{ fontSize: '.7rem', color: '#888' }}>{sub.zone} Zone</span>
                    </td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800 }}>
                      {sub.retailersCount} outlets
                    </td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800 }}>
                      {sub.invoicesLogged} bills
                    </td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--g4)' }}>
                      {sub.boxesRestocked} boxes
                    </td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'right', fontWeight: 900, color: '#fff' }}>
                      ₹{sub.totalWholesaleSpend.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
                        <div style={{ width: '50px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, sub.targetPct)}%`, background: sub.targetPct >= 100 ? '#10b981' : '#d4a574', borderRadius: '9999px' }}></div>
                        </div>
                        <span style={{ fontWeight: 900, color: sub.targetPct >= 100 ? '#10b981' : 'var(--g4)', fontSize: '.78rem' }}>{sub.targetPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '.9rem 1rem' }}>
                      <span style={{
                        fontSize: '.68rem', fontWeight: 800, padding: '.25rem .6rem', borderRadius: '9999px',
                        background: sub.targetPct >= 100 ? 'rgba(16,185,129,.15)' : 'rgba(212,165,116,.15)',
                        color: sub.targetPct >= 100 ? '#10b981' : 'var(--g4)',
                        border: `1px solid ${sub.targetPct >= 100 ? '#10b981' : '#d4a574'}`
                      }}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TABLE 4: BY REPORTING MANAGER (ASM ROLLUP) ─── */}
        {activeTableView === 'asm' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.84rem' }}>
              <thead>
                <tr style={{ background: 'rgba(212,165,116,.08)', borderBottom: '2px solid rgba(212,165,116,.3)', color: 'var(--g4)', textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>
                  <th style={{ padding: '.9rem 1rem' }}>Area Sales Manager</th>
                  <th style={{ padding: '.9rem 1rem' }}>Supervised Sub-DB Reps</th>
                  <th style={{ padding: '.9rem 1rem' }}>Zone</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Total Outlets</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Total Bills</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Boxes Credited</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'right' }}>Territory Spend</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Territory Quota %</th>
                  <th style={{ padding: '.9rem 1rem' }}>Top Sub-DB Performer</th>
                </tr>
              </thead>
              <tbody>
                {allASMData.map((asm, idx) => (
                  <tr key={asm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '.9rem 1rem' }}>
                      <p style={{ fontWeight: 900, color: '#fff', margin: 0 }}>{asm.name}</p>
                      <span style={{ fontSize: '.7rem', color: 'var(--g4)' }}>{asm.title}</span>
                    </td>
                    <td style={{ padding: '.9rem 1rem' }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>{asm.subDBNames.join(', ')}</p>
                      <span style={{ fontSize: '.7rem', color: '#888' }}>{asm.subDBCount} Field Representatives</span>
                    </td>
                    <td style={{ padding: '.9rem 1rem', fontWeight: 700 }}>{asm.zone} Zone</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800 }}>{asm.totalRetailers}</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800 }}>{asm.totalInvoices}</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--g4)' }}>{asm.totalBoxes} bxs</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'right', fontWeight: 900, color: '#fff' }}>₹{asm.totalSpend.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 900, color: '#10b981' }}>{asm.targetAchievedPct}%</td>
                    <td style={{ padding: '.9rem 1rem', fontWeight: 700, color: 'var(--g4)' }}>{asm.topRep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TABLE 5: BY PRODUCT SKU ─── */}
        {activeTableView === 'hierarchy' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--g4)', margin: 0 }}>Sub-DB Representative & Retailer Hierarchy Tree</h3>
              <p style={{ fontSize: '.75rem', color: '#999', margin: '2px 0 0 0' }}>Hierarchical view of Sub-DB field reps and their connected sweet shop retailers with live metrics.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredSubDBs.map(subdb => {
                const childRetailers = allRetailersData.filter(r => r.subDBId === subdb.id || r.subDB.toLowerCase().includes(subdb.name.toLowerCase().split(' ')[0]));
                const isExpanded = expandedSubDBs[subdb.id] ?? true;

                return (
                  <div key={subdb.id} style={{ background: '#110b08', border: '1.5px solid rgba(212,165,116,.3)', borderRadius: '14px', overflow: 'hidden' }}>
                    {/* Sub-DB Parent Header */}
                    <div
                      onClick={() => toggleSubDBExpand(subdb.id)}
                      style={{
                        padding: '1rem 1.25rem', background: 'rgba(212,165,116,0.08)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '50%', background: 'linear-gradient(135deg, #d4a574, #c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '.9rem' }}>
                          🏢
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                            <h4 style={{ fontSize: '.92rem', fontWeight: 900, color: '#fff', margin: 0 }}>{subdb.name}</h4>
                            <span style={{ fontSize: '.68rem', fontWeight: 800, padding: '.15rem .45rem', borderRadius: '4px', background: 'rgba(212,165,116,0.2)', color: '#d4a574' }}>{subdb.empId}</span>
                          </div>
                          <p style={{ fontSize: '.72rem', color: '#999', margin: '2px 0 0 0' }}>📍 {subdb.territory} · Reporting to: {subdb.reportingManager}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '.85rem', fontWeight: 900, color: '#d4a574', margin: 0 }}>₹{(subdb.totalWholesaleSpend / 1000).toFixed(1)}k Spend</p>
                          <p style={{ fontSize: '.68rem', color: '#999', margin: 0 }}>{subdb.boxesRestocked} boxes · {childRetailers.length} retailers</p>
                        </div>
                        <span className="material-symbols-outlined" style={{ color: '#d4a574', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          expand_more
                        </span>
                      </div>
                    </div>

                    {/* Child Retailers Table */}
                    {isExpanded && (
                      <div style={{ padding: '.75rem 1.25rem 1.25rem 1.25rem', borderTop: '1px solid rgba(212,165,116,0.15)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
                          <thead>
                            <tr style={{ color: 'var(--g4)', textAlign: 'left', borderBottom: '1px solid rgba(212,165,116,0.2)' }}>
                              <th style={{ padding: '.6rem .75rem' }}>Retailer Shop</th>
                              <th style={{ padding: '.6rem .75rem' }}>Owner</th>
                              <th style={{ padding: '.6rem .75rem' }}>City</th>
                              <th style={{ padding: '.6rem .75rem' }}>Boxes</th>
                              <th style={{ padding: '.6rem .75rem' }}>Spend (₹)</th>
                              <th style={{ padding: '.6rem .75rem' }}>Points Earned</th>
                              <th style={{ padding: '.6rem .75rem' }}>Points Redeemed</th>
                              <th style={{ padding: '.6rem .75rem' }}>Value Redeemed (₹)</th>
                              <th style={{ padding: '.6rem .75rem' }}>KYC Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {childRetailers.map(r => (
                              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '.6rem .75rem', fontWeight: 800, color: '#fff' }}>🏪 {r.shop}</td>
                                <td style={{ padding: '.6rem .75rem', color: '#ccc' }}>{r.owner}</td>
                                <td style={{ padding: '.6rem .75rem', color: '#aaa' }}>{r.city}</td>
                                <td style={{ padding: '.6rem .75rem', fontWeight: 800, color: '#d4a574' }}>{r.boxes} bxs</td>
                                <td style={{ padding: '.6rem .75rem', fontWeight: 800, color: '#fff' }}>₹{r.spend.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '.6rem .75rem', fontWeight: 800, color: '#10b981' }}>+{r.points} pts</td>
                                <td style={{ padding: '.6rem .75rem', fontWeight: 800, color: '#f59e0b' }}>{Math.round(r.points * 0.4)} pts</td>
                                <td style={{ padding: '.6rem .75rem', fontWeight: 800, color: '#38bdf8' }}>₹{Math.round(r.spend * 0.05).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '.6rem .75rem' }}>
                                  <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '.15rem .4rem', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981' }}>
                                    ✓ Verified
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTableView === 'tickets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--g4)', margin: 0 }}>Grievances & Retailer Dispute Tickets</h3>
                <p style={{ fontSize: '.75rem', color: '#999', margin: '2px 0 0 0' }}>Track, assign, and resolve billing disputes and claim queries logged by retailers.</p>
              </div>
              <button
                onClick={exportGrievancesCSV}
                style={{
                  padding: '.5rem 1.1rem',
                  background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '.8rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.4rem',
                  boxShadow: '0 4px 15px rgba(212,165,116,0.3)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                📥 Export Grievances & Tickets CSV
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1.5px solid rgba(212,165,116,.2)', color: 'var(--g4)', textAlign: 'left' }}>
                    <th style={{ padding: '.8rem 1rem' }}>Ticket ID</th>
                    <th style={{ padding: '.8rem 1rem' }}>Retailer Shop</th>
                    <th style={{ padding: '.8rem 1rem' }}>Phone</th>
                    <th style={{ padding: '.8rem 1rem' }}>Category</th>
                    <th style={{ padding: '.8rem 1rem' }}>Subject & Issue</th>
                    <th style={{ padding: '.8rem 1rem' }}>Invoice Ref</th>
                    <th style={{ padding: '.8rem 1rem' }}>Priority</th>
                    <th style={{ padding: '.8rem 1rem' }}>Status</th>
                    <th style={{ padding: '.8rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(supportTickets || []).map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '.8rem 1rem', fontWeight: 800, color: 'var(--g4)' }}>{t.ticket_id || t.id}</td>
                      <td style={{ padding: '.8rem 1rem', fontWeight: 700, color: '#fff' }}>{t.retailer_name || t.retailer || 'Retailer'}</td>
                      <td style={{ padding: '.8rem 1rem', color: '#bbb' }}>{t.retailer_phone || t.phone || '9876543210'}</td>
                      <td style={{ padding: '.8rem 1rem' }}>
                        <span style={{ fontSize: '.7rem', fontWeight: 800, padding: '.2rem .5rem', borderRadius: '6px', background: 'rgba(212,165,116,0.1)', color: '#d4a574', border: '1px solid rgba(212,165,116,0.3)' }}>
                          {(t.category || 'Dispute').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '.8rem 1rem', maxWidth: '280px' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{t.subject}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '.72rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>
                      </td>
                      <td style={{ padding: '.8rem 1rem', fontWeight: 700, color: t.invoice_number ? '#38bdf8' : '#666' }}>{t.invoice_number || 'N/A'}</td>
                      <td style={{ padding: '.8rem 1rem' }}>
                        <span style={{
                          fontSize: '.68rem', fontWeight: 900, padding: '.15rem .45rem', borderRadius: '4px',
                          color: t.priority === 'High' ? '#ef4444' : t.priority === 'Medium' ? '#f59e0b' : '#10b981',
                          background: t.priority === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'
                        }}>
                          {t.priority || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '.8rem 1rem' }}>
                        <span style={{
                          fontSize: '.68rem', fontWeight: 900, padding: '.15rem .45rem', borderRadius: '4px',
                          color: t.status === 'Resolved' ? '#10b981' : t.status === 'In Review' ? '#38bdf8' : '#f43f5e',
                          background: t.status === 'Resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'
                        }}>
                          {t.status || 'Open'}
                        </span>
                      </td>
                      <td style={{ padding: '.8rem 1rem', textAlign: 'right' }}>
                        {t.status !== 'Resolved' ? (
                          <button
                            onClick={() => resolveSupportTicket(t.id, 'Resolved by Executive Support')}
                            style={{
                              padding: '.3rem .6rem', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981',
                              borderRadius: '6px', color: '#10b981', fontSize: '.7rem', fontWeight: 800, cursor: 'pointer'
                            }}
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span style={{ fontSize: '.7rem', color: '#10b981', fontWeight: 700 }}>✓ Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTableView === 'sku' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.84rem' }}>
              <thead>
                <tr style={{ background: 'rgba(212,165,116,.08)', borderBottom: '2px solid rgba(212,165,116,.3)', color: 'var(--g4)', textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>
                  <th style={{ padding: '.9rem 1rem' }}>SKU Code</th>
                  <th style={{ padding: '.9rem 1rem' }}>Product Name</th>
                  <th style={{ padding: '.9rem 1rem' }}>Category</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>Total Boxes Restocked</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>National Share %</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'right' }}>Wholesale Value</th>
                  <th style={{ padding: '.9rem 1rem', textAlign: 'center' }}>MoM Growth</th>
                </tr>
              </thead>
              <tbody>
                {skuBreakdown.map((sku, idx) => (
                  <tr key={sku.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '.9rem 1rem', fontWeight: 900, color: 'var(--g4)' }}>{sku.code}</td>
                    <td style={{ padding: '.9rem 1rem', fontWeight: 800, color: '#fff' }}>{sku.name}</td>
                    <td style={{ padding: '.9rem 1rem', color: '#999' }}>{sku.cat}</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800 }}>{sku.boxes.toLocaleString('en-IN')} boxes</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 900, color: 'var(--g4)' }}>{sku.sharePct}%</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'right', fontWeight: 900, color: '#fff' }}>₹{sku.value.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '.9rem 1rem', textAlign: 'center', fontWeight: 800, color: '#10b981' }}>{sku.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          6. EXPORT FILTER CONFIRMATION MODAL POPUP
         ══════════════════════════════════════════════════════════════════════════ */}
      {showExportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: '#1c120c', border: '2px solid #d4a574', borderRadius: '24px',
            padding: '2rem 2.25rem', maxWidth: '520px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            animation: 'slideIn .25s ease-out'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '3.2rem', height: '3.2rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '1.8rem' }}>file_download</span>
              </div>
              <div>
                <span style={{ fontSize: '.7rem', fontWeight: 900, color: 'var(--g4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Export Data Selection
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: '.2rem 0 0 0' }}>
                  Download Executive Report
                </h3>
              </div>
            </div>

            {/* Subtitle / Notice */}
            <p style={{ fontSize: '.85rem', color: '#ccc', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              You currently have <strong style={{ color: 'var(--g4)' }}>active filters applied</strong> on the dashboard. Would you like to export only the filtered subset or the entire national master dataset?
            </p>

            {/* Active Filters Tag Pills */}
            <div style={{ background: '#261912', padding: '.75rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(212,165,116,.2)' }}>
              <span style={{ fontSize: '.68rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '.4rem' }}>
                Active Filter Parameters:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                {selectedZone !== 'all' && <span style={{ fontSize: '.72rem', background: 'rgba(212,165,116,.15)', color: 'var(--g4)', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #d4a574' }}>Zone: {selectedZone}</span>}
                {selectedASM !== 'all' && <span style={{ fontSize: '.72rem', background: 'rgba(212,165,116,.15)', color: 'var(--g4)', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #d4a574' }}>ASM: {selectedASM}</span>}
                {selectedSubDB !== 'all' && <span style={{ fontSize: '.72rem', background: 'rgba(212,165,116,.15)', color: 'var(--g4)', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #d4a574' }}>Sub-DB: {selectedSubDB}</span>}
                {selectedRetailer !== 'all' && <span style={{ fontSize: '.72rem', background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #10b981' }}>Retailer: {focusedRetailer.shop}</span>}
                {selectedPeriod !== 'aug2026' && <span style={{ fontSize: '.72rem', background: 'rgba(212,165,116,.15)', color: 'var(--g4)', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #d4a574' }}>Period: {selectedPeriod}</span>}
                {searchQuery.trim() !== '' && <span style={{ fontSize: '.72rem', background: 'rgba(212,165,116,.15)', color: 'var(--g4)', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #d4a574' }}>Search: "{searchQuery}"</span>}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              
              {/* Option 1: Filtered Data */}
              <button
                onClick={() => {
                  setShowExportModal(false);
                  downloadMasterDataset('filtered');
                }}
                style={{
                  padding: '.85rem 1.25rem', background: 'linear-gradient(135deg, #d4a574, #c41e3a)',
                  border: 'none', borderRadius: '12px', color: '#1d120d', fontWeight: 900, fontSize: '.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(212,165,116,.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>filter_alt</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontWeight: 900 }}>Download Filtered Data</p>
                    <span style={{ fontSize: '.72rem', opacity: 0.85, fontWeight: 600 }}>Includes {filteredRetailers.length} outlets matching active filters</span>
                  </div>
                </div>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>

              {/* Option 2: Entire Master Data */}
              <button
                onClick={() => {
                  setShowExportModal(false);
                  downloadMasterDataset('entire');
                }}
                style={{
                  padding: '.85rem 1.25rem', background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(212,165,116,.4)', borderRadius: '12px', color: '#fff', fontWeight: 900, fontSize: '.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--g4)', fontSize: '1.2rem' }}>public</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontWeight: 900, color: 'var(--g4)' }}>Download Entire Master Data</p>
                    <span style={{ fontSize: '.72rem', color: '#999', fontWeight: 600 }}>All {allRetailersData.length} national outlets &amp; all Sub-DBs</span>
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ color: 'var(--g4)' }}>arrow_forward</span>
              </button>

              {/* Option 3: Grievances & Disputes Report CSV */}
              <button
                onClick={() => {
                  setShowExportModal(false);
                  exportGrievancesCSV();
                }}
                style={{
                  padding: '.85rem 1.25rem', background: 'rgba(56, 189, 248, 0.1)',
                  border: '1.5px solid #38bdf8', borderRadius: '12px', color: '#fff', fontWeight: 900, fontSize: '.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '1.2rem' }}>support_agent</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontWeight: 900, color: '#38bdf8' }}>📥 Download Grievances & Retailer Queries CSV</p>
                    <span style={{ fontSize: '.72rem', color: '#bbb', fontWeight: 600 }}>Retailer names, shop names, mobile numbers, queries, Sub-DB reps & status</span>
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>arrow_forward</span>
              </button>

              {/* Option 3: Cancel */}
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: '.65rem', background: 'transparent', border: 'none',
                  color: '#888', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', textAlign: 'center', marginTop: '.25rem'
                }}
              >
                Cancel
              </button>

            </div>

          </div>
        </div>
      )}

      {/* Pending Invoice Inspection & Approval Modal */}
      {selectedPendingInv && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div style={{
            background: '#160e0a', border: '2.5px solid #d4a574',
            borderRadius: '20px', width: '100%', maxWidth: '520px',
            padding: '1.75rem', boxShadow: '0 15px 50px rgba(0,0,0,0.9)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid rgba(212,165,116,0.2)', paddingBottom: '.75rem' }}>
              <div>
                <span style={{ fontSize: '.7rem', fontWeight: 900, background: 'rgba(212,165,116,0.2)', color: '#d4a574', padding: '.2rem .6rem', borderRadius: '6px' }}>
                  ADMIN AUDIT &amp; APPROVAL QUEUE
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: '.3rem 0 0 0' }}>
                  Verify Invoice #{selectedPendingInv.invoice_number}
                </h3>
              </div>
              <button onClick={() => setSelectedPendingInv(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem', fontSize: '.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p style={{ fontSize: '.7rem', color: '#888', margin: 0 }}>Retailer Store</p>
                  <p style={{ fontWeight: 800, color: '#fff', margin: '2px 0 0 0' }}>🏪 {selectedPendingInv.retailer_name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '.7rem', color: '#888', margin: 0 }}>Sub-DB Wholesaler</p>
                  <p style={{ fontWeight: 800, color: '#d4a574', margin: '2px 0 0 0' }}>🏢 {selectedPendingInv.wholesaler_name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '.7rem', color: '#888', margin: 0 }}>Total Amount</p>
                  <p style={{ fontWeight: 900, color: '#10b981', fontSize: '1.1rem', margin: '2px 0 0 0' }}>₹{Number(selectedPendingInv.total_amount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p style={{ fontSize: '.7rem', color: '#888', margin: 0 }}>Purchase Date</p>
                  <p style={{ fontWeight: 800, color: '#fff', margin: '2px 0 0 0' }}>📅 {selectedPendingInv.purchase_date}</p>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--g4)', textTransform: 'uppercase', marginBottom: '.4rem' }}>Scanned SKU Items Breakdown</p>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '.75rem', border: '1px solid rgba(212,165,116,0.2)' }}>
                  {(selectedPendingInv.products || selectedPendingInv.items_json || []).map((prod, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: '#ddd', padding: '.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>📦 {prod.name} ({prod.qty} {prod.unit || 'Box'})</span>
                      <span style={{ fontWeight: 800, color: '#d4a574' }}>₹{Number(prod.total || prod.price * prod.qty || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.75rem' }}>
                <button
                  onClick={async () => {
                    await approvePendingInvoice(selectedPendingInv.id);
                    setSelectedPendingInv(null);
                    loadPendingInvoices();
                  }}
                  style={{
                    flex: 1.5, padding: '.8rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', borderRadius: '10px',
                    color: '#fff', fontWeight: 900, fontSize: '.9rem', cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.4)'
                  }}
                >
                  ✓ Approve &amp; Verify Invoice
                </button>
                <button
                  onClick={async () => {
                    await rejectPendingInvoice(selectedPendingInv.id);
                    setSelectedPendingInv(null);
                    loadPendingInvoices();
                  }}
                  style={{
                    flex: 1, padding: '.8rem',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid #ef4444', borderRadius: '10px',
                    color: '#ef4444', fontWeight: 800, fontSize: '.85rem', cursor: 'pointer'
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
