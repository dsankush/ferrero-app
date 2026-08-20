import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';

import { Login } from './screens/Login';
import { ShopSetup } from './screens/onboarding/ShopSetup';
import { Payout } from './screens/onboarding/Payout';
import { Ready } from './screens/onboarding/Ready';
import { Home } from './screens/Home';
import { Sell } from './screens/Sell';
import { Cart } from './screens/Cart';
import { Success } from './screens/Success';
import { Earnings } from './screens/Earnings';
import { Inventory } from './screens/Inventory';
import { AddInventory } from './screens/AddInventory';
import { Wallet } from './screens/Wallet';
import { WalletAdd } from './screens/WalletAdd';
import { WalletWithdraw } from './screens/WalletWithdraw';
import { Settings } from './screens/Settings';
import { Assistant } from './screens/Assistant';
import { Notifications } from './screens/Notifications';
import { Toast } from './components/ui/Toast';
import { GlobalPopup } from './components/ui/GlobalPopup';
import { RewardsStore } from './screens/RewardsStore';
import { RewardDetails } from './screens/RewardDetails';
import { RewardsSuccess } from './screens/RewardsSuccess';
import { MyRewards, DummyPartnerOffer } from './screens/MyRewards';
import { SubDBRouter } from './screens/subdb/SubDBRouter';
import { ExecutiveDashboard } from './screens/dashboard/ExecutiveDashboard';

// Inner component that has access to useLocation
function AppInner() {
  const location = useLocation();
  const isSubDB = location.pathname.startsWith('/subdb_platform');
  const isDashboard = location.pathname.startsWith('/dashboard');

  React.useEffect(() => {
    if (!isDashboard) {
      document.documentElement.classList.remove('full-page-mode');
      document.body.classList.remove('full-page-mode');
    }
  }, [location.pathname, isDashboard]);

  // Executive Desktop Dashboard: render full desktop width
  if (isDashboard) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflowY: 'auto', overflowX: 'hidden', background: '#0d0806' }}>
        <Toast />
        <Routes>
          <Route path="/dashboard" element={<ExecutiveDashboard />} />
        </Routes>
      </div>
    );
  }

  // SubDB: render inside the shell sizing div
  if (isSubDB) {
    return (
      <div className="shell" id="shell">
        <Routes>
          <Route path="/subdb_platform/*" element={<SubDBRouter />} />
        </Routes>
      </div>
    );
  }

  // Normal mobile shell for Retailer routes
  return (
    <div className="shell" id="shell">
      <canvas id="confetti-c"></canvas>
      <Toast />
      <GlobalPopup />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup/shop" element={<ShopSetup />} />
        <Route path="/setup/payout" element={<Payout />} />
        <Route path="/setup/ready" element={<Ready />} />
        <Route path="/home" element={<Home />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/success" element={<Success />} />
        <Route path="/invoice" element={<AddInventory />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/add-inventory" element={<AddInventory />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/wallet/add" element={<WalletAdd />} />
        <Route path="/wallet/withdraw" element={<WalletWithdraw />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/sales" element={<Earnings />} />
        <Route path="/rewards" element={<RewardsStore />} />
        <Route path="/rewards/detail/:id" element={<RewardDetails />} />
        <Route path="/rewards/success" element={<RewardsSuccess />} />
        <Route path="/rewards/my-rewards" element={<MyRewards />} />
        <Route path="/rewards/partner-link/:id" element={<DummyPartnerOffer />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppInner />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
