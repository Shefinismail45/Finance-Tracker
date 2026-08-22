import React from 'react';
import { Bell, Search, Moon, Sun, Plus, User } from 'lucide-react';

export function TopNavbar({ activeTab, user, theme, onToggleTheme, onOpenForm, onOpenAuth }) {
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
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
      {/* Left side: Avatar + User Greeting (Matching Screenshot) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div 
          onClick={onOpenAuth}
          style={{
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
            border: '2px solid rgba(255, 255, 255, 0.15)'
          }}
          title="Account / Session"
        >
          {user ? userInitials : <User size={18} />}
        </div>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Hi {userName}!
          </div>
        </div>
      </div>

      {/* Right side: Bell notification, Search, Theme toggle, Add button (Matching Screenshot) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className="btn-icon"
          title="Notifications"
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)'
          }}
        >
          <Bell size={16} />
        </button>

        <button
          className="btn-icon"
          title="Search"
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)'
          }}
        >
          <Search size={16} />
        </button>

        {/* Theme Switcher Button */}
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)'
          }}
        >
          {theme === 'dark' ? <Moon size={16} color="#38bdf8" /> : <Sun size={16} color="#f59e0b" />}
        </button>

        {/* Quick Add Button on Top Navbar */}
        {activeTab !== 'dashboard' && (
          <button
            className="btn-primary"
            onClick={onOpenForm}
            style={{
              padding: '0.45rem 0.8rem',
              fontSize: '0.8rem',
              borderRadius: '9999px'
            }}
          >
            <Plus size={15} />
            <span>{getAddButtonTitle()}</span>
          </button>
        )}
      </div>
    </header>
  );
}
