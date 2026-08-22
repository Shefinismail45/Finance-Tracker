import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Banknote, 
  CreditCard, 
  PiggyBank, 
  PieChart, 
  Wallet,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Coins
} from 'lucide-react';
import { CURRENCIES } from '../currencies';

export function SidebarNav({ 
  activeTab, 
  onSelectTab, 
  theme, 
  onToggleTheme, 
  user, 
  onOpenAuth, 
  onLogout,
  currency = 'USD',
  onSelectCurrency
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expense', label: 'Expenses', icon: Receipt },
    { id: 'income', label: 'Income', icon: Banknote },
    { id: 'debt', label: 'Debt Avalanche', icon: CreditCard },
    { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { id: 'budget', label: 'Budgets & Rules', icon: PieChart },
  ];

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <aside className="desktop-sidebar">
      <div>
        {/* Brand */}
        <div className="brand-header">
          <div className="brand-icon">
            <Wallet size={24} />
          </div>
          <div>
            <div className="brand-title">FinanceTracker</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Smart Wealth & Budget</div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Currency Selector, Theme Toggle & User Profile */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        {/* 1. CURRENCY / MONEY TYPE SELECTOR */}
        <div>
          <label style={{ 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            letterSpacing: '0.04em',
            textTransform: 'uppercase', 
            color: 'var(--text-muted)', 
            marginBottom: '0.35rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem' 
          }}>
            <Coins size={13} color="var(--primary)" /> Money Currency
          </label>
          <select
            value={currency}
            onChange={(e) => onSelectCurrency?.(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. THEME TOGGLE BUTTON */}
        <button
          onClick={onToggleTheme}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.85rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {theme === 'dark' ? <Moon size={15} color="#38bdf8" /> : <Sun size={15} color="#f59e0b" />}
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Switch</span>
        </button>

        {/* 3. USER CARD */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '0.55rem 0.75rem', borderRadius: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                {userInitials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userName}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
              </div>
            </div>
            <button className="btn-icon delete" onClick={onLogout} title="Sign Out">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={onOpenAuth} style={{ fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}>
            <UserCheck size={16} /> Sign In / Account
          </button>
        )}
      </div>
    </aside>
  );
}
