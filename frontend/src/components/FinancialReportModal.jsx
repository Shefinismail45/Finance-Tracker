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
import { api } from '../api';

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
          api.getDashboard(period === 'last_3_months' ? 90 : period === 'this_year' ? 365 : 30).catch(() => null),
          api.getExpenses().catch(() => []),
          api.getIncome().catch(() => []),
          api.getDebts().catch(() => []),
          api.getSavingsGoals().catch(() => [])
        ]);

        if (!isMounted) return;

        // Filter by period dates
        const now = new Date();
        let startDateFilter = null;
        if (period === 'this_month') {
          startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'last_3_months') {
          startDateFilter = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        } else if (period === 'this_year') {
          startDateFilter = new Date(now.getFullYear(), 0, 1);
        }

        const filteredExpenses = startDateFilter 
          ? expensesRes.filter(e => new Date(e.occurred_at || e.created_at) >= startDateFilter)
          : expensesRes;

        const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.converted_amount || e.amount || 0), 0);

        // Group top expense categories
        const catMap = {};
        filteredExpenses.forEach(e => {
          const name = e.category_name || 'General Expense';
          const amt = Number(e.converted_amount || e.amount || 0);
          catMap[name] = (catMap[name] || 0) + amt;
        });

        const topCategories = Object.entries(catMap)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 4);

        // Compute total active income normalized
        const totalIncomeMonthly = incomesRes
          .filter(i => i.is_active !== false)
          .reduce((sum, i) => sum + Number(i.monthly_equivalent || (i.amount / (i.period_months || 1))), 0);

        // Compute debts
        const totalDebtRemaining = debtsRes.reduce((sum, d) => sum + Number(d.remaining_balance ?? d.principal_amount ?? 0), 0);
        const totalDebtPaid = debtsRes.reduce((sum, d) => sum + Number(d.total_paid || 0), 0);

        // Compute savings
        const totalSaved = savingsRes.reduce((sum, s) => sum + Number(s.total_saved || s.contribution_amount || 0), 0);
        const totalSavingsTarget = savingsRes.reduce((sum, s) => sum + Number(s.target_amount || 0), 0);

        const netWorth = totalSaved - totalDebtRemaining;

        setReportData({
          netWorth,
          totalIncomeMonthly,
          totalExpenseAmount,
          totalSaved,
          totalSavingsTarget,
          totalDebtRemaining,
          totalDebtPaid,
          topCategories,
          expenseCount: filteredExpenses.length,
          activeGoalsCount: savingsRes.filter(s => s.is_active !== false).length,
          activeDebtsCount: debtsRes.filter(d => !d.is_paid_off).length,
          savingsRate: dashboardRes?.flow?.planned_savings_rate_pct || 
            (totalIncomeMonthly > 0 ? Math.min(100, Math.round((totalSaved / (totalIncomeMonthly * 12 || 1)) * 100)) : 0)
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
  }, [period]);

  // Capture rendered component as high-resolution JPG image and trigger download
  const handleDownloadJpg = async () => {
    if (!reportCardRef.current || generatingJpg) return;

    try {
      setGeneratingJpg(true);
      setError(null);

      // Dynamically import html2canvas only when downloading
      const html2canvas = (await import('html2canvas')).default;

      // Render canvas at 2x scale for ultra crisp text and visuals
      const canvas = await html2canvas(reportCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a', // Deep slate background for opaque JPG
        logging: false
      });

      // Output as JPG specifically (smaller file size, perfect for WhatsApp / sharing)
      const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Financial_Report_${period}_${dateStr}.jpg`;

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

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileImage size={22} color="var(--primary)" />
              <span>Download Visual Report (JPG)</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Generate a high-resolution, shareable image summarizing your finances
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={13} /> Select Report Timeframe
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.75rem' }}>
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'last_3_months', label: '3 Months' },
              { id: 'this_year', label: 'This Year' },
              { id: 'all_time', label: 'All-Time' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '0.45rem 0.25rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '0.55rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: period === p.id ? 'var(--primary)' : 'transparent',
                  color: period === p.id ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* =======================================================================
            VISUAL REPORT CANVAS CARD (THIS COMPONENT GETS CAPTURED BY html2canvas)
            ======================================================================= */}
        <div 
          ref={reportCardRef}
          id="financial-report-canvas-card"
          style={{
            background: 'linear-gradient(145deg, #0b1329 0%, #131d38 50%, #1e294b 100%)',
            color: '#f8fafc',
            borderRadius: '1.25rem',
            padding: '1.75rem 1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
            marginBottom: '1.5rem',
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}
        >
          {/* Report Top Branding & User Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={13} color="white" />
                </div>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>FinanceTracker</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Financial Summary Report • <strong style={{ color: '#cbd5e1' }}>{userName}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                display: 'inline-block'
              }}>
                {getPeriodLabel()}
              </span>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.3rem' }}>
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Hero Net Worth Metric */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)',
            padding: '1.25rem 1.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(96, 165, 250, 0.25)',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700 }}>
              Estimated Net Worth ({currency})
            </div>
            <div style={{ fontSize: '2.35rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', margin: '0.35rem 0' }}>
              {reportData?.netWorth < 0 ? '-' : ''}{currSymbol}{Math.abs(Number(reportData?.netWorth || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
              ✨ Total Stored Assets - Total Remaining Debts
            </div>
          </div>

          {/* 4 Key Pillar Stat Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            
            {/* Income Tile */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Banknote size={13} color="#34d399" /> Monthly Inflow
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
                +{currSymbol}{Number(reportData?.totalIncomeMonthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>Active recurring income</div>
            </div>

            {/* Expenses Tile */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Receipt size={13} color="#f87171" /> Total Spending
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', marginTop: '0.2rem' }}>
                -{currSymbol}{Number(reportData?.totalExpenseAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>{reportData?.expenseCount || 0} recorded entries</div>
            </div>

            {/* Savings Tile */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                <PiggyBank size={13} color="#60a5fa" /> Total Saved
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.2rem' }}>
                +{currSymbol}{Number(reportData?.totalSaved || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>{reportData?.activeGoalsCount || 0} active savings goals</div>
            </div>

            {/* Debt Tile */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CreditCard size={13} color="#fbbf24" /> Remaining Debt
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
                -{currSymbol}{Number(reportData?.totalDebtRemaining || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>+{currSymbol}{Number(reportData?.totalDebtPaid || 0).toFixed(0)} paid off</div>
            </div>
          </div>

          {/* Top Spending Categories Breakdown */}
          {reportData?.topCategories?.length > 0 && (
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <PieChart size={13} color="#f59e0b" /> Top Expenditure Categories
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {reportData.topCategories.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.25rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <strong style={{ color: '#f87171' }}>{currSymbol}{Number(c.amount).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Footer / Watermark */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.68rem', color: '#64748b' }}>
            <span>Verified Personal Financial Overview</span>
            <span>finance-tracker • Confidential</span>
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
