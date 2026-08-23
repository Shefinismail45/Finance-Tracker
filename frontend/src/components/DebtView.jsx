import React from 'react';
import { DebtSummaryBar } from './DebtSummaryBar';
import { DebtList } from './DebtList';

export function DebtView({
  debtSummary,
  debtFilter,
  onSelectFilter,
  currency,
  debtSort,
  onSortChange,
  debts,
  onEdit,
  onDelete,
  onLogPayment,
  onViewHistory,
  onAddNew,
  loading
}) {
  return (
    <>
      <DebtSummaryBar 
        summary={debtSummary}
        activeFilter={debtFilter}
        onSelectFilter={onSelectFilter}
        currency={currency}
        currentSort={debtSort}
        onSortChange={onSortChange}
      />

      <DebtList
        debts={debts}
        onEdit={onEdit}
        onDelete={onDelete}
        onLogPayment={onLogPayment}
        onViewHistory={onViewHistory}
        onAddNew={onAddNew}
        loading={loading}
        currency={currency}
      />
    </>
  );
}

export default DebtView;
