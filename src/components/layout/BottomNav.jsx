import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export const BottomNav = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavClass = (path) => {
    return `nb ${location.pathname === path || (path === '/rewards' && location.pathname.startsWith('/rewards')) ? 'active' : ''}`;
  };

  return (
    <div className="bnav">
      <button className={getNavClass('/home')} onClick={() => navigate('/home')}>
        <span className="material-symbols-outlined">home</span>Home
      </button>
      
      <button className={getNavClass('/inventory')} onClick={() => navigate('/inventory')}>
        <span className="material-symbols-outlined">inventory_2</span>Stock
      </button>

      <button className={getNavClass('/rewards')} onClick={() => navigate('/rewards')}>
        <span className="material-symbols-outlined">featured_seasonal_and_gifts</span>Rewards
      </button>

      <button className={getNavClass('/earnings')} onClick={() => navigate('/earnings')}>
        <span className="material-symbols-outlined">analytics</span>Earnings
      </button>

      <button className={getNavClass('/settings')} onClick={() => navigate('/settings')}>
        <span className="material-symbols-outlined">settings</span>Settings
      </button>
    </div>
  );
});

BottomNav.displayName = 'BottomNav';
