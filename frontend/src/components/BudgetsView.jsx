import React from 'react';
import { BudgetList } from './BudgetList';

export function BudgetsView({
  budgets,
  onEdit,
  onDelete,
  onAddNew,
  currency,
  loading,
  currentSort,
  onSortChange
}) {
  return (
    <BudgetList
      budgets={budgets}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddNew={onAddNew}
      currency={currency}
      loading={loading}
      currentSort={currentSort}
      onSortChange={onSortChange}
    />
  );
}

export default BudgetsView;
