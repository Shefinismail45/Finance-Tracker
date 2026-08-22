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
  Layers,
  ArrowRight,
  SlidersHorizontal,
  DollarSign,
  History
} from 'lucide-react';
import { api } from '../api';
import { getRandomQuote } from '../quotes';

export function DashboardView({ onNavigate, onOpenForm }) {
  const [forecastDays, setForecastDays] = useState(30);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [savingsList, setSavingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(getRandomQuote());
  const [activeChip, setActiveChip] = useState('All');

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
      setRecentExpenses(expRes.slice(0, 4));
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
      
      {/* 1. TOP FILTER CHIPS BAR (Matching Screenshot 1) */}
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

      {/* 2. HERO BALANCE & PERFORMANCE CARD (High-Fidelity Match to Screenshot) */}
      <div className="hero-balance-card">
        
        {/* Top Header of Card */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div className="hero-label" style={{ justifyContent: 'center' }}>
            <span>Net Worth Balance • USD</span>
          </div>
          <div className="hero-amount" style={{ justifyContent: 'center', marginTop: '0.25rem' }}>
            {netWorthNum < 0 && '-'}${netWorthInt}<span className="cents">{netWorthCents}</span>
          </div>
        </div>

        {/* 2-Column Hero Split: Quick Action Tiles & Live Performance Sparkline */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          
          {/* Left: 2x2 Quick Action Grid (Matching Screenshot) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '0.65rem' 
          }}>
            <button 
              className="action-tile-btn"
              onClick={() => onNavigate('expense')}
              title="Log an Expense"
            >
              <ArrowDownRight size={18} color="#f87171" />
              <span>Expense</span>
            </button>

            <button 
              className="action-tile-btn"
              onClick={() => onNavigate('income')}
              title="Add Income Stream"
            >
              <ArrowUpRight size={18} color="#34d399" />
              <span>Income</span>
            </button>

            <button 
              className="action-tile-btn"
              onClick={() => onNavigate('debt')}
              title="Pay or Manage Debt"
            >
              <CreditCard size={18} color="#fbbf24" />
              <span>Pay Debt</span>
            </button>

            <button 
              className="action-tile-btn"
              onClick={() => onNavigate('savings')}
              title="Save for Goals"
            >
              <PiggyBank size={18} color="#60a5fa" />
              <span>Deposit</span>
            </button>
          </div>

          {/* Right: Performance Sparkline Widget (Matching Screenshot) */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.55)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '1rem', 
            padding: '0.875rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                Cash Flow Health
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                color: '#34d399', 
                background: 'rgba(52, 211, 153, 0.15)', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                ▲ +{flow?.planned_savings_rate_pct}%
              </div>
            </div>

            {/* Glowing SVG Sparkline Curve */}
            <div style={{ height: '55px', margin: '0.35rem 0' }}>
              <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,45 Q25,48 50,38 T100,22 T140,28 T170,12 T200,8 L200,60 L0,60 Z"
                  fill="url(#sparklineGrad)"
                />
                <path
                  d="M0,45 Q25,48 50,38 T100,22 T140,28 T170,12 T200,8"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="8" r="3.5" fill="#38bdf8" />
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              <span>Monthly Inflow: +${Number(flow?.normalized_income || 0).toFixed(0)}</span>
              <span>Spend: -${Number(flow?.actual_expense || 0).toFixed(0)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. MOTIVATIONAL QUOTE BANNER */}
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

      {/* 4. ASSETS & SAVINGS GOALS (Matching "Assets" Sheet in Screenshot) */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="#34d399" /> Stored Assets & Savings Goals
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('savings')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          >
            View all →
          </button>
        </div>

        {savingsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No savings goals set up yet. Create your first goal to build wealth!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {savingsList.map((g, idx) => (
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
                      background: idx % 3 === 0 ? 'rgba(59, 130, 246, 0.15)' : idx % 3 === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: idx % 3 === 0 ? 'var(--primary)' : idx % 3 === 1 ? 'var(--success)' : 'var(--warning)'
                    }}
                  >
                    <PiggyBank size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {g.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {g.target_amount ? `Target: $${Number(g.target_amount).toFixed(0)} • ${g.progress_percent}% achieved` : 'Open buffer fund'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--success)' }}>
                    +${Number(g.total_saved).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ${Number(g.monthly_planned_contribution || g.contribution_amount).toFixed(0)}/mo
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. RECENT TRANSACTIONS (Matching "Recent transactions" in Screenshot) */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="#60a5fa" /> Recent Transactions
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('expense')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          >
            View all →
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No recent expenses logged. Click "+ Log Expense" to record a transaction!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentExpenses.map((exp) => (
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
                    -${Number(exp.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {exp.currency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
