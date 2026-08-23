import React from 'react';
import { getCurrencySymbol } from '../currencies';

export function SavingsSummaryBar({ summary, currency = 'USD' }) {
  const currSymbol = getCurrencySymbol(currency);
  const totalSaved = Number(summary?.total_saved || 0);
  const plannedMonthly = Number(summary?.total_planned_monthly_savings || 0);
  const activeCount = summary?.active_goal_count || 0;
  const reachedCount = summary?.target_reached_count || 0;

  return (
    <div className="filter-chips-bar" style={{ marginBottom: '1.25rem' }}>
      <div className="filter-chip active" style={{ cursor: 'default' }}>
        Total Saved: {currSymbol}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div className="filter-chip" style={{ cursor: 'default' }}>
        Monthly Commitment: {currSymbol}{plannedMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
      </div>

      <div className="filter-chip" style={{ cursor: 'default' }}>
        {activeCount} Active Goals ({reachedCount} Completed)
      </div>
    </div>
  );
}
