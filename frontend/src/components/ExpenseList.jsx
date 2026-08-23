import React from 'react';
import { Trash2, Edit3, Receipt, Repeat, Plus } from 'lucide-react';
import { getRandomQuote } from '../quotes';
import { getCurrencySymbol } from '../currencies';
import { ListSkeleton } from './Skeleton';

export function ExpenseList({ expenses, onEdit, onDelete, onAddNew, loading, currency = 'USD' }) {
  if (loading) {
    return <ListSkeleton count={4} />;
  }

  const quote = getRandomQuote(1);
  const currSymbol = getCurrencySymbol(currency);

  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <div className="row-icon-circle expense" style={{ width: '3.25rem', height: '3.25rem' }}>
          <Receipt size={26} />
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>No expenses logged yet</div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '400px' }}>Track your daily groceries, bills, housing, and shopping expenses.</div>
        
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
            <span>Log Expense</span>
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
      {expenses.map((exp) => {
        const dateStr = new Date(exp.occurred_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return (
          <div key={exp.id} className="item-row">
            <div className="row-left">
              <div className="row-icon-circle expense">
                <Receipt size={20} />
              </div>
              <div className="row-details">
                <div className="row-title">{exp.category_name}</div>
                <div className="row-subtitle">
                  <span>{dateStr}</span>
                  {exp.note && <span>• {exp.note}</span>}
                  {exp.is_recurring && (
                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <Repeat size={10} /> Recurring
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="row-right">
              <div>
                <div className="row-amount expense">
                  -{currSymbol}{Number(exp.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {exp.currency || currency}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn-icon" onClick={() => onEdit(exp)} title="Edit Expense">
                  <Edit3 size={16} />
                </button>
                <button className="btn-icon delete" onClick={() => onDelete(exp.id)} title="Delete Expense">
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
