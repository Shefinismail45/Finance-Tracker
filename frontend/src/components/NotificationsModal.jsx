import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, TrendingUp, PiggyBank, CreditCard, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import { getCurrencySymbol } from '../currencies';

export function NotificationsModal({ onClose, onNavigate, currency = 'USD' }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const currSymbol = getCurrencySymbol(currency);

  useEffect(() => {
    const generateAlerts = async () => {
      try {
        setLoading(true);
        const [dash, budgets, debts, savings] = await Promise.all([
          api.getDashboard(30).catch(() => null),
          api.getBudgets().catch(() => []),
          api.getDebts().catch(() => []),
          api.getSavingsGoals().catch(() => [])
        ]);

        const alerts = [];

        // 1. Check budget adherence
        if (budgets && budgets.length > 0) {
          budgets.forEach(b => {
            const usage = b.planned_amount > 0 ? (b.actual_amount / b.planned_amount) * 100 : 0;
            if (usage >= 100) {
              alerts.push({
                id: `budget-over-${b.id}`,
                type: 'danger',
                icon: ShieldAlert,
                title: `Budget Exceeded: ${b.category_name}`,
                desc: `You have spent ${currSymbol}${Number(b.actual_amount).toFixed(2)} against your limit of ${currSymbol}${Number(b.planned_amount).toFixed(2)} (${usage.toFixed(0)}%).`,
                tab: 'budget',
                time: 'Immediate Attention'
              });
            } else if (usage >= 80) {
              alerts.push({
                id: `budget-warn-${b.id}`,
                type: 'warning',
                icon: AlertTriangle,
                title: `Budget Warning: ${b.category_name}`,
                desc: `You have reached ${usage.toFixed(0)}% of your ${currSymbol}${Number(b.planned_amount).toFixed(2)} monthly limit.`,
                tab: 'budget',
                time: 'This Month'
              });
            }
          });
        }

        // 2. Check high-interest debts
        if (debts && debts.length > 0) {
          const highInterest = debts.filter(d => Number(d.interest_rate) >= 15 && Number(d.remaining_balance) > 0);
          if (highInterest.length > 0) {
            alerts.push({
              id: 'debt-high-interest',
              type: 'warning',
              icon: CreditCard,
              title: `High Interest Debt Alert`,
              desc: `You have ${highInterest.length} debt(s) with >= 15% APR. Avalanche method recommends prioritizing "${highInterest[0].name}".`,
              tab: 'debt',
              time: 'Debt Strategy'
            });
          }
        }

        // 3. Check savings goal milestones
        if (savings && savings.length > 0) {
          savings.forEach(g => {
            const pct = g.target_amount ? Math.min(100, Math.round((g.total_saved / g.target_amount) * 100)) : 0;
            if (pct >= 100) {
              alerts.push({
                id: `goal-reached-${g.id}`,
                type: 'success',
                icon: CheckCircle,
                title: `Goal Achieved: ${g.name}! 🎉`,
                desc: `Congratulations! You've successfully saved ${currSymbol}${Number(g.total_saved).toFixed(2)} for ${g.name}.`,
                tab: 'savings',
                time: 'Milestone'
              });
            }
          });
        }

        // 4. General welcome status if no critical alerts
        if (alerts.length === 0) {
          alerts.push({
            id: 'healthy-status',
            type: 'success',
            icon: CheckCircle,
            title: 'Financial Health is Good',
            desc: 'All category budgets are on track, and no urgent debt overages detected. Keep up the solid progress!',
            tab: 'dashboard',
            time: 'Live Status'
          });
        }

        setNotifications(alerts);
      } finally {
        setLoading(false);
      }
    };

    generateAlerts();
  }, [currency]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
            <Bell size={20} color="var(--primary)" />
            <span>Financial Alerts & Notices</span>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: '2rem', height: '2rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Checking active financial alerts...
            </div>
          ) : (
            notifications.map(n => {
              const Icon = n.icon;
              const isDanger = n.type === 'danger';
              const isWarning = n.type === 'warning';
              const isSuccess = n.type === 'success';

              const bg = isDanger ? 'var(--danger-bg)' : isWarning ? 'rgba(245, 158, 11, 0.12)' : 'var(--success-bg)';
              const color = isDanger ? 'var(--danger-text)' : isWarning ? 'var(--warning-text)' : 'var(--success-text)';
              const border = isDanger ? 'rgba(239, 68, 68, 0.25)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)';

              return (
                <div 
                  key={n.id}
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: '0.875rem',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start'
                  }}
                  onClick={() => { onNavigate(n.tab); onClose(); }}
                >
                  <div style={{ color: color, flexShrink: 0, marginTop: '2px' }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: color }}>{n.title}</div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      {n.desc}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
