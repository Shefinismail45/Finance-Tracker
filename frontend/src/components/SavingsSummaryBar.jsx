import React from 'react';

export function SavingsSummaryBar({ summary }) {
  const totalSaved = Number(summary?.total_saved || 0);
  const plannedMonthly = Number(summary?.total_planned_monthly_savings || 0);
  const activeCount = summary?.active_goal_count || 0;
  const reachedCount = summary?.target_reached_count || 0;

  return (
    <div className="filter-chips-bar" style={{ marginBottom: '1.25rem' }}>
      <div className="filter-chip active" style={{ cursor: 'default' }}>
        Total Saved: ${totalSaved.toFixed(2)}
      </div>

      <div className="filter-chip" style={{ cursor: 'default' }}>
        Monthly Commitment: ${plannedMonthly.toFixed(2)}/mo
      </div>

      <div className="filter-chip" style={{ cursor: 'default' }}>
        {activeCount} Active Goals ({reachedCount} Completed)
      </div>
    </div>
  );
}
