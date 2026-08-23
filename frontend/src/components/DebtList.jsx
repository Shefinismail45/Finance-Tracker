import React from 'react';
import { Trash2, Edit3, DollarSign, History, CheckCircle2, CreditCard, ShieldAlert, Plus } from 'lucide-react';
import { getRandomQuote } from '../quotes';
import { getCurrencySymbol } from '../currencies';
import { CardSkeleton } from './Skeleton';

export function DebtList({ debts, onEdit, onDelete, onLogPayment, onViewHistory, onAddNew, loading, currency = 'USD' }) {
  if (loading) {
    return <CardSkeleton count={3} />;
  }

  const quote = getRandomQuote(3);
  const currSymbol = getCurrencySymbol(currency);

  if (debts.length === 0) {
    return (
      <div className="empty-state">
        <div className="row-icon-circle debt" style={{ width: '3.25rem', height: '3.25rem' }}>
          <CreditCard size={26} />
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Debt Free! Zero debts tracked</div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px' }}>Track credit cards, personal loans, or zero-interest debts to monitor repayments with the debt avalanche method.</div>

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
            <span>Add Debt</span>
          </button>
        )}

        <div className="empty-state-quote">
          "{quote.quote}"
          <div style={{ fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>— {quote.author}</div>
        </div>
      </div>
    );
  }

  const activeDebts = debts.filter((d) => !d.is_paid_off);
  const paidOffDebts = debts.filter((d) => d.is_paid_off);

  const getDebtBadge = (debt) => {
    if (debt.debt_type === 'credit_card') return { label: 'Credit Card', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    if (debt.debt_type === 'loan') return { label: 'Bank Loan', bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' };
    if (debt.debt_type === 'no_interest') return { label: '0% APR Personal', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    return { label: debt.custom_debt_type || 'Other Debt', bg: 'var(--bg-subtle)', color: 'var(--text-secondary)' };
  };

  const renderDebtCard = (debt, isMuted = false) => {
    const badge = getDebtBadge(debt);
    const progressPct = Math.min(100, Math.round((Number(debt.total_paid || 0) / Number(debt.principal_amount || 1)) * 100));

    return (
      <div key={debt.id} className="glass-card" style={{ opacity: isMuted ? 0.75 : 1, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{debt.name}</span>
              <span style={{ fontSize: '0.7rem', background: badge.bg, color: badge.color, padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                {badge.label}
              </span>
              {Number(debt.interest_rate) > 0 ? (
                <span style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                  {debt.interest_rate}% APR
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                  0% Interest
                </span>
              )}
            </div>
            <div className="row-subtitle" style={{ marginTop: '0.35rem' }}>
              <span>Started {debt.start_date}</span>
              {debt.note && <span>• {debt.note}</span>}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isMuted ? 'var(--success)' : 'var(--danger)' }}>
              {isMuted ? 'PAID OFF 🎉' : `${currSymbol}${Number(debt.remaining_balance).toFixed(2)}`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isMuted ? `${currSymbol}${Number(debt.total_paid).toFixed(2)} settled` : `of ${currSymbol}${Number(debt.principal_amount).toFixed(2)} principal`}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', background: 'var(--bg-subtle)', height: '8px', borderRadius: '4px', overflow: 'hidden', margin: '0.875rem 0' }}>
          <div style={{ width: `${progressPct}%`, background: isMuted ? 'var(--success)' : 'var(--primary-gradient)', height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }} />
        </div>

        {/* Actions bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {debt.payment_count || 0} payments logged ({progressPct}% paid)
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isMuted && (
              <button
                className="btn-primary"
                onClick={() => onLogPayment(debt)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.5rem', background: 'var(--success)', boxShadow: 'none' }}
              >
                <DollarSign size={14} /> Log Payment
              </button>
            )}

            <button className="btn-secondary" onClick={() => onViewHistory(debt)} title="View Payment Log" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>
              <History size={14} style={{ marginRight: '0.25rem', display: 'inline' }} /> History
            </button>

            <button className="btn-icon" onClick={() => onEdit(debt)} title="Edit Debt">
              <Edit3 size={16} />
            </button>

            <button className="btn-icon delete" onClick={() => onDelete(debt.id)} title="Delete Debt">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Active Debts (Avalanche Priority) */}
      {activeDebts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={16} color="var(--danger)" /> ACTIVE DEBTS ({activeDebts.length}) • Avalanche Order
          </div>
          {activeDebts.map((d) => renderDebtCard(d, false))}
        </div>
      )}

      {/* Paid Off Debts */}
      {paidOffDebts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} /> COMPLETED / PAID OFF ({paidOffDebts.length})
          </div>
          {paidOffDebts.map((d) => renderDebtCard(d, true))}
        </div>
      )}
    </div>
  );
}
