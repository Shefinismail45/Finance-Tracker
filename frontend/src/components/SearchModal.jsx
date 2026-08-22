import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Receipt, Banknote, CreditCard, PiggyBank, Sparkles } from 'lucide-react';
import { api } from '../api';
import { getCurrencySymbol } from '../currencies';
import { SearchSkeleton } from './Skeleton';

export function SearchModal({ onClose, onNavigate, currency = 'USD' }) {
  const [query, setQuery] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [debts, setDebts] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  const currSymbol = getCurrencySymbol(currency);

  useEffect(() => {
    inputRef.current?.focus();
    const loadAll = async () => {
      try {
        setLoading(true);
        const [exp, inc, deb, sav] = await Promise.all([
          api.getExpenses().catch(() => []),
          api.getIncomes().catch(() => []),
          api.getDebts().catch(() => []),
          api.getSavingsGoals().catch(() => [])
        ]);
        setExpenses(exp || []);
        setIncomes(inc || []);
        setDebts(deb || []);
        setSavings(sav || []);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Keyboard shortcut listener: Escape key closes search overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const q = query.toLowerCase().trim();

  const filteredExpenses = q ? expenses.filter(e => 
    (e.category_name && e.category_name.toLowerCase().includes(q)) ||
    (e.note && e.note.toLowerCase().includes(q)) ||
    String(e.amount).includes(q)
  ) : [];

  const filteredIncomes = q ? incomes.filter(i => 
    (i.category_name && i.category_name.toLowerCase().includes(q)) ||
    (i.note && i.note.toLowerCase().includes(q)) ||
    String(i.amount).includes(q)
  ) : [];

  const filteredDebts = q ? debts.filter(d => 
    (d.name && d.name.toLowerCase().includes(q)) ||
    (d.custom_debt_type && d.custom_debt_type.toLowerCase().includes(q)) ||
    String(d.principal_amount || d.principal).includes(q)
  ) : [];

  const filteredSavings = q ? savings.filter(s => 
    (s.name && s.name.toLowerCase().includes(q)) ||
    (s.custom_category && s.custom_category.toLowerCase().includes(q)) ||
    String(s.target_amount).includes(q)
  ) : [];

  const totalResults = filteredExpenses.length + filteredIncomes.length + filteredDebts.length + filteredSavings.length;

  return (
    <>
      {/* Backdrop overlay covering the screen below navbar */}
      <div className="search-overlay-backdrop" onClick={onClose} />

      {/* Floating search card anchored directly below the TopNavbar search icon */}
      <div 
        className="search-overlay-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="search-overlay-header">
          <Search size={18} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            className="search-overlay-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses, income, debts, savings..."
          />
          {query && (
            <button 
              className="btn-icon" 
              onClick={() => setQuery('')}
              style={{ width: '1.75rem', height: '1.75rem' }}
              title="Clear search query"
            >
              <X size={14} />
            </button>
          )}
          <button 
            className="btn-icon" 
            onClick={onClose}
            style={{ width: '1.75rem', height: '1.75rem' }}
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Results Content */}
        <div className="search-overlay-body">
          {loading && (
            <div style={{ padding: '0.25rem 0' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Fetching financial records...
              </div>
              <SearchSkeleton count={3} />
            </div>
          )}

          {!loading && !query && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <Search size={20} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quick Spotlight Search</div>
              <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Type any merchant, note, income stream, debt, or savings goal</div>
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No results found</div>
              <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                No records match "<strong>{query}</strong>"
              </div>
            </div>
          )}

          {/* 1. EXPENSES RESULTS */}
          {filteredExpenses.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                Expenses ({filteredExpenses.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {filteredExpenses.map(exp => (
                  <div 
                    key={exp.id}
                    className="list-row-item"
                    style={{
                      cursor: 'pointer',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-subtle)',
                      transition: 'background 0.15s ease'
                    }}
                    onClick={() => { onNavigate('expense'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="row-icon-circle" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', width: '2rem', height: '2rem' }}>
                        <Receipt size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{exp.category_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {exp.note ? exp.note : exp.occurred_at?.slice(0, 10)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--danger-text)', fontSize: '0.9rem' }}>
                      -{currSymbol}{Number(exp.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. INCOME RESULTS */}
          {filteredIncomes.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                Income Streams ({filteredIncomes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {filteredIncomes.map(inc => (
                  <div 
                    key={inc.id}
                    className="list-row-item"
                    style={{
                      cursor: 'pointer',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-subtle)',
                      transition: 'background 0.15s ease'
                    }}
                    onClick={() => { onNavigate('income'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="row-icon-circle" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', width: '2rem', height: '2rem' }}>
                        <Banknote size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{inc.category_name || 'Income'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {inc.note || (Number(inc.period_months) === 0 ? 'One-Time' : inc.period_label || 'Recurring')}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--success-text)', fontSize: '0.9rem' }}>
                      +{currSymbol}{Number(inc.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. DEBT RESULTS */}
          {filteredDebts.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                Debts ({filteredDebts.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {filteredDebts.map(deb => {
                  const remaining = deb.remaining_balance !== undefined ? deb.remaining_balance : (deb.principal_amount || deb.principal);
                  return (
                    <div 
                      key={deb.id}
                      className="list-row-item"
                      style={{
                        cursor: 'pointer',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '0.75rem',
                        background: 'var(--bg-subtle)',
                        transition: 'background 0.15s ease'
                      }}
                      onClick={() => { onNavigate('debt'); onClose(); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="row-icon-circle" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', width: '2rem', height: '2rem' }}>
                          <CreditCard size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{deb.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Interest: {deb.interest_rate}% APR</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--danger-text)', fontSize: '0.9rem' }}>
                        {currSymbol}{Number(remaining).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. SAVINGS RESULTS */}
          {filteredSavings.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                Savings Goals ({filteredSavings.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {filteredSavings.map(sav => (
                  <div 
                    key={sav.id}
                    className="list-row-item"
                    style={{
                      cursor: 'pointer',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-subtle)',
                      transition: 'background 0.15s ease'
                    }}
                    onClick={() => { onNavigate('savings'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="row-icon-circle" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', width: '2rem', height: '2rem' }}>
                        <PiggyBank size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{sav.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {sav.target_amount ? `Target: ${currSymbol}${Number(sav.target_amount).toFixed(0)}` : 'Open Buffer'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--success-text)', fontSize: '0.9rem' }}>
                      +{currSymbol}{Number(sav.total_saved || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
