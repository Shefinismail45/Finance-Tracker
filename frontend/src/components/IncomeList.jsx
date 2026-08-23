import React from 'react';
import { Trash2, Edit3, Banknote, Plus } from 'lucide-react';
import { getRandomQuote } from '../quotes';
import { getCurrencySymbol } from '../currencies';
import { ListSkeleton } from './Skeleton';

export function IncomeList({ incomes, onEdit, onDelete, onAddNew, loading, currency = 'USD' }) {
  if (loading) {
    return <ListSkeleton count={3} />;
  }

  const quote = getRandomQuote(2);
  const currSymbol = getCurrencySymbol(currency);

  if (incomes.length === 0) {
    return (
      <div className="empty-state">
        <div className="row-icon-circle income" style={{ width: '3.25rem', height: '3.25rem' }}>
          <Banknote size={26} />
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>No income streams added yet</div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px' }}>Add your salary, freelance retainers, bonus, or investment inflows.</div>

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
            <span>Add Income</span>
          </button>
        )}

        <div className="empty-state-quote">
          "{quote.quote}"
          <div style={{ fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>— {quote.author}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="list-container">
      {incomes.map((inc) => {
        const isOneTime = Number(inc.period_months) === 0;
        const periodText = isOneTime
          ? 'One-Time'
          : inc.period_months === 1
          ? 'Monthly'
          : inc.period_months === 2
          ? 'Bi-Monthly'
          : inc.period_months === 3
          ? 'Quarterly'
          : inc.period_months === 6
          ? 'Half-Yearly'
          : inc.period_months === 12
          ? 'Yearly'
          : `Every ${inc.period_months} mo`;
        const monthlyAmt = isOneTime ? 0 : Number(inc.monthly_equivalent || (inc.amount / (inc.period_months || 1)));

        return (
          <div key={inc.id} className="item-row">
            <div className="row-left">
              <div className="row-icon-circle income">
                <Banknote size={20} />
              </div>
              <div className="row-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="row-title">{inc.category_name || 'Income Stream'}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: isOneTime ? 'rgba(59, 130, 246, 0.15)' : 'var(--success-bg)',
                      color: isOneTime ? '#3b82f6' : 'var(--success-text)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '0.25rem',
                      fontWeight: 700
                    }}
                  >
                    {periodText}
                  </span>
                  {!inc.is_active && !isOneTime && (
                    <span style={{ fontSize: '0.7rem', background: 'var(--bg-subtle)', color: 'var(--text-muted)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                      Inactive
                    </span>
                  )}
                </div>
                <div className="row-subtitle">
                  <span>{isOneTime ? `Received ${inc.start_date}` : `Started ${inc.start_date}`}</span>
                  {inc.note && <span>• {inc.note}</span>}
                </div>
              </div>
            </div>

            <div className="row-right">
              <div className="row-amount-block">
                <div className="row-amount income">
                  +{currSymbol}{Number(inc.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  {isOneTime ? 'One-time inflow' : `≈ ${currSymbol}${monthlyAmt.toFixed(2)}/mo`}
                </div>
              </div>

              <div className="row-actions">
                <button className="btn-icon" onClick={() => onEdit(inc)} title="Edit Stream" aria-label="Edit">
                  <Edit3 size={15} />
                </button>
                <button className="btn-icon delete" onClick={() => onDelete(inc.id)} title="Delete Stream" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
