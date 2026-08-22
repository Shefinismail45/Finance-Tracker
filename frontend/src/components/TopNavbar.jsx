import React from 'react';
import { Bell, Moon, Sun, Plus, Wallet, LogIn, User } from 'lucide-react';

export function TopNavbar({ activeTab, user, theme, onToggleTheme, onOpenForm, onOpenAuth }) {
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Alex';
  const userInitials = userName.slice(0, 2).toUpperCase();

  const getAddButtonTitle = () => {
    switch (activeTab) {
      case 'expense': return 'Log Expense';
      case 'income': return 'Add Income';
      case 'debt': return 'Add Debt';
      case 'savings': return 'Add Goal';
      case 'budget': return 'Set Budget';
      default: return 'Quick Log';
    }
  };

  return (
    <header className="top-navbar">
      {/* Left side: Avatar + Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div 
          onClick={onOpenAuth}
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
          }}
          title="Account / Session"
        >
          {user ? userInitials : <User size={18} />}
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Welcome back
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Hi {userName}!
          </div>
        </div>
      </div>

      {/* Right side: Actions (Theme switcher, Add button) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {/* Theme Switcher Button */}
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)'
          }}
        >
          {theme === 'dark' ? <Moon size={18} color="#38bdf8" /> : <Sun size={18} color="#f59e0b" />}
        </button>

        {/* Quick Add Button on Top Navbar */}
        {activeTab !== 'dashboard' && (
          <button
            className="btn-primary"
            onClick={onOpenForm}
            style={{
              padding: '0.5rem 0.875rem',
              fontSize: '0.85rem',
              borderRadius: '9999px'
            }}
          >
            <Plus size={16} />
            <span>{getAddButtonTitle()}</span>
          </button>
        )}
      </div>
    </header>
  );
}
