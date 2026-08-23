import React from 'react';
import { getCurrencySymbol } from '../currencies';
import { SortControl } from './SortControl';

export function DebtSummaryBar({ summary, activeFilter, onSelectFilter, currency = 'USD', currentSort, onSortChange }) {
  const currSymbol = getCurrencySymbol(currency);
  const remaining = Number(summary?.total_remaining || 0);
  const activeCount = summary?.active_debt_count || 0;
  const paidOffCount = summary?.paid_off_count || 0;

  const sortOptions = [
    { key: 'avalanche', label: 'Avalanche Order (Default)' },
    { key: 'amount_desc', label: 'Balance: High to Low' },
    { key: 'amount_asc', label: 'Balance: Low to High' },
    { key: 'date_desc', label: 'Date Started: Newest' },
    { key: 'date_asc', label: 'Date Started: Oldest' }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
      <div className="filter-chips-bar" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
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

      {onSortChange && (
        <SortControl
          options={sortOptions}
          currentSort={currentSort || 'avalanche'}
          onSortChange={onSortChange}
        />
      )}
    </div>
  );
}
