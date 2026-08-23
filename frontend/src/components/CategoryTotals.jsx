import React from 'react';
import { getCurrencySymbol } from '../currencies';
import { SortControl } from './SortControl';

export function CategoryTotals({ totals, selectedCategoryId, onSelectCategory, currency = 'USD', currentSort, onSortChange }) {
  const currSymbol = getCurrencySymbol(currency);
  const overallTotal = totals.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  const sortOptions = [
    { key: 'date_desc', label: 'Newest First' },
    { key: 'date_asc', label: 'Oldest First' },
    { key: 'amount_desc', label: 'Amount: High to Low' },
    { key: 'amount_asc', label: 'Amount: Low to High' }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
      {/* Category Filter Chips */}
      <div className="filter-chips-bar" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
        <button
          className={`filter-chip ${selectedCategoryId === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          All Categories ({currSymbol}{overallTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
        </button>

        {totals.map((item) => (
          <button
            key={item.category_id}
            className={`filter-chip ${selectedCategoryId === item.category_id ? 'active' : ''}`}
            onClick={() => onSelectCategory(item.category_id)}
          >
            {item.category_name} ({currSymbol}{Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </button>
        ))}
      </div>

      {/* Sort Control */}
      {onSortChange && (
        <SortControl
          options={sortOptions}
          currentSort={currentSort || 'date_desc'}
          onSortChange={onSortChange}
        />
      )}
    </div>
  );
}
