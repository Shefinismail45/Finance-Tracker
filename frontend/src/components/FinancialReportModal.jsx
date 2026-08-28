import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  PieChart, 
  CreditCard, 
  PiggyBank, 
  Receipt, 
  Banknote,
  CheckCircle2,
  FileImage,
  Share2
} from 'lucide-react';
import { getCurrencySymbol } from '../currencies';
import { api, parseLocalDate } from '../api';

export function FinancialReportModal({ user, currency = 'USD', onClose }) {
  const [period, setPeriod] = useState('this_month'); // 'this_month' | 'last_3_months' | 'this_year' | 'all_time'
  const [loading, setLoading] = useState(true);
  const [generatingJpg, setGeneratingJpg] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const reportCardRef = useRef(null);
  const currSymbol = getCurrencySymbol(currency);

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  // Fetch report metrics according to chosen period
  useEffect(() => {
    let isMounted = true;
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardRes, expensesRes, incomesRes, debtsRes, savingsRes] = await Promise.all([
          api.getDashboard(period === 'last_3_months' ? 90 : period === 'this_year' ? 365 : 30, currency).catch(() => null),
          api.getExpenses({}, currency).catch(() => []),
          api.getIncome({}, currency).catch(() => []),
          api.getDebts({}, currency).catch(() => []),
          api.getSavingsGoals({}, currency).catch(() => [])
        ]);

        if (!isMounted) return;

        // Filter by period dates
        const now = new Date();
        let startDateFilter = null;
        let periodMonthsCount = 1;
        if (period === 'this_month') {
          startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
          periodMonthsCount = 1;
        } else if (period === 'last_3_months') {
          startDateFilter = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          periodMonthsCount = 3;
        } else if (period === 'this_year') {
          startDateFilter = new Date(now.getFullYear(), 0, 1);
          periodMonthsCount = now.getMonth() + 1;
        } else {
          startDateFilter = null;
          periodMonthsCount = null;
        }

        const filteredExpenses = startDateFilter 
          ? expensesRes.filter(e => {
              const d = parseLocalDate(e.occurred_at || e.created_at);
              return d && d >= startDateFilter;
            })
          : expensesRes;

        const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.converted_amount || e.amount || 0), 0);

        // Group top expense categories
        const catMap = {};
        filteredExpenses.forEach(e => {
          const name = e.category_name || 'General Expense';
          const amt = Number(e.converted_amount || e.amount || 0);
          catMap[name] = (catMap[name] || 0) + amt;
        });

        const allSortedCats = Object.entries(catMap)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount);

        const topCategories = allSortedCats.slice(0, 4);
        const otherCategories = allSortedCats.slice(4);
        const otherCategoriesCount = otherCategories.length;
        const otherCategoriesTotal = otherCategories.reduce((sum, c) => sum + c.amount, 0);

        // Calculate Total Income Received (all one-time + active recurring within timeframe)
        let totalIncomeReceived = 0;
        let incomeCount = 0;
        const recurringMonthlyBaseline = incomesRes
          .filter(i => i.is_active !== false && Number(i.period_months) > 0)
          .reduce((sum, i) => sum + Number(i.monthly_equivalent || (Number(i.converted_amount || i.amount || 0) / (Number(i.period_months) || 1))), 0);

        if (period === 'all_time') {
          incomesRes.forEach(i => {
            const amt = Number(i.converted_amount || i.amount || 0);
            totalIncomeReceived += amt;
            incomeCount += 1;
          });
        } else {
          incomesRes.forEach(i => {
            const amt = Number(i.converted_amount || i.amount || 0);
            const isOneTime = Number(i.period_months) === 0;
            const d = parseLocalDate(i.start_date || i.created_at);

            if (isOneTime) {
              if (!startDateFilter || (d && d >= startDateFilter)) {
                totalIncomeReceived += amt;
                incomeCount += 1;
              }
            } else {
              if (i.is_active !== false) {
                const startDate = parseLocalDate(i.start_date || i.created_at);
                const endDate = i.end_date ? parseLocalDate(i.end_date) : null;
                if (!startDateFilter || (startDate && startDate <= now && (!endDate || endDate >= startDateFilter))) {
                  const monthlyPortion = Number(i.monthly_equivalent || (amt / (Number(i.period_months) || 1)));
                  totalIncomeReceived += (monthlyPortion * periodMonthsCount);
                  incomeCount += 1;
                }
              } else if (!startDateFilter || (d && d >= startDateFilter)) {
                totalIncomeReceived += amt;
                incomeCount += 1;
              }
            }
          });
        }
        totalIncomeReceived = Math.round(totalIncomeReceived * 100) / 100;

        // Compute debts
        const totalDebtRemaining = debtsRes.reduce((sum, d) => sum + Number(d.remaining_balance ?? d.principal_amount ?? 0), 0);
        const totalDebtPaid = debtsRes.reduce((sum, d) => sum + Number(d.total_paid || 0), 0);

        // Compute savings
        const totalSaved = savingsRes.reduce((sum, s) => sum + Number(s.total_saved || s.contribution_amount || 0), 0);
        const totalSavingsTarget = savingsRes.reduce((sum, s) => sum + Number(s.target_amount || 0), 0);

        const netWorth = totalSaved - totalDebtRemaining;

        setReportData({
          netWorth,
          totalIncomeReceived,
          recurringMonthlyBaseline,
          incomeCount,
          totalExpenseAmount,
          totalSaved,
          totalSavingsTarget,
          totalDebtRemaining,
          totalDebtPaid,
          topCategories,
          otherCategoriesCount,
          otherCategoriesTotal,
          expenseCount: filteredExpenses.length,
          activeGoalsCount: savingsRes.filter(s => s.is_active !== false).length,
          activeDebtsCount: debtsRes.filter(d => !d.is_paid_off).length,
          savingsRate: dashboardRes?.flow?.planned_savings_rate_pct || 
            (totalIncomeReceived > 0 ? Math.min(100, Math.round((totalSaved / (totalIncomeReceived || 1)) * 100)) : 0)
        });
      } catch (err) {
        console.error('Report generation error:', err);
        if (isMounted) setError('Failed to aggregate report metrics.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReportData();
    return () => { isMounted = false; };
  }, [period, currency]);

  // Capture rendered component as fixed 1080 x 1920 (9:16) high-resolution JPG image
  const handleDownloadJpg = async () => {
    if (!reportCardRef.current || generatingJpg) return;

    try {
      setGeneratingJpg(true);
      setError(null);

      // Dynamically import html2canvas only when downloading
      const html2canvas = (await import('html2canvas')).default;

      // Render canvas at 2x scale on 540x960 layout -> produces exactly 1080 x 1920 pixels
      const canvas = await html2canvas(reportCardRef.current, {
        scale: 2,
        width: 540,
        height: 960,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0b1329', // Deep slate background matching the card
        logging: false,
        onclone: (clonedDoc) => {
          const card = clonedDoc.getElementById('financial-report-canvas-card');
          if (card) {
            card.style.width = '540px';
            card.style.height = '960px';
            card.style.minWidth = '540px';
            card.style.maxWidth = '540px';
            card.style.minHeight = '960px';
            card.style.maxHeight = '960px';
            card.style.boxSizing = 'border-box';
            card.style.margin = '0';
          }
        }
      });

      // Output as JPG specifically (smaller file size, perfect for WhatsApp Status / Instagram Stories)
      const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Financial_Report_9x16_${period}_${dateStr}.jpg`;

      const downloadLink = document.createElement('a');
      downloadLink.href = jpgUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch (err) {
      console.error('Failed to generate JPG report:', err);
      setError('Could not generate JPG image. Please try again.');
    } finally {
      setGeneratingJpg(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'this_month': return 'This Month';
      case 'last_3_months': return 'Last 3 Months';
      case 'this_year': return 'Year-to-Date (YTD)';
      case 'all_time': return 'All-Time Lifetime';
      default: return 'Financial Summary';
    }
  };

  const netCashFlow = (Number(reportData?.totalIncomeReceived || 0) - Number(reportData?.totalExpenseAmount || 0));

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '95%', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FileImage size={20} color="var(--primary)" />
              <span>9:16 Visual Financial Report</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Standard 1080 × 1920 Story format (WhatsApp, Instagram, Telegram)
            </div>
          </div>

          <button 
            type="button"
            className="icon-btn" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="filter-chips-bar" style={{ marginBottom: '1.15rem' }}>
          <button 
            className={`filter-chip ${period === 'this_month' ? 'active' : ''}`}
            onClick={() => setPeriod('this_month')}
          >
            This Month
          </button>
          <button 
            className={`filter-chip ${period === 'last_3_months' ? 'active' : ''}`}
            onClick={() => setPeriod('last_3_months')}
          >
            Last 3 Months
          </button>
          <button 
            className={`filter-chip ${period === 'this_year' ? 'active' : ''}`}
            onClick={() => setPeriod('this_year')}
          >
            This Year (YTD)
          </button>
          <button 
            className={`filter-chip ${period === 'all_time' ? 'active' : ''}`}
            onClick={() => setPeriod('all_time')}
          >
            All-Time
          </button>
        </div>

        {error && (
          <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '1.15rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* RENDERED VISUAL REPORT CARD: EXACT 540 × 960 (9:16) LAYOUT */}
        <div 
          ref={reportCardRef}
          id="financial-report-canvas-card"
          style={{
            background: 'linear-gradient(155deg, #070d1e 0%, #0e172e 45%, #18233f 100%)',
            color: '#f8fafc',
            borderRadius: '1.25rem',
            padding: '1.4rem 1.4rem',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 16px 42px rgba(0, 0, 0, 0.55)',
            marginBottom: '1.25rem',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            width: '100%',
            maxWidth: '540px',
            height: '960px',
            boxSizing: 'border-box',
            margin: '0 auto 1.25rem auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden'
          }}
        >
          {/* Section 1: Report Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '1.65rem', height: '1.65rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={12} color="white" />
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>FinanceTracker</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Summary Report • <strong style={{ color: '#e2e8f0' }}>{userName}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                display: 'inline-block'
              }}>
                {getPeriodLabel()}
              </span>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.25rem' }}>
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Section 2: Hero Net Worth Card */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
            padding: '1.1rem 1.25rem',
            borderRadius: '0.95rem',
            border: '1px solid rgba(96, 165, 250, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700 }}>
              Estimated Net Worth ({currency})
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', margin: '0.25rem 0' }}>
              {reportData?.netWorth < 0 ? '-' : ''}{currSymbol}{Math.abs(Number(reportData?.netWorth || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
              ✨ Total Stored Assets − Total Remaining Debts
            </div>
          </div>

          {/* Section 3: 4 Key Pillar Stat Tiles (2x2 Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            
            {/* Income Tile */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 0.85rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Banknote size={12} color="#34d399" /> Total Income Received
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '0.15rem' }}>
                +{currSymbol}{Number(reportData?.totalIncomeReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {reportData?.incomeCount || 0} entries {Number(reportData?.recurringMonthlyBaseline || 0) > 0 ? `• ${currSymbol}${Number(reportData.recurringMonthlyBaseline).toFixed(0)}/mo base` : ''}
              </div>
            </div>

            {/* Expenses Tile */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 0.85rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Receipt size={12} color="#f87171" /> Total Spending
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171', marginTop: '0.15rem' }}>
                -{currSymbol}{Number(reportData?.totalExpenseAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem' }}>
                {reportData?.expenseCount || 0} recorded expenses
              </div>
            </div>

            {/* Savings Tile */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 0.85rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <PiggyBank size={12} color="#60a5fa" /> Total Saved
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.15rem' }}>
                +{currSymbol}{Number(reportData?.totalSaved || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem' }}>
                {reportData?.activeGoalsCount || 0} active savings goals
              </div>
            </div>

            {/* Debt Tile */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 0.85rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CreditCard size={12} color="#fbbf24" /> Remaining Debt
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.15rem' }}>
                -{currSymbol}{Number(reportData?.totalDebtRemaining || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem' }}>
                +{currSymbol}{Number(reportData?.totalDebtPaid || 0).toFixed(0)} paid off
              </div>
            </div>
          </div>

          {/* Section 4: Period Health & Net Cash Flow Strip */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.035)',
            padding: '0.65rem 0.95rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Period Cash Surplus / Deficit
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: netCashFlow >= 0 ? '#34d399' : '#f87171', marginTop: '0.1rem' }}>
                {netCashFlow >= 0 ? '+' : ''}{currSymbol}{Math.abs(netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Savings Target Rate
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.1rem' }}>
                {reportData?.savingsRate || 0}%
              </div>
            </div>
          </div>

          {/* Section 5: Top Expenditure Categories (Fixed Capped List) */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.8rem 1rem', borderRadius: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <PieChart size={13} color="#f59e0b" /> Top Expenditure Categories
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                {reportData?.topCategories?.length ? `Top ${reportData.topCategories.length}` : '0 logged'}
              </span>
            </div>

            {reportData?.topCategories?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {reportData.topCategories.map((c, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '0.78rem', 
                      padding: '0.3rem 0.55rem', 
                      borderRadius: '0.4rem',
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                      <span style={{ color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </span>
                    </div>
                    <strong style={{ color: '#f87171', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                      -{currSymbol}{Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                ))}

                {/* Graceful summary line for remaining categories */}
                {reportData?.otherCategoriesCount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8', padding: '0.2rem 0.55rem', fontStyle: 'italic' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
                      + {reportData.otherCategoriesCount} more {reportData.otherCategoriesCount === 1 ? 'category' : 'categories'}
                    </span>
                    <span style={{ flexShrink: 0, whiteSpace: 'nowrap', textAlign: 'right' }}>
                      -{currSymbol}{Number(reportData.otherCategoriesTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No expenditures recorded in this timeframe</span>
              </div>
            )}
          </div>

          {/* Section 6: Report Footer / Watermark */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.65rem', color: '#64748b' }}>
            <span>Verified Personal Financial Overview</span>
            <span>finance-tracker • 9:16 Story Edition</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ flex: 1, padding: '0.8rem' }}
          >
            Close
          </button>

          <button
            type="button"
            className="btn-primary"
            disabled={generatingJpg || loading}
            onClick={handleDownloadJpg}
            style={{ 
              flex: 2, 
              padding: '0.8rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem'
            }}
          >
            <Download size={18} />
            {generatingJpg ? 'Rendering JPG Image...' : 'Download Report as JPG (.jpg)'}
          </button>
        </div>
      </div>
    </div>
  );
}
