import React from 'react';
import { Trash2, Edit3, AlertTriangle, PieChart, Sparkles, Plus } from 'lucide-react';
import { getRandomQuote } from '../quotes';
import { BudgetSkeleton } from './Skeleton';
import { BudgetSplitAdvisor } from './BudgetSplitAdvisor';

export function BudgetList({ budgets, onEdit, onDelete, onAddNew, currency = 'USD', loading }) {
  if (loading) {
    return <BudgetSkeleton count={3} />;
  }

  const quote = getRandomQuote(4);
  const overallPlanned = budgets.reduce((sum, b) => sum + Number(b.planned_amount || 0), 0);
  const overallActual = budgets.reduce((sum, b) => sum + Number(b.actual_amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Smart Budget Split Frameworks Advisor (e.g. 50/30/20, 70/20/10, 80/20) */}
      <BudgetSplitAdvisor currency={currency} />

      {/* 2. Overall Summary Bar */}
      {budgets.length > 0 && (
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Planned Budget</div>
            <div style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>${overallPlanned.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Month Actual Spend</div>
            <div style={{ fontWeight: 800, fontSize: '1.35rem', color: overallActual > overallPlanned ? 'var(--danger)' : 'var(--success)', marginTop: '0.1rem' }}>
              ${overallActual.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Budget List View */}
      {budgets.length === 0 ? (
        <div className="empty-state">
          <div className="row-icon-circle" style={{ width: '3.25rem', height: '3.25rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <PieChart size={26} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>No category budgets configured</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px' }}>Set spending targets for Groceries, Dining, Rent, or Shopping to stay disciplined.</div>

          {onAddNew && (
            <button
              className="btn-primary"
              onClick={onAddNew}
              style={{
                padding: '0.75rem 1.6rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '9999px',
                marginTop: '0.35rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              <span>Set Budget</span>
            </button>
          )}

          <div className="empty-state-quote">
            "{quote.quote}"
            <div style={{ fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>— {quote.author}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {budgets.map((b) => {
            const isOver = b.is_over_budget;
            const usagePct = Math.min(100, Math.round(b.usage_percent || 0));

            return (
              <div
                key={b.budget_id}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  borderLeft: isOver ? '4px solid var(--danger)' : '4px solid var(--success)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{b.category_name}</span>
                      <span style={{ fontSize: '0.72rem', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', padding: '0.15rem 0.45rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                        {Number(b.period_months) === 0 ? 'One-Time Cap' : b.period_months === 1 ? 'Monthly' : `Every ${b.period_months} mo`}
                      </span>
                      {isOver && (
                        <span style={{ fontSize: '0.72rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <AlertTriangle size={12} /> Over Budget (+${Number(b.overage).toFixed(2)})
                        </span>
                      )}
                    </div>
                    <div className="row-subtitle" style={{ marginTop: '0.35rem' }}>
                      <span>Budget Limit: ${Number(b.planned_amount).toFixed(2)} {b.currency}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isOver ? 'var(--danger)' : 'var(--success)' }}>
                      ${Number(b.actual_amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isOver ? `$${Number(b.overage).toFixed(2)} exceeded` : `$${Number(b.remaining_budget).toFixed(2)} available`}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', background: 'var(--bg-subtle)', height: '8px', borderRadius: '4px', overflow: 'hidden', margin: '0.875rem 0' }}>
                  <div style={{ width: `${usagePct}%`, background: isOver ? 'var(--danger)' : 'var(--success)', height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {b.usage_percent}% of limit spent
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => onEdit(b)} title="Edit Budget">
                      <Edit3 size={16} />
                    </button>
                    <button className="btn-icon delete" onClick={() => onDelete(b.budget_id)} title="Delete Budget">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
