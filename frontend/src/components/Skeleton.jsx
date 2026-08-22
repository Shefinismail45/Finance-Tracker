import React from 'react';

/**
 * Base Shimmer Skeleton Element
 */
export function Skeleton({ width, height, borderRadius, style = {}, className = '' }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        borderRadius: borderRadius || '0.5rem',
        ...style
      }}
    />
  );
}

/**
 * List Skeleton (for ExpenseList, IncomeList)
 */
export function ListSkeleton({ count = 4 }) {
  return (
    <div className="list-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="item-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            border: '1px solid var(--border-color)',
            opacity: 1 - idx * 0.12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Skeleton width="2.4rem" height="2.4rem" borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Skeleton width="130px" height="1.1rem" />
                <Skeleton width="55px" height="0.9rem" borderRadius="0.35rem" />
              </div>
              <Skeleton width="90px" height="0.75rem" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
            <Skeleton width="85px" height="1.25rem" />
            <Skeleton width="45px" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Card Skeleton (for SavingsList, DebtList)
 */
export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="glass-card"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            opacity: 1 - idx * 0.12
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Skeleton width="160px" height="1.2rem" />
                <Skeleton width="70px" height="0.9rem" borderRadius="0.35rem" />
              </div>
              <Skeleton width="180px" height="0.8rem" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
              <Skeleton width="100px" height="1.4rem" />
              <Skeleton width="80px" height="0.75rem" />
            </div>
          </div>

          {/* Progress bar */}
          <Skeleton width="100%" height="8px" borderRadius="4px" />

          {/* Bottom row actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="120px" height="0.85rem" />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Skeleton width="80px" height="2rem" borderRadius="0.5rem" />
              <Skeleton width="80px" height="2rem" borderRadius="0.5rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Budget List Skeleton
 */
export function BudgetSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top summary bar skeleton */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Skeleton width="120px" height="0.75rem" />
          <Skeleton width="140px" height="1.4rem" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <Skeleton width="130px" height="0.75rem" />
          <Skeleton width="140px" height="1.4rem" />
        </div>
      </div>

      {/* Budget items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Skeleton width="130px" height="1.15rem" />
                  <Skeleton width="60px" height="0.85rem" />
                </div>
                <Skeleton width="140px" height="0.8rem" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                <Skeleton width="90px" height="1.35rem" />
                <Skeleton width="75px" height="0.75rem" />
              </div>
            </div>

            <Skeleton width="100%" height="8px" borderRadius="4px" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="110px" height="0.8rem" />
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <Skeleton width="2rem" height="2rem" borderRadius="0.4rem" />
                <Skeleton width="2rem" height="2rem" borderRadius="0.4rem" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Executive Dashboard Skeleton
 */
export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Hero Net Worth Skeleton */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="180px" height="1rem" />
          <Skeleton width="90px" height="1.4rem" borderRadius="9999px" />
        </div>
        <Skeleton width="260px" height="3rem" borderRadius="0.75rem" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Skeleton width="90px" height="0.75rem" />
            <Skeleton width="130px" height="1.4rem" />
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Skeleton width="90px" height="0.75rem" />
            <Skeleton width="130px" height="1.4rem" />
          </div>
        </div>
      </div>

      {/* 2. Monthly Flow Stat Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="110px" height="0.85rem" />
              <Skeleton width="2rem" height="2rem" borderRadius="50%" />
            </div>
            <Skeleton width="140px" height="1.75rem" />
            <Skeleton width="160px" height="0.75rem" />
          </div>
        ))}
      </div>

      {/* 3. Forecast Chart / Breakdown Skeleton */}
      <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <Skeleton width="200px" height="1.25rem" />
            <Skeleton width="240px" height="0.8rem" />
          </div>
          <Skeleton width="110px" height="2rem" borderRadius="0.5rem" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <Skeleton width="100%" height="80px" borderRadius="0.75rem" />
          <Skeleton width="100%" height="80px" borderRadius="0.75rem" />
          <Skeleton width="100%" height="80px" borderRadius="0.75rem" />
        </div>
      </div>
    </div>
  );
}

/**
 * Search Results Skeleton
 */
export function SearchSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.85rem',
            background: 'var(--bg-subtle)',
            borderRadius: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Skeleton width="2rem" height="2rem" borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <Skeleton width="110px" height="0.85rem" />
              <Skeleton width="80px" height="0.7rem" />
            </div>
          </div>
          <Skeleton width="65px" height="1rem" />
        </div>
      ))}
    </div>
  );
}

/**
 * Modal List Skeleton (for payment history, notifications)
 */
export function ModalListSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.5rem 0' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'var(--bg-subtle)',
            borderRadius: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Skeleton width="2.2rem" height="2.2rem" borderRadius="0.5rem" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <Skeleton width="140px" height="0.9rem" />
              <Skeleton width="90px" height="0.75rem" />
            </div>
          </div>
          <Skeleton width="70px" height="1.1rem" />
        </div>
      ))}
    </div>
  );
}
