import React from 'react';
import { CategoryTotals } from './CategoryTotals';
import { ExpenseList } from './ExpenseList';

export function ExpensesView({
  expenseTotals,
  selectedExpenseCatId,
  onSelectCategory,
  currency,
  expenseSort,
  onSortChange,
  expenses,
  onEdit,
  onDelete,
  onAddNew,
  loading
}) {
  return (
    <>
      <CategoryTotals
        totals={expenseTotals}
        selectedCategoryId={selectedExpenseCatId}
        onSelectCategory={onSelectCategory}
        currency={currency}
        currentSort={expenseSort}
        onSortChange={onSortChange}
      />

      <ExpenseList
        expenses={expenses}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddNew={onAddNew}
        loading={loading}
        currency={currency}
      />
    </>
  );
}

export default ExpensesView;
