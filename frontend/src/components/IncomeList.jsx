import React from 'react';
import { Trash2, Edit3, ArrowUpRight } from 'lucide-react';
import { getRandomQuote } from '../quotes';

export function IncomeList({ incomes, onEdit, onDelete, loading }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>Loading income streams...</div>;
  }

  const quote = getRandomQuote(2);

  if (incomes.length === 0) {
    return (
      <div className="empty-state">
        <div className="row-icon-circle income" style={{ width: '3rem', height: '3rem' }}>
          <ArrowUpRight size={24} />
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No income streams added yet</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Add your salary, freelance retainers, or investment inflows.</div>
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
        const periodText = inc.period_months === 1 ? 'Monthly' : inc.period_months === 3 ? 'Quarterly' : inc.period_months === 12 ? 'Yearly' : `Every ${inc.period_months} mo`;
        const monthlyAmt = Number(inc.monthly_equivalent || (inc.amount / (inc.period_months || 1)));

        return (
          <div key={inc.id} className="item-row">
            <div className="row-left">
              <div className="row-icon-circle income">
                <ArrowUpRight size={20} />
              </div>
              <div className="row-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="row-title">{inc.category_name || 'Income Stream'}</span>
                  <span style={{ fontSize: '0.7rem', background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.1rem 0.45rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                    {periodText}
                  </span>
                  {!inc.is_active && (
                    <span style={{ fontSize: '0.7rem', background: 'var(--bg-subtle)', color: 'var(--text-muted)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                      Inactive
                    </span>
                  )}
                </div>
                <div className="row-subtitle">
                  <span>Started {inc.start_date}</span>
                  {inc.note && <span>• {inc.note}</span>}
                </div>
              </div>
            </div>

            <div className="row-right">
              <div>
                <div className="row-amount income">
                  +${Number(inc.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ≈ ${monthlyAmt.toFixed(2)}/mo
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn-icon" onClick={() => onEdit(inc)} title="Edit Stream">
                  <Edit3 size={16} />
                </button>
                <button className="btn-icon delete" onClick={() => onDelete(inc.id)} title="Delete Stream">
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
