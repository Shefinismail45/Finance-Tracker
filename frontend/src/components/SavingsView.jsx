import React from 'react';
import { SavingsSummaryBar } from './SavingsSummaryBar';
import { SavingsList } from './SavingsList';

export function SavingsView({
  savingsSummary,
  currency,
  savingsSort,
  onSortChange,
  goals,
  onEdit,
  onDelete,
  onLogDeposit,
  onViewHistory,
  onAddNew,
  loading
}) {
  return (
    <>
      <SavingsSummaryBar 
        summary={savingsSummary} 
        currency={currency}
        currentSort={savingsSort}
        onSortChange={onSortChange}
      />

      <SavingsList
        goals={goals}
        onEdit={onEdit}
        onDelete={onDelete}
        onLogDeposit={onLogDeposit}
        onViewHistory={onViewHistory}
        onAddNew={onAddNew}
        loading={loading}
        currency={currency}
      />
    </>
  );
}

export default SavingsView;
