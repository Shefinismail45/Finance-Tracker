import React from 'react';

export function CategoryTotals({ totals, selectedCategoryId, onSelectCategory }) {
  const overallTotal = totals.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const totalCount = totals.reduce((sum, item) => sum + Number(item.transaction_count || 0), 0);

  return (
    <div className="filter-chips-bar" style={{ marginBottom: '1.25rem' }}>
      <button
        className={`filter-chip ${selectedCategoryId === null ? 'active' : ''}`}
        onClick={() => onSelectCategory(null)}
      >
        All Categories (${overallTotal.toFixed(2)})
      </button>

      {totals.map((item) => (
        <button
          key={item.category_id}
          className={`filter-chip ${selectedCategoryId === item.category_id ? 'active' : ''}`}
          onClick={() => onSelectCategory(item.category_id)}
        >
          {item.category_name} (${Number(item.total_amount).toFixed(2)})
        </button>
      ))}
    </div>
  );
}
