import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';

export function SortControl({ options, currentSort, onSortChange, label = 'Sort' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeOption = options.find((opt) => opt.key === currentSort) || options[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '9999px',
          padding: '0.4rem 0.8rem',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--card-shadow)'
        }}
        title="Change sort order"
      >
        <ArrowUpDown size={13} color="var(--primary)" />
        <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
        <strong style={{ color: 'var(--text-primary)' }}>{activeOption?.label || 'Default'}</strong>
        <ChevronDown size={12} style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 60,
            minWidth: '200px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.85rem',
            padding: '0.4rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.35rem 0.6rem 0.2rem 0.6rem' }}>
            Sort Options
          </div>
          {options.map((opt) => {
            const isSelected = opt.key === currentSort;
            return (
              <button
                type="button"
                key={opt.key}
                onClick={() => {
                  onSortChange(opt.key);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                  background: isSelected ? 'var(--bg-subtle)' : 'transparent',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} color="var(--primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
