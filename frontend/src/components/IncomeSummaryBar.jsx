import React from 'react';
import { getCurrencySymbol } from '../currencies';
import { Banknote, Repeat, Layers } from 'lucide-react';

export function IncomeSummaryBar({ summary, selectedCategoryId, onSelectCategory, currency = 'USD' }) {
  const currSymbol = getCurrencySymbol(currency);
  const totalReceived = Number(summary?.total_received || 0);
  const totalMonthly = Number(summary?.total_monthly_income || 0);
  const totalCount = summary?.total_streams_count || 0;
  const categories = summary?.categories || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
      
      {/* Top Dual Metric Highlights: Actual Total Received vs. Normalized Recurring */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        
        {/* Total Inflows Received (Actual Total) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.85rem',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Banknote size={14} color="var(--success)" /> Total Received (All Time)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.2rem' }}>
              +{currSymbol}{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            {totalCount} total entries
          </div>
        </div>

        {/* Recurring Monthly Baseline */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.85rem',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Repeat size={14} color="var(--primary)" /> Recurring Baseline
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              ≈ {currSymbol}{totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>/mo</span>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            Active recurring
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="filter-chips-bar" style={{ margin: 0 }}>
        <button
          className={`filter-chip ${selectedCategoryId === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          All Streams ({currSymbol}{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.category_id}
            className={`filter-chip ${selectedCategoryId === cat.category_id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.category_id)}
          >
            {cat.category_name} ({currSymbol}{Number(cat.total_received).toLocaleString(undefined, { minimumFractionDigits: 2 })})
          </button>
        ))}
      </div>
    </div>
  );
}
