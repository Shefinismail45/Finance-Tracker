import React from 'react';

export function IncomeSummaryBar({ summary, selectedCategoryId, onSelectCategory }) {
  const total = Number(summary?.total_monthly_income || 0);
  const categories = summary?.categories || [];

  return (
    <div className="filter-chips-bar" style={{ marginBottom: '1.25rem' }}>
      <button
        className={`filter-chip ${selectedCategoryId === null ? 'active' : ''}`}
        onClick={() => onSelectCategory(null)}
      >
        All Streams (${total.toFixed(2)}/mo)
      </button>

      {categories.map((cat) => (
        <button
          key={cat.category_id}
          className={`filter-chip ${selectedCategoryId === cat.category_id ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat.category_id)}
        >
          {cat.category_name} (${Number(cat.monthly_amount).toFixed(2)}/mo)
        </button>
      ))}
    </div>
  );
}
