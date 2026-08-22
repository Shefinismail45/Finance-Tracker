import React, { useState } from 'react';
import { 
  PieChart, 
  HelpCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  CheckCircle2, 
  Shield, 
  Home, 
  ShoppingBag, 
  PiggyBank, 
  Target, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  Smile, 
  Info 
} from 'lucide-react';
import { getCurrencySymbol } from '../currencies';

export const BUDGET_FRAMEWORKS = [
  {
    id: '50-30-20',
    name: '50 / 30 / 20 Rule',
    tagline: 'The Classic Golden Standard',
    description: 'A balanced, time-tested approach that divides income into Needs, Wants, and Savings & Debt.',
    badge: 'Popular & Balanced',
    badgeColor: '#6366f1',
    splits: [
      { 
        label: 'Needs & Essentials', 
        percent: 50, 
        color: '#3b82f6', 
        bg: 'rgba(59, 130, 246, 0.12)',
        categories: ['Rent / Mortgage', 'Groceries', 'Utilities', 'Healthcare', 'Insurance', 'Transport'] 
      },
      { 
        label: 'Wants & Lifestyle', 
        percent: 30, 
        color: '#a855f7', 
        bg: 'rgba(168, 85, 247, 0.12)',
        categories: ['Dining Out', 'Entertainment', 'Hobbies', 'Travel', 'Shopping', 'Subscriptions'] 
      },
      { 
        label: 'Savings & Debt Payoff', 
        percent: 20, 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.12)',
        categories: ['Emergency Fund', 'Retirement (401k/IRA)', 'Extra Debt Principal', 'Investments'] 
      }
    ],
    tips: 'Ideal for most individuals looking for a sustainable balance between enjoying life today and building long-term financial security.'
  },
  {
    id: '70-20-10',
    name: '70 / 20 / 10 Rule',
    tagline: 'High Cost-of-Living & Debt Focus',
    description: 'Accommodates higher unavoidable living costs while keeping steady automated savings and debt reduction.',
    badge: 'Practical Living',
    badgeColor: '#f59e0b',
    splits: [
      { 
        label: 'Living Expenses & Bills', 
        percent: 70, 
        color: '#f59e0b', 
        bg: 'rgba(245, 158, 11, 0.12)',
        categories: ['Housing & Rent', 'Groceries & Dining', 'Transportation', 'Bills & Utilities', 'Personal Care'] 
      },
      { 
        label: 'Savings & Investments', 
        percent: 20, 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.12)',
        categories: ['Emergency Buffer', 'Stock Index Funds', 'House Down Payment'] 
      },
      { 
        label: 'Debt Payoff / Giving', 
        percent: 10, 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.12)',
        categories: ['Credit Card Payoff', 'Student Loans', 'Community Support / Charity'] 
      }
    ],
    tips: 'Recommended if you live in a high cost-of-living metro area where rent and essentials consume a larger share of income.'
  },
  {
    id: '80-20',
    name: '80 / 20 Rule (Pay Yourself First)',
    tagline: 'The Minimalist Budget',
    description: 'Save 20% automatically right when you get paid. Spend the remaining 80% with complete peace of mind.',
    badge: 'Simple & Low Maintenance',
    badgeColor: '#10b981',
    splits: [
      { 
        label: 'Living & Discretionary Spend', 
        percent: 80, 
        color: '#6366f1', 
        bg: 'rgba(99, 102, 241, 0.12)',
        categories: ['All Needs, Bills, Food, Dining, Hobbies, and Lifestyle expenses combined'] 
      },
      { 
        label: 'Pay Yourself First (Savings)', 
        percent: 20, 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.12)',
        categories: ['Automated Savings Transfer', 'Retirement Accounts', 'Investments'] 
      }
    ],
    tips: 'Automate a 20% transfer to your savings on payday, and spend the rest freely without micro-tracking every receipt.'
  },
  {
    id: '60-20-20',
    name: '60 / 20 / 20 Growth Model',
    tagline: 'Fast Wealth & FIRE Accelerator',
    description: 'Keeps fixed costs lean at 60% so you can invest aggressively for early financial independence.',
    badge: 'Wealth Acceleration',
    badgeColor: '#ec4899',
    splits: [
      { 
        label: 'Lean Fixed Costs', 
        percent: 60, 
        color: '#0ea5e9', 
        bg: 'rgba(14, 165, 233, 0.12)',
        categories: ['Housing', 'Basic Groceries', 'Essential Transport', 'Health'] 
      },
      { 
        label: 'Aggressive Wealth Building', 
        percent: 20, 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.12)',
        categories: ['Index Funds', 'Roth IRA Max-out', 'High-Yield Assets', 'Real Estate'] 
      },
      { 
        label: 'Guilt-Free Fun', 
        percent: 20, 
        color: '#ec4899', 
        bg: 'rgba(236, 72, 153, 0.12)',
        categories: ['Vacations', 'Dining Experiences', 'Gadgets & Personal Fun'] 
      }
    ],
    tips: 'Tailor-made for ambitious savers and early-retirement enthusiasts looking to maximize compound interest.'
  },
  {
    id: 'zero-based',
    name: 'Zero-Based Budget (ZBB)',
    tagline: 'Give Every Dollar a Job',
    description: 'Every single dollar is assigned a specific job before the month starts: Income - (Expenses + Savings + Debt) = $0.',
    badge: 'Maximum Discipline',
    badgeColor: '#8b5cf6',
    splits: [
      { 
        label: 'Core Essentials', 
        percent: 45, 
        color: '#3b82f6', 
        bg: 'rgba(59, 130, 246, 0.12)',
        categories: ['Rent/Mortgage', 'Utilities', 'Basic Groceries', 'Transit'] 
      },
      { 
        label: 'Lifestyle & Discretionary', 
        percent: 25, 
        color: '#a855f7', 
        bg: 'rgba(168, 85, 247, 0.12)',
        categories: ['Entertainment', 'Dining', 'Shopping', 'Gifts'] 
      },
      { 
        label: 'Sinking Funds & Savings', 
        percent: 20, 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.12)',
        categories: ['Emergency Buffer', 'Car Maintenance Fund', 'Vacation Sinking Fund'] 
      },
      { 
        label: 'Debt & Goals', 
        percent: 10, 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.12)',
        categories: ['Principal Paydown', 'Goal Milestone Funding'] 
      }
    ],
    tips: 'Leaves zero unassigned dollars to prevent money from mysteriously slipping away unnoticed.'
  }
];

export function BudgetSplitAdvisor({ currency = 'USD', defaultBaseAmount = 3000 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState('50-30-20');
  const [baseIncome, setBaseIncome] = useState(String(defaultBaseAmount));

  const currSymbol = getCurrencySymbol(currency);
  const activeFramework = BUDGET_FRAMEWORKS.find(f => f.id === selectedFrameworkId) || BUDGET_FRAMEWORKS[0];
  const numBase = parseFloat(baseIncome) || 0;

  const handlePresetClick = (amount) => {
    setBaseIncome(String(amount));
  };

  return (
    <div className="glass-card" style={{ padding: '1.25rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      {/* Header Banner */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ 
            width: '2.4rem', 
            height: '2.4rem', 
            borderRadius: '0.65rem', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)', 
            color: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <PieChart size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>Budget Split Frameworks & Strategy Guide</span>
              <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                e.g. 50/30/20, 70/20/10
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Explore proven budgeting rules and see how your monthly income splits into Needs, Wants & Savings
            </div>
          </div>
        </div>

        <button 
          className="btn-icon" 
          style={{ width: '2rem', height: '2rem' }}
          title={isOpen ? 'Collapse Guide' : 'Expand Guide'}
        >
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded Interactive Split Advisor */}
      {isOpen && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.2s ease-out' }}>
          
          {/* Framework Selection Tabs */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Select a Budgeting Model:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {BUDGET_FRAMEWORKS.map(f => {
                const isSelected = f.id === selectedFrameworkId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFrameworkId(f.id)}
                    style={{
                      padding: '0.5rem 0.85rem',
                      borderRadius: '0.625rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${f.badgeColor}` : '1px solid var(--border-color)',
                      background: isSelected ? `${f.badgeColor}18` : 'var(--bg-subtle)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{f.name}</span>
                    {isSelected && <CheckCircle2 size={13} color={f.badgeColor} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Framework Overview Card */}
          <div style={{ background: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderRadius: '0.875rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeFramework.name} — <span style={{ color: activeFramework.badgeColor, fontWeight: 700 }}>{activeFramework.tagline}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '650px', lineHeight: 1.45 }}>
                  {activeFramework.description}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '9999px', background: `${activeFramework.badgeColor}22`, color: activeFramework.badgeColor, border: `1px solid ${activeFramework.badgeColor}44` }}>
                {activeFramework.badge}
              </span>
            </div>

            {/* Income Calculator Input */}
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Monthly Income / Budget Base:</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '0.65rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>{currSymbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={baseIncome}
                    onChange={(e) => setBaseIncome(e.target.value)}
                    style={{
                      padding: '0.35rem 0.65rem 0.35rem 1.45rem',
                      width: '120px',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presets:</span>
                {[2000, 3000, 5000, 8000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetClick(amt)}
                    style={{
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '0.35rem',
                      border: '1px solid var(--border-color)',
                      background: Number(baseIncome) === amt ? 'var(--primary)' : 'var(--bg-card)',
                      color: Number(baseIncome) === amt ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {currSymbol}{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-segment Visual Allocation Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>Target Split Distribution (100%)</span>
              <span>{activeFramework.splits.map(s => `${s.percent}%`).join(' • ')}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              width: '100%', 
              height: '14px', 
              borderRadius: '9999px', 
              overflow: 'hidden', 
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)' 
            }}>
              {activeFramework.splits.map((split, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    width: `${split.percent}%`, 
                    backgroundColor: split.color,
                    transition: 'width 0.3s ease'
                  }}
                  title={`${split.label}: ${split.percent}% (${currSymbol}${((numBase * split.percent) / 100).toFixed(2)})`}
                />
              ))}
            </div>
          </div>

          {/* Allocation Bucket Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, gap: '0.875rem' }}>
            {activeFramework.splits.map((split, idx) => {
              const allocatedAmount = (numBase * split.percent) / 100;
              return (
                <div 
                  key={idx} 
                  style={{ 
                    background: 'var(--bg-card)', 
                    borderRadius: '0.875rem', 
                    padding: '1rem', 
                    border: `1px solid ${split.color}44`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{split.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: split.color, background: `${split.color}18`, padding: '0.15rem 0.45rem', borderRadius: '0.35rem' }}>
                        {split.percent}%
                      </span>
                    </div>

                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: split.color, letterSpacing: '-0.02em' }}>
                      {currSymbol}{allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Monthly recommended allowance
                    </div>
                  </div>

                  {/* Recommended Categories Tag List */}
                  <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Common Categories:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {split.categories.map((cat, cIdx) => (
                        <span 
                          key={cIdx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '0.3rem',
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pro Strategy Advice Box */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: 'rgba(99, 102, 241, 0.08)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Sparkles size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              <strong>Rule Strategy:</strong> {activeFramework.tips}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
