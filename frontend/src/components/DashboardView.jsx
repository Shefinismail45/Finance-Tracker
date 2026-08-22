import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Shield, 
  CreditCard, 
  PieChart, 
  ArrowDownRight, 
  ArrowUpRight, 
  PiggyBank, 
  RefreshCw, 
  Sparkles, 
  Quote, 
  History,
  Send,
  PlusCircle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { getRandomQuote } from '../quotes';
import { getCurrencySymbol } from '../currencies';

export function DashboardView({ onNavigate, onOpenForm, currency = 'USD' }) {
  const [forecastDays, setForecastDays] = useState(30);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [savingsList, setSavingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(getRandomQuote());
  const [activeChip, setActiveChip] = useState('All');

  const currSymbol = getCurrencySymbol(currency);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, expRes, savRes] = await Promise.all([
        api.getDashboard(forecastDays),
        api.getExpenses(),
        api.getSavingsGoals()
      ]);
      setDashboardData(dashRes);
      setRecentExpenses(expRes.slice(0, 5));
      setSavingsList(savRes.slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [forecastDays]);

  const refreshQuote = () => {
    setQuote(getRandomQuote());
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>Loading executive dashboard...</div>;
  }

  if (error) {
    return <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '1rem', borderRadius: '0.75rem', margin: '1rem 0' }}>{error}</div>;
  }

  const stock = dashboardData?.stock;
  const flow = dashboardData?.flow;
  const forecast = dashboardData?.forecast;
  const budgets = dashboardData?.budgets_overview;

  const netWorthNum = Number(stock?.net_worth || 0);
  const netWorthInt = Math.floor(Math.abs(netWorthNum)).toLocaleString();
  const netWorthCents = (Math.abs(netWorthNum) % 1).toFixed(2).substring(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Filter Chips Bar */}
      <div className="filter-chips-bar" style={{ padding: '0.25rem 0' }}>
        {['All', 'Expenses', 'Income', 'Debt Avalanche', 'Savings'].map((chip) => (
          <button
            key={chip}
            className={`filter-chip ${activeChip === chip ? 'active' : ''}`}
            onClick={() => {
              setActiveChip(chip);
              if (chip === 'Expenses') onNavigate('expense');
              else if (chip === 'Income') onNavigate('income');
              else if (chip === 'Debt Avalanche') onNavigate('debt');
              else if (chip === 'Savings') onNavigate('savings');
            }}
          >
            {chip}
          </button>
        ))}
        <button
          className="filter-chip"
          style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', fontWeight: 700 }}
          onClick={() => onNavigate('expense')}
        >
          + Add new
        </button>
      </div>

      {/* 1. HERO COBALT / GLOW BALANCE CARD (Using Selected Currency) */}
      <div className="hero-balance-card">
        
        {/* Top Header Label */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <div className="hero-label" style={{ justifyContent: 'center' }}>
            <span>Net Worth Balance • {currency}</span>
          </div>
          
          {/* Main Huge Balance */}
          <div className="hero-amount" style={{ justifyContent: 'center', margin: '0.35rem 0 0.5rem 0' }}>
            {netWorthNum < 0 && '-'}{currSymbol}{netWorthInt}<span className="cents">{netWorthCents}</span>
          </div>

          {/* Breakdown Chips Under Balance */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              background: 'rgba(255, 255, 255, 0.14)', 
              color: '#ffffff', 
              padding: '0.25rem 0.65rem', 
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <Shield size={12} color="#34d399" /> Saved: {currSymbol}{Number(stock?.total_savings || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>

            <span style={{ 
              fontSize: '0.75rem', 
              background: 'rgba(255, 255, 255, 0.14)', 
              color: '#ffffff', 
              padding: '0.25rem 0.65rem', 
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <CreditCard size={12} color="#fca5a5" /> Debt: {currSymbol}{Number(stock?.total_debt || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* 3D Floating Smart Card Visual */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
          borderRadius: '1.25rem',
          padding: '1.2rem 1.5rem',
          margin: '1.25rem auto 1rem auto',
          maxWidth: '380px',
          boxShadow: '0 18px 30px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Card subtle shine */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-30%',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
              FinanceTracker • {currency}
            </span>
            <div style={{ width: '28px', height: '18px', borderRadius: '4px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', opacity: 0.9 }} />
          </div>

          <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.22em', color: '#e2e8f0', fontFamily: 'monospace' }}>
            •••• •••• •••• 2026
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Available Cash Flow</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
                +{currSymbol}{Number(flow?.net_monthly_flow || 0).toFixed(2)}/mo
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>08/29</span>
          </div>
        </div>

        {/* 3 Circular Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          marginTop: '1.25rem',
          paddingTop: '0.75rem'
        }}>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onNavigate('expense')}>
            <div style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.35rem auto',
              color: '#f87171',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <ArrowDownRight size={20} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
              Expense
            </span>
          </div>

          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onNavigate('income')}>
            <div style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.35rem auto',
              color: '#34d399',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <ArrowUpRight size={20} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
              Income
            </span>
          </div>

          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onNavigate('debt')}>
            <div style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.35rem auto',
              color: '#fbbf24',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <CreditCard size={20} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
              Pay Debt
            </span>
          </div>

          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onNavigate('savings')}>
            <div style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.35rem auto',
              color: '#60a5fa',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <PiggyBank size={20} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
              Deposit
            </span>
          </div>
        </div>

      </div>

      {/* Motivational Quote Banner */}
      <div className="quote-banner">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Quote size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="quote-text">"{quote.quote}"</div>
            <div className="quote-author">— {quote.author}</div>
          </div>
        </div>
        <button 
          className="btn-icon" 
          onClick={refreshQuote} 
          title="New Motivational Quote"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 2. OPERATIONS & RECENT TRANSACTIONS */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={19} color="var(--primary)" /> Operations & Transactions
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('expense')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '9999px' }}
          >
            All &gt;
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No operations logged yet. Click "+ Add new" to start tracking!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentExpenses.map((exp) => {
              const expSymbol = getCurrencySymbol(exp.currency || currency);
              return (
                <div 
                  key={exp.id}
                  className="list-row-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('expense')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div 
                      className="row-icon-circle"
                      style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)' }}
                    >
                      <ArrowDownRight size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {exp.category_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {exp.note ? exp.note : exp.occurred_at?.slice(0, 10)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--danger)' }}>
                      -{expSymbol}{Number(exp.amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {exp.currency || currency}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. STORED SAVINGS GOALS */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={19} color="var(--success)" /> Stored Savings & Goals
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('savings')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '9999px' }}
          >
            All &gt;
          </button>
        </div>

        {savingsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No active savings goals. Create your first goal to automate your wealth!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {savingsList.map((g, idx) => {
              const goalSymbol = getCurrencySymbol(g.currency || currency);
              return (
                <div 
                  key={g.id}
                  className="list-row-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('savings')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div 
                      className="row-icon-circle"
                      style={{
                        background: idx % 2 === 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: idx % 2 === 0 ? 'var(--primary)' : 'var(--success)'
                      }}
                    >
                      <PiggyBank size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {g.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {g.target_amount ? `Target: ${goalSymbol}${Number(g.target_amount).toFixed(0)} • ${g.progress_percent}% achieved` : 'Open buffer fund'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--success)' }}>
                      +{goalSymbol}{Number(g.total_saved).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {goalSymbol}{Number(g.monthly_planned_contribution || g.contribution_amount).toFixed(0)}/mo
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
