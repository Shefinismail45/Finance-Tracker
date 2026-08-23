import React from 'react';
import { getCurrencySymbol } from '../currencies';
import { SortControl } from './SortControl';

export function SavingsSummaryBar({ summary, currency = 'USD', currentSort, onSortChange }) {
  const currSymbol = getCurrencySymbol(currency);
  const totalSaved = Number(summary?.total_saved || 0);
  const plannedMonthly = Number(summary?.total_planned_monthly_savings || 0);
  const activeCount = summary?.active_goal_count || 0;
  const reachedCount = summary?.target_reached_count || 0;

  const sortOptions = [
    { key: 'amount_desc', label: 'Saved: High to Low' },
    { key: 'amount_asc', label: 'Saved: Low to High' },
    { key: 'date_desc', label: 'Date: Newest First' },
    { key: 'date_asc', label: 'Date: Oldest First' }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
      <div className="filter-chips-bar" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
        <div className="filter-chip active" style={{ cursor: 'default' }}>
          Total Saved: {currSymbol}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        <div className="filter-chip" style={{ cursor: 'default' }}>
          Monthly Commitment: {currSymbol}{plannedMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
        </div>

        <div className="filter-chip" style={{ cursor: 'default' }}>
          {activeCount} Active ({reachedCount} Met)
        </div>
      </div>

      {onSortChange && (
        <SortControl
          options={sortOptions}
          currentSort={currentSort || 'amount_desc'}
          onSortChange={onSortChange}
        />
      )}
    </div>
  );
}
