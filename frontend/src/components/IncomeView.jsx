import React from 'react';
import { IncomeSummaryBar } from './IncomeSummaryBar';
import { IncomeList } from './IncomeList';

export function IncomeView({
  incomeSummary,
  selectedIncomeCatId,
  onSelectCategory,
  currency,
  incomeSort,
  onSortChange,
  incomes,
  onEdit,
  onDelete,
  onAddNew,
  loading
}) {
  return (
    <>
      <IncomeSummaryBar
        summary={incomeSummary}
        selectedCategoryId={selectedIncomeCatId}
        onSelectCategory={onSelectCategory}
        currency={currency}
        currentSort={incomeSort}
        onSortChange={onSortChange}
      />

      <IncomeList
        incomes={incomes}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddNew={onAddNew}
        loading={loading}
        currency={currency}
      />
    </>
  );
}

export default IncomeView;
