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

export function DashboardView({ onNavigate, onOpenForm, onOpenReport, onOpenAccount, currency = 'USD' }) {
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
      const res = await api.getDashboard(forecastDays, currency);
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
  }, [forecastDays, currency]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '1rem', borderRadius: '0.75rem', margin: '1rem 0' }}>{error}</div>;
  }

  const stock = dashboardData?.stock;
  const liquidCash = dashboardData?.liquid_cash;
  const thisMonth = dashboardData?.this_month_flow;
  const flow = dashboardData?.flow;
  const forecast = dashboardData?.forecast;
  const budgets = dashboardData?.budgets_overview;

  const netWorthNum = Number(stock?.net_worth || 0);
  const netWorthInt = Math.floor(Math.abs(netWorthNum)).toLocaleString();
  const netWorthCents = (Math.abs(netWorthNum) % 1).toFixed(2).substring(1);

  const spendableBalanceNum = Number(liquidCash?.current_spendable_balance || 0);

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
          2. CURRENT SPENDABLE BALANCE CARD (LIQUID CASH RIGHT NOW)
          Answers: "How much real spendable money do I actually have right now?"
          ========================================================================= */}
      <div className="glass-card" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '1.15rem',
        padding: '1.25rem 1.35rem',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>💵 Current Spendable Balance</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Real spendable cash available right now (excludes money set aside in savings goals)
            </div>
          </div>

          {onOpenAccount && (
            <button
              onClick={onOpenAccount}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '9999px',
                padding: '0.25rem 0.65rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Set or update your starting bank/wallet cash"
            >
              ⚙️ Opening Balance
            </button>
          )}
        </div>

        <div style={{
          fontSize: '2.1rem',
          fontWeight: 900,
          color: spendableBalanceNum >= 0 ? 'var(--text-primary)' : 'var(--danger)',
          letterSpacing: '-0.02em',
          margin: '0.25rem 0'
        }}>
          {spendableBalanceNum < 0 && '-'}{currSymbol}{Math.abs(spendableBalanceNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Breakdown chips of Starting Balance vs Cumulative Flow */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Opening Baseline:</span> {currSymbol}{Number(liquidCash?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>as of {liquidCash?.opening_date || 'start date'}</div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Net Cash Flow Since Opening:</span>{' '}
            <strong style={{ color: Number(liquidCash?.net_flow_since_opening || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {Number(liquidCash?.net_flow_since_opening || 0) >= 0 ? '+' : ''}{currSymbol}{Number(liquidCash?.net_flow_since_opening || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Income − Spending − Debt Paid − Savings</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. THIS MONTH'S CASH FLOW: SPLIT INTO LINE 1 (EARNED VS SPENT) & LINE 2 (REAL CASH CHANGE)
          ========================================================================= */}
      <div className="glass-card" style={{
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Top Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-primary)' }}>
              <span>📅 This Month at a Glance</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Cash movement in {thisMonth?.month_name || 'this month'} {thisMonth?.year || ''}
            </div>
          </div>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            background: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            {thisMonth?.month_name} {thisMonth?.year}
          </span>
        </div>

        {/* LINE 1: EARNED VS. SPENT (LIFESTYLE COVERAGE) */}
        <div style={{
          background: thisMonth?.is_earned_surplus 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)' 
            : thisMonth?.is_earned_deficit 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.05) 100%)' 
            : 'var(--bg-subtle)',
          padding: '1.15rem 1.25rem',
          borderRadius: '1rem',
          border: thisMonth?.is_earned_surplus 
            ? '1px solid rgba(16, 185, 129, 0.25)' 
            : thisMonth?.is_earned_deficit 
            ? '1px solid rgba(239, 68, 68, 0.25)' 
            : '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: thisMonth?.is_earned_surplus ? 'var(--success-text)' : thisMonth?.is_earned_deficit ? 'var(--danger-text)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {thisMonth?.is_earned_surplus ? <TrendingUp size={14} /> : thisMonth?.is_earned_deficit ? <TrendingDown size={14} /> : <Scale size={14} />}
              <span>Line 1: Earned vs. Spent</span>
            </div>

            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              background: thisMonth?.is_earned_surplus ? 'var(--success-bg)' : thisMonth?.is_earned_deficit ? 'var(--danger-bg)' : 'var(--bg-subtle)',
              color: thisMonth?.is_earned_surplus ? 'var(--success-text)' : thisMonth?.is_earned_deficit ? 'var(--danger-text)' : 'var(--text-secondary)'
            }}>
              {thisMonth?.is_earned_surplus ? '🟢 Surplus' : thisMonth?.is_earned_deficit ? '🔴 Deficit' : '⚪ Balanced'}
            </span>
          </div>

          <div style={{
            fontSize: '1.9rem',
            fontWeight: 900,
            color: thisMonth?.is_earned_surplus ? 'var(--success-text)' : thisMonth?.is_earned_deficit ? 'var(--danger-text)' : 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0.2rem 0'
          }}>
            {thisMonth?.is_earned_surplus ? '+' : thisMonth?.is_earned_deficit ? '-' : ''}{currSymbol}{Number(thisMonth?.abs_earned_vs_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
            💡 Shows whether your income alone covers your spending — not your real cash balance.
          </div>

          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.45rem' }}>
            {thisMonth?.is_earned_surplus ? (
              <span>🎉 <strong>You earned {currSymbol}{Number(thisMonth?.abs_earned_vs_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} more than your lifestyle spending this month!</strong></span>
            ) : thisMonth?.is_earned_deficit ? (
              <span>⚠️ <strong>Lifestyle spending exceeded income by {currSymbol}{Number(thisMonth?.abs_earned_vs_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} this month.</strong></span>
            ) : (
              <span>⚖️ <strong>Income and lifestyle spending are equal this month.</strong></span>
            )}
          </div>
        </div>

        {/* LINE 2: REAL CASH CHANGE THIS MONTH (INCLUDES DEBT REPAYMENT & NEW LOANS) */}
        <div style={{
          background: 'var(--bg-subtle)',
          padding: '1.15rem 1.25rem',
          borderRadius: '1rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Banknote size={14} color="var(--primary)" />
              <span>Line 2: Real Cash Change This Month</span>
            </div>

            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              background: thisMonth?.is_cash_positive ? 'var(--success-bg)' : thisMonth?.is_cash_negative ? 'var(--danger-bg)' : 'var(--bg-card)',
              color: thisMonth?.is_cash_positive ? 'var(--success-text)' : thisMonth?.is_cash_negative ? 'var(--danger-text)' : 'var(--text-secondary)'
            }}>
              {thisMonth?.is_cash_positive ? '🟢 Net Cash Inflow' : thisMonth?.is_cash_negative ? '🔴 Net Cash Outflow' : '⚪ Net Zero Change'}
            </span>
          </div>

          <div style={{
            fontSize: '1.9rem',
            fontWeight: 900,
            color: thisMonth?.is_cash_positive ? 'var(--success-text)' : thisMonth?.is_cash_negative ? 'var(--danger-text)' : 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0.2rem 0'
          }}>
            {thisMonth?.is_cash_positive ? '+' : thisMonth?.is_cash_negative ? '-' : ''}{currSymbol}{Number(thisMonth?.abs_real_cash_change || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
            💡 Net change in spendable cash this month, including money spent on debt payoff or added from new loans.
          </div>

          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.45rem' }}>
            {Number(thisMonth?.debt_payments || 0) > 0 ? (
              <span>
                🏦 Includes <strong>{currSymbol}{Number(thisMonth?.debt_payments || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> used to pay down debts this month.
              </span>
            ) : (
              <span>No debt payments recorded this month.</span>
            )}
          </div>
        </div>

        {/* 4 Side-by-side Flow Breakdown Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Banknote size={13} color="var(--success)" /> Earned
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)', marginTop: '0.15rem' }}>
              +{currSymbol}{Number(thisMonth?.actual_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Inflows received</div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Receipt size={13} color="var(--danger)" /> Spent
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--danger)', marginTop: '0.15rem' }}>
              -{currSymbol}{Number(thisMonth?.actual_expense || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{thisMonth?.month_expenses_count || 0} expenses</div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CreditCard size={13} color="#fbbf24" /> Debt Paid
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fbbf24', marginTop: '0.15rem' }}>
              -{currSymbol}{Number(thisMonth?.debt_payments || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Principal & debt payoff</div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <PiggyBank size={13} color="#60a5fa" /> Saved to Goals
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#60a5fa', marginTop: '0.15rem' }}>
              +{currSymbol}{Number(thisMonth?.savings_deposited || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Stored in savings</div>
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
                Steady recurring baseline commitments
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recurring Baseline</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)', marginTop: '0.2rem' }}>
                +{currSymbol}{Number(flow?.normalized_income || 0).toFixed(2)}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>/mo</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.875rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Planned Savings</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                +{currSymbol}{Number(flow?.planned_savings || 0).toFixed(2)}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>/mo</span>
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

export default DashboardView;
