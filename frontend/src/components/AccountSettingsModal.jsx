import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Trash2, 
  AlertTriangle, 
  X, 
  LogOut, 
  Download, 
  RefreshCw,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { api } from '../api';
import { supabase } from '../supabaseClient';

export function AccountSettingsModal({ user, onClose, onLogout, onDataReset, onOpenReport }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'danger'
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'demo.user@example.com';
  const authProvider = user?.app_metadata?.provider || (user?.email ? 'Email & Password' : 'Demo Mode');
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Session';

  // Export Financial Portfolio Backup as JSON
  const handleExportData = async () => {
    try {
      setStatusMessage('Exporting data...');
      const [exp, inc, deb, sav, bud] = await Promise.all([
        api.getExpenses().catch(() => []),
        api.getIncome().catch(() => []),
        api.getDebts().catch(() => []),
        api.getSavingsGoals().catch(() => []),
        api.getBudgets().catch(() => [])
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        user: { name: userName, email: userEmail },
        expenses: exp,
        incomes: inc,
        debts: deb,
        savings_goals: sav,
        budgets: bud
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Data exported successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setError('Failed to export data.');
    }
  };

  // Clear all financial records
  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to clear all transactions, goals, and debts? Your login account will stay active.')) {
      return;
    }
    try {
      setIsResetting(true);
      setError(null);
      await api.clearAllUserData();
      setStatusMessage('All portfolio data has been reset to $0.00.');
      if (onDataReset) onDataReset();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset portfolio data.');
    } finally {
      setIsResetting(false);
    }
  };

  // Permanently delete user account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') {
      setError('Please type DELETE to confirm permanent account removal.');
      return;
    }
    try {
      setIsDeleting(true);
      setError(null);
      await api.deleteUserAccount();
      onClose();
      onLogout();
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 110 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="var(--primary)" />
            <span>Account Settings</span>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: '2rem', height: '2rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeTab === 'profile' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'profile' ? 'white' : 'var(--text-secondary)'
            }}
          >
            Profile & Data
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeTab === 'danger' ? 'var(--danger-bg)' : 'transparent',
              color: activeTab === 'danger' ? 'var(--danger-text)' : 'var(--text-secondary)'
            }}
          >
            Delete Account
          </button>
        </div>

        {/* Notices */}
        {statusMessage && (
          <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} /> {statusMessage}
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* 1. PROFILE & DATA TAB */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* User Info Card */}
            <div style={{ background: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, flexShrink: 0 }}>
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{userName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={13} /> {userEmail}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Auth Method:</span>
                  <div style={{ fontWeight: 700, marginTop: '2px', textTransform: 'capitalize' }}>{authProvider}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Account Created:</span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{createdAt}</div>
                </div>
              </div>
            </div>

            {/* Data Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                Data Management & Reports
              </div>

              {onOpenReport && (
                <button 
                  className="btn-primary" 
                  onClick={() => { onClose(); onOpenReport(); }}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                >
                  <Download size={16} /> Download Visual Report (JPG Image)
                </button>
              )}

              <button 
                className="btn-secondary" 
                onClick={handleExportData}
                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
              >
                <Download size={16} /> Export Financial Data (JSON Backup)
              </button>

              <button 
                className="btn-secondary" 
                onClick={handleResetData}
                disabled={isResetting}
                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', color: 'var(--warning-text)' }}
              >
                <RefreshCw size={16} className={isResetting ? 'animate-spin' : ''} /> Reset All Portfolio Data to $0
              </button>
            </div>

            {/* Logout Button */}
            <button 
              className="btn-secondary" 
              onClick={() => { onClose(); onLogout(); }}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', color: 'var(--danger-text)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <LogOut size={16} /> Sign Out of Account
            </button>
          </div>
        )}

        {/* 2. DANGER ZONE / DELETE ACCOUNT TAB */}
        {activeTab === 'danger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '1rem', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-text)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                <AlertTriangle size={18} /> Warning: Irreversible Action
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--danger-text)', lineHeight: 1.45 }}>
                Deleting your account will permanently erase your user credentials, all logged expenses, income streams, debts, savings milestones, and custom categories. This action cannot be undone.
              </p>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                To confirm deletion, type <strong style={{ color: 'var(--danger-text)' }}>DELETE</strong> below:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Cancel
              </button>

              <button 
                type="button" 
                className="btn-primary" 
                disabled={deleteConfirmText.trim() !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--danger)',
                  border: 'none',
                  color: 'white',
                  cursor: deleteConfirmText.trim() === 'DELETE' ? 'pointer' : 'not-allowed',
                  opacity: deleteConfirmText.trim() === 'DELETE' ? 1 : 0.5
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account Permanently'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
