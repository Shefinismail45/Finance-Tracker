import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Shield, 
  CreditCard, 
  PieChart, 
  Receipt, 
  Banknote, 
  PiggyBank, 
  Sparkles,
  FileImage,
  Quote,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Scale
} from 'lucide-react';
import { api } from '../api';
import { getCurrencySymbol } from '../currencies';
import { getRandomQuote } from '../quotes';
import { DashboardSkeleton } from './Skeleton';

export function DashboardView({ onNavigate, onOpenForm, onOpenReport, currency = 'USD' }) {
  const [forecastDays, setForecastDays] = useState(30);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote] = useState(() => getRandomQuote());

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

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '1rem', borderRadius: '0.75rem', margin: '1rem 0' }}>{error}</div>;
  }

  const stock = dashboardData?.stock;
  const thisMonth = dashboardData?.this_month_flow;
  const flow = dashboardData?.flow;
  const forecast = dashboardData?.forecast;
  const budgets = dashboardData?.budgets_overview;

  const netWorthNum = Number(stock?.net_worth || 0);
  const netWorthInt = Math.floor(Math.abs(netWorthNum)).toLocaleString();
  const netWorthCents = (Math.abs(netWorthNum) % 1).toFixed(2).substring(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. NET WORTH HERO BALANCE CARD */}
      <div className="hero-balance-card">
        <div className="hero-label">
          <span>Net Worth • {currency}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  color: 'white',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Download full summary report as high-res JPG"
              >
                <FileImage size={13} /> Visual Report (JPG)
              </button>
            )}
            <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', color: '#ffffff' }}>
              All-Time Position
            </span>
          </div>
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
            <Receipt size={18} color="#f87171" />
            <span>Expense</span>
          </button>

          <button 
            className="action-tile-btn"
            onClick={() => onNavigate('income')}
            title="Add Income Stream"
          >
            <Banknote size={18} color="#34d399" />
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

      {/* =========================================================================
          2. THIS MONTH'S CASH FLOW: "DID I EARN MORE THAN I SPENT THIS MONTH?"
          Plain, conversational, and instantly understandable
          ========================================================================= */}
      <div className="glass-card" style={{
        position: 'relative',
        overflow: 'hidden',
        border: thisMonth?.is_surplus 
          ? '1px solid rgba(16, 185, 129, 0.35)' 
          : thisMonth?.is_deficit 
          ? '1px solid rgba(239, 68, 68, 0.35)' 
          : '1px solid var(--border-color)',
        background: 'var(--bg-card)'
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-primary)' }}>
              <span>📅 This Month at a Glance</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Real cash earned vs real cash spent in {thisMonth?.month_name || 'this month'} {thisMonth?.year || ''}
            </div>
          </div>

          <div style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            background: thisMonth?.is_surplus ? 'var(--success-bg)' : thisMonth?.is_deficit ? 'var(--danger-bg)' : 'var(--bg-subtle)',
            color: thisMonth?.is_surplus ? 'var(--success-text)' : thisMonth?.is_deficit ? 'var(--danger-text)' : 'var(--text-secondary)',
            border: thisMonth?.is_surplus ? '1px solid rgba(16, 185, 129, 0.25)' : thisMonth?.is_deficit ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <span>{thisMonth?.is_surplus ? '🟢' : thisMonth?.is_deficit ? '🔴' : '⚪'}</span>
            <span>{thisMonth?.is_surplus ? 'Surplus' : thisMonth?.is_deficit ? 'Deficit' : 'Balanced'}</span>
          </div>
        </div>

        {/* Highlight Banner with Plain Language */}
        <div style={{
          background: thisMonth?.is_surplus 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(5, 150, 105, 0.06) 100%)' 
            : thisMonth?.is_deficit 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(220, 38, 38, 0.06) 100%)' 
            : 'var(--bg-subtle)',
          padding: '1.15rem 1.25rem',
          borderRadius: '1rem',
          border: thisMonth?.is_surplus 
            ? '1px solid rgba(16, 185, 129, 0.25)' 
            : thisMonth?.is_deficit 
            ? '1px solid rgba(239, 68, 68, 0.25)' 
            : '1px solid var(--border-color)',
          marginBottom: '1.15rem'
        }}>
          <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: thisMonth?.is_surplus ? 'var(--success-text)' : thisMonth?.is_deficit ? 'var(--danger-text)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {thisMonth?.is_surplus ? <TrendingUp size={14} /> : thisMonth?.is_deficit ? <TrendingDown size={14} /> : <Scale size={14} />}
            {thisMonth?.is_surplus ? 'Monthly Cash Surplus' : thisMonth?.is_deficit ? 'Monthly Cash Deficit' : 'Balanced Flow'}
          </div>

          <div style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: thisMonth?.is_surplus ? 'var(--success-text)' : thisMonth?.is_deficit ? 'var(--danger-text)' : 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0.35rem 0'
          }}>
            {thisMonth?.is_surplus ? '+' : thisMonth?.is_deficit ? '-' : ''}{currSymbol}{Number(thisMonth?.abs_difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Plain, warm conversational message */}
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45 }}>
            {thisMonth?.is_surplus ? (
              <span>🎉 <strong>You saved {currSymbol}{Number(thisMonth?.abs_difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} this month!</strong> You earned more than you spent.</span>
            ) : thisMonth?.is_deficit ? (
              <span>⚠️ <strong>You spent {currSymbol}{Number(thisMonth?.abs_difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} more than you earned this month.</strong></span>
            ) : (
              <span>⚖️ <strong>You broke even this month.</strong> Your income and spending are currently equal.</span>
            )}
          </div>
        </div>

        {/* Side-by-side Actual Inflow vs Actual Spending Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.9rem 1rem', borderRadius: '0.85rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Banknote size={14} color="var(--success)" /> Earned This Month
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--success)', marginTop: '0.25rem' }}>
              +{currSymbol}{Number(thisMonth?.actual_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Real inflows received in {thisMonth?.month_name}
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.9rem 1rem', borderRadius: '0.85rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Receipt size={14} color="var(--danger)" /> Spent This Month
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
              -{currSymbol}{Number(thisMonth?.actual_expense || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {thisMonth?.month_expenses_count || 0} expenses recorded
            </div>
          </div>
        </div>
      </div>

      {/* MOTIVATIONAL QUOTE BANNER */}
      {quote && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          padding: '0.9rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{
            width: '2.2rem',
            height: '2.2rem',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Quote size={15} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.86rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              "{quote.quote}"
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontWeight: 600 }}>
              — {quote.author} <span style={{ opacity: 0.6 }}>• {quote.tag}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. DESKTOP GRID: MONTHLY CADENCE & CASH FORECAST */}
      <div className="grid-2-col">
        
        {/* Normalized Recurring Cadence */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--primary)" /> Normalized Monthly Cadence
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Smoothed recurring baseline vs actuals
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
              Savings Target Rate: {flow?.planned_savings_rate_pct}%
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Planned Savings</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                +{currSymbol}{Number(flow?.planned_savings || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.875rem', padding: '0.875rem 1rem', background: flow?.net_monthly_flow >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: flow?.net_monthly_flow >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
              Normalized Baseline Flow
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
