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
  Quote
} from 'lucide-react';
import { api } from '../api';
import { getRandomQuote } from '../quotes';
import { getCurrencySymbol } from '../currencies';

export function DashboardView({ onNavigate, onOpenForm, currency = 'USD' }) {
  const [forecastDays, setForecastDays] = useState(30);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(getRandomQuote());

  const currSymbol = getCurrencySymbol(currency);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard(forecastDays);
      setDashboardData(res);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. HERO BALANCE CARD (Original Layout with Reference Cobalt / Glow Palette) */}
      <div className="hero-balance-card">
        <div className="hero-label">
          <span>Executive Net Worth • {currency}</span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', color: '#ffffff' }}>
            Live Stock Metric
          </span>
        </div>

        <div className="hero-amount">
          {netWorthNum < 0 && '-'}{currSymbol}{netWorthInt}<span className="cents">{netWorthCents}</span>
        </div>

        {/* Savings vs Debt Breakdown in Hero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={14} color="#34d399" /> Total Savings Stored
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
              +{currSymbol}{Number(stock?.total_savings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CreditCard size={14} color="#fca5a5" /> Total Remaining Debt
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fca5a5', marginTop: '0.2rem' }}>
              -{currSymbol}{Number(stock?.total_debt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Hero Quick Action Tiles */}
        <div className="hero-actions-grid">
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
      </div>

      {/* 2. MOTIVATIONAL QUOTE BANNER */}
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

      {/* 3. DESKTOP GRID: MONTHLY FLOW & CASH FORECAST */}
      <div className="grid-2-col">
        
        {/* Monthly Inflow / Outflow Summary */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--primary)" /> Monthly Flow Overview
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Normalized recurring cadence vs actuals
              </div>
            </div>

            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: 'var(--success)', 
              background: 'var(--success-bg)', 
              padding: '0.25rem 0.6rem', 
              borderRadius: '9999px' 
            }}>
              Savings Rate: {flow?.planned_savings_rate_pct}%
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.875rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Normalized Income</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)', marginTop: '0.2rem' }}>
                +{currSymbol}{Number(flow?.normalized_income || 0).toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.875rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Actual Monthly Spend</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--danger)', marginTop: '0.2rem' }}>
                -{currSymbol}{Number(flow?.actual_expense || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.875rem', padding: '0.875rem 1rem', background: flow?.net_monthly_flow >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: flow?.net_monthly_flow >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
              Net Monthly Cash Surplus
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: flow?.net_monthly_flow >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
              {flow?.net_monthly_flow >= 0 ? '+' : ''}{currSymbol}{Number(flow?.net_monthly_flow || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Short-Term Cash Flow Forecast (30 / 90 Days) */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--primary)" /> Cash Flow Forecast
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Projected from active recurring streams
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.625rem' }}>
              <button
                onClick={() => setForecastDays(30)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  border: 'none',
                  borderRadius: '0.4rem',
                  cursor: 'pointer',
                  background: forecastDays === 30 ? 'var(--primary-gradient)' : 'transparent',
                  color: forecastDays === 30 ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700
                }}
              >
                30D
              </button>
              <button
                onClick={() => setForecastDays(90)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  border: 'none',
                  borderRadius: '0.4rem',
                  cursor: 'pointer',
                  background: forecastDays === 90 ? 'var(--primary-gradient)' : 'transparent',
                  color: forecastDays === 90 ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700
                }}
              >
                90D
              </button>
            </div>
          </div>

          <div className="grid-3-col" style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--success-bg)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--success-text)', fontWeight: 700 }}>Projected Inflows</div>
              <div style={{ fontWeight: 800, color: 'var(--success-text)', fontSize: '1.05rem', marginTop: '0.2rem' }}>
                +{currSymbol}{Number(forecast?.projected_inflows || 0).toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'var(--danger-bg)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--danger-text)', fontWeight: 700 }}>Projected Outflows</div>
              <div style={{ fontWeight: 800, color: 'var(--danger-text)', fontSize: '1.05rem', marginTop: '0.2rem' }}>
                -{currSymbol}{Number(forecast?.projected_outflows || 0).toFixed(2)}
              </div>
            </div>

            <div style={{ background: forecast?.projected_net_cash_flow >= 0 ? 'rgba(59, 130, 246, 0.15)' : 'var(--danger-bg)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>Projected Net</div>
              <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem', marginTop: '0.2rem' }}>
                {forecast?.projected_net_cash_flow >= 0 ? '+' : ''}{currSymbol}{Number(forecast?.projected_net_cash_flow || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BUDGET ADHERENCE OVERVIEW */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} color="#f59e0b" /> Budget Adherence Snapshot
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('budget')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          >
            Manage Budgets →
          </button>
        </div>

        {budgets?.total_budgets === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No category budgets set up yet. Set monthly limits to avoid overspending!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {budgets?.budgets.map((b) => (
              <div 
                key={b.budget_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: b.is_over_budget ? 'var(--danger-bg)' : 'var(--bg-subtle)',
                  borderRadius: '0.75rem',
                  border: b.is_over_budget ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{b.category_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {currSymbol}{Number(b.actual_amount).toFixed(2)} of {currSymbol}{Number(b.planned_amount).toFixed(2)} limit
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: b.is_over_budget ? 'var(--danger)' : 'var(--success)' }}>
                    {b.usage_percent}%
                  </div>
                  {b.is_over_budget && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>
                      +{currSymbol}{Number(b.overage).toFixed(2)} over
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
