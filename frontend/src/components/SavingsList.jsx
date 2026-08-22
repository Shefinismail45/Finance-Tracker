import React from 'react';
import { Trash2, Edit3, Plus, History, PiggyBank, Target, Sparkles } from 'lucide-react';
import { getRandomQuote } from '../quotes';

export function SavingsList({ goals, onEdit, onDelete, onLogDeposit, onViewHistory, loading }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>Loading savings goals...</div>;
  }

  const quote = getRandomQuote(0);

  if (goals.length === 0) {
    return (
      <div className="empty-state">
        <div className="row-icon-circle savings" style={{ width: '3rem', height: '3rem' }}>
          <PiggyBank size={24} />
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No savings goals created yet</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Start building an emergency cushion or saving for life goals.</div>
        <div className="empty-state-quote">
          "{quote.quote}"
          <div style={{ fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>— {quote.author}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {goals.map((g) => {
        const totalSaved = Number(g.total_saved || 0);
        const hasTarget = g.target_amount !== null && g.target_amount !== undefined;
        const targetAmount = hasTarget ? Number(g.target_amount) : null;
        const progressPct = hasTarget && targetAmount > 0 ? Math.min(100, Math.round((totalSaved / targetAmount) * 100)) : null;
        const isGoalReached = progressPct !== null && progressPct >= 100;

        return (
          <div
            key={g.id}
            className="glass-card"
            style={{
              padding: '1.25rem',
              borderLeft: isGoalReached ? '4px solid var(--success)' : '4px solid var(--primary)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{g.name}</span>
                  {g.custom_category && (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontWeight: 700 }}>
                      {g.custom_category}
                    </span>
                  )}
                  {isGoalReached && (
                    <span style={{ fontSize: '0.72rem', background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <Sparkles size={12} /> Target Met!
                    </span>
                  )}
                </div>
                <div className="row-subtitle" style={{ marginTop: '0.35rem' }}>
                  <span>Commitment: ${Number(g.contribution_amount).toFixed(2)} / {g.period_months === 1 ? 'month' : `${g.period_months} months`}</span>
                  {g.note && <span>• {g.note}</span>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>
                  ${totalSaved.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {hasTarget ? `of $${targetAmount.toFixed(2)} target` : 'Open-ended buffer'}
                </div>
              </div>
            </div>

            {/* Progress bar if target is set */}
            {hasTarget && (
              <div style={{ width: '100%', background: 'var(--bg-subtle)', height: '8px', borderRadius: '4px', overflow: 'hidden', margin: '0.875rem 0' }}>
                <div style={{ width: `${progressPct}%`, background: isGoalReached ? 'var(--success)' : 'var(--primary-gradient)', height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }} />
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: hasTarget ? 0 : '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {g.contribution_count || 0} deposits logged {hasTarget ? `(${progressPct}% achieved)` : ''}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={() => onLogDeposit(g)}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.5rem', background: 'var(--primary)', boxShadow: 'none' }}
                >
                  <Plus size={14} /> Deposit
                </button>

                <button className="btn-secondary" onClick={() => onViewHistory(g)} title="Deposit Log" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>
                  <History size={14} style={{ marginRight: '0.25rem', display: 'inline' }} /> History
                </button>

                <button className="btn-icon" onClick={() => onEdit(g)} title="Edit Goal">
                  <Edit3 size={16} />
                </button>

                <button className="btn-icon delete" onClick={() => onDelete(g.id)} title="Delete Goal">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
