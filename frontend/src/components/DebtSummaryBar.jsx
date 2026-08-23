import React from 'react';
import { getCurrencySymbol } from '../currencies';

export function DebtSummaryBar({ summary, activeFilter, onSelectFilter, currency = 'USD' }) {
  const currSymbol = getCurrencySymbol(currency);
  const remaining = Number(summary?.total_remaining || 0);
  const paid = Number(summary?.total_paid || 0);
  const activeCount = summary?.active_debt_count || 0;
  const paidOffCount = summary?.paid_off_count || 0;

  return (
    <div className="filter-chips-bar" style={{ marginBottom: '1.25rem' }}>
      <button
        className={`filter-chip ${activeFilter === null ? 'active' : ''}`}
        onClick={() => onSelectFilter(null)}
      >
        All Debts ({currSymbol}{remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining)
      </button>

      <button
        className={`filter-chip ${activeFilter === 'active' ? 'active' : ''}`}
        onClick={() => onSelectFilter('active')}
      >
        Active ({activeCount})
      </button>

      <button
        className={`filter-chip ${activeFilter === 'paid_off' ? 'active' : ''}`}
        onClick={() => onSelectFilter('paid_off')}
      >
        Paid Off ({paidOffCount})
      </button>
    </div>
  );
}
