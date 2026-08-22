import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowDownRight, ArrowUpRight, CreditCard, PiggyBank, PieChart, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { getCurrencySymbol } from '../currencies';

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
          api.getIncome().catch(() => []),
          api.getDebts().catch(() => []),
          api.getSavingsGoals().catch(() => [])
        ]);
        setExpenses(exp);
        setIncomes(inc);
        setDebts(deb);
        setSavings(sav);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const q = query.toLowerCase().trim();

  const filteredExpenses = q ? expenses.filter(e => 
    (e.category_name && e.category_name.toLowerCase().includes(q)) ||
    (e.note && e.note.toLowerCase().includes(q)) ||
    String(e.amount).includes(q)
  ) : [];

  const filteredIncomes = q ? incomes.filter(i => 
    (i.name && i.name.toLowerCase().includes(q)) ||
    (i.category_name && i.category_name.toLowerCase().includes(q)) ||
    String(i.amount).includes(q)
  ) : [];

  const filteredDebts = q ? debts.filter(d => 
    (d.name && d.name.toLowerCase().includes(q)) ||
    String(d.principal).includes(q) ||
    String(d.remaining_balance).includes(q)
  ) : [];

  const filteredSavings = q ? savings.filter(s => 
    (s.name && s.name.toLowerCase().includes(q)) ||
    String(s.target_amount).includes(q)
  ) : [];

  const totalResults = filteredExpenses.length + filteredIncomes.length + filteredDebts.length + filteredSavings.length;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
      >
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <Search size={20} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses, income, debts, savings..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontWeight: 600
            }}
          />
          {query && (
            <button 
              className="btn-icon" 
              onClick={() => setQuery('')}
              style={{ width: '1.75rem', height: '1.75rem' }}
            >
              <X size={14} />
            </button>
          )}
          <button 
            className="btn-icon" 
            onClick={onClose}
            style={{ width: '2rem', height: '2rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Searching your financial records...
            </div>
          )}

          {!loading && !query && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Quick Spotlight Search</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Type an expense note, income stream, debt, or savings goal</div>
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              No financial records match "<strong>{query}</strong>"
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
                    style={{ cursor: 'pointer', padding: '0.65rem 0.85rem' }}
                    onClick={() => { onNavigate('expense'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="row-icon-circle" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', width: '2rem', height: '2rem' }}>
                        <ArrowDownRight size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{exp.category_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{exp.note || exp.occurred_at?.slice(0, 10)}</div>
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
                    style={{ cursor: 'pointer', padding: '0.65rem 0.85rem' }}
                    onClick={() => { onNavigate('income'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="row-icon-circle" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', width: '2rem', height: '2rem' }}>
                        <ArrowUpRight size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{inc.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inc.category_name} • {inc.cadence}</div>
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
                {filteredDebts.map(deb => (
                  <div 
                    key={deb.id}
                    className="list-row-item"
                    style={{ cursor: 'pointer', padding: '0.65rem 0.85rem' }}
                    onClick={() => { onNavigate('debt'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="row-icon-circle" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', width: '2rem', height: '2rem' }}>
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{deb.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Interest: {deb.interest_rate}% APR</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--danger-text)', fontSize: '0.9rem' }}>
                      {currSymbol}{Number(deb.remaining_balance).toFixed(2)}
                    </div>
                  </div>
                ))}
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
                    style={{ cursor: 'pointer', padding: '0.65rem 0.85rem' }}
                    onClick={() => { onNavigate('savings'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="row-icon-circle" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', width: '2rem', height: '2rem' }}>
                        <PiggyBank size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{sav.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: {currSymbol}{Number(sav.target_amount).toFixed(0)}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--success-text)', fontSize: '0.9rem' }}>
                      +{currSymbol}{Number(sav.total_saved).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
