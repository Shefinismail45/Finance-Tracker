import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { api } from './api';
import { supabase } from './supabaseClient';
import { LoginPage } from './components/LoginPage';
import { SidebarNav } from './components/SidebarNav';
import { TopNavbar } from './components/TopNavbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { CategoryTotals } from './components/CategoryTotals';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { IncomeSummaryBar } from './components/IncomeSummaryBar';
import { IncomeList } from './components/IncomeList';
import { IncomeForm } from './components/IncomeForm';
import { DebtSummaryBar } from './components/DebtSummaryBar';
import { DebtList } from './components/DebtList';
import { DebtForm } from './components/DebtForm';
import { PaymentModal } from './components/PaymentModal';
import { SavingsSummaryBar } from './components/SavingsSummaryBar';
import { SavingsList } from './components/SavingsList';
import { SavingsForm } from './components/SavingsForm';
import { ContributionModal } from './components/ContributionModal';
import { BudgetList } from './components/BudgetList';
import { BudgetForm } from './components/BudgetForm';
import { SearchModal } from './components/SearchModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { FinancialReportModal } from './components/FinancialReportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'expense' | 'income' | 'debt' | 'savings' | 'budget'
  const [theme, setTheme] = useState(() => localStorage.getItem('pft_theme') || 'dark');
  const [currency, setCurrency] = useState(() => localStorage.getItem('pft_currency') || 'USD');
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleSelectCurrency = (newCurr) => {
    setCurrency(newCurr);
    localStorage.setItem('pft_currency', newCurr);
  };

  // Sort States per Screen
  const [expenseSort, setExpenseSort] = useState('date_desc');
  const [incomeSort, setIncomeSort] = useState('date_desc');
  const [debtSort, setDebtSort] = useState('avalanche');
  const [savingsSort, setSavingsSort] = useState('amount_desc');
  const [budgetSort, setBudgetSort] = useState('amount_desc');

  // Expense State
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expenseTotals, setExpenseTotals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpenseCatId, setSelectedExpenseCatId] = useState(null);

  // Income State
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [selectedIncomeCatId, setSelectedIncomeCatId] = useState(null);

  // Debt State
  const [debts, setDebts] = useState([]);
  const [debtSummary, setDebtSummary] = useState(null);
  const [debtFilter, setDebtFilter] = useState(null);
  const [paymentDebtTarget, setPaymentDebtTarget] = useState(null);

  // Savings State
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [savingsSummary, setSavingsSummary] = useState(null);
  const [contributionGoalTarget, setContributionGoalTarget] = useState(null);

  // Budget State
  const [budgets, setBudgets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);

  // Sorted list views for instant client-side ordering
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      if (expenseSort === 'date_desc') return new Date(b.occurred_at) - new Date(a.occurred_at);
      if (expenseSort === 'date_asc') return new Date(a.occurred_at) - new Date(b.occurred_at);
      if (expenseSort === 'amount_desc') return Number(b.amount) - Number(a.amount);
      if (expenseSort === 'amount_asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });
  }, [expenses, expenseSort]);

  const sortedIncomes = useMemo(() => {
    return [...incomes].sort((a, b) => {
      if (incomeSort === 'date_desc') return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      if (incomeSort === 'date_asc') return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      if (incomeSort === 'amount_desc') return Number(b.amount) - Number(a.amount);
      if (incomeSort === 'amount_asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });
  }, [incomes, incomeSort]);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      if (debtSort === 'avalanche') {
        if (a.is_paid_off !== b.is_paid_off) return a.is_paid_off ? 1 : -1;
        if (Number(b.interest_rate) !== Number(a.interest_rate)) return Number(b.interest_rate) - Number(a.interest_rate);
        return Number(b.remaining_balance) - Number(a.remaining_balance);
      }
      if (debtSort === 'amount_desc') return Number(b.remaining_balance) - Number(a.remaining_balance);
      if (debtSort === 'amount_asc') return Number(a.remaining_balance) - Number(b.remaining_balance);
      if (debtSort === 'date_desc') return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      if (debtSort === 'date_asc') return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      return 0;
    });
  }, [debts, debtSort]);

  const sortedSavingsGoals = useMemo(() => {
    return [...savingsGoals].sort((a, b) => {
      if (savingsSort === 'amount_desc') return Number(b.total_saved) - Number(a.total_saved);
      if (savingsSort === 'amount_asc') return Number(a.total_saved) - Number(b.total_saved);
      if (savingsSort === 'date_desc') return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      if (savingsSort === 'date_asc') return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      return 0;
    });
  }, [savingsGoals, savingsSort]);

  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      if (budgetSort === 'amount_desc') return Number(b.planned_amount) - Number(a.planned_amount);
      if (budgetSort === 'amount_asc') return Number(a.planned_amount) - Number(b.planned_amount);
      if (budgetSort === 'usage_desc') return Number(b.usage_percent || 0) - Number(a.usage_percent || 0);
      if (budgetSort === 'name_asc') return (a.category_name || '').localeCompare(b.category_name || '');
      return 0;
    });
  }, [budgets, budgetSort]);

  // Initialize theme on document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pft_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Auth State Detection on Mount
  useEffect(() => {
    let mounted = true;

    // Safety timeout: Never leave the user waiting if network request hangs
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setAuthChecking(false);
      }
    }, 600);

    const checkSession = async () => {
      try {
        // Fast local session resolution from storage
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user && mounted) {
          setUser(sessionData.session.user);
          setAuthChecking(false);
          clearTimeout(safetyTimer);
          return;
        }

        // Check local demo storage
        const stored = localStorage.getItem('pft_demo_user');
        if (stored && mounted) {
          try {
            setUser(JSON.parse(stored));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Session check notice:', err);
      } finally {
        if (mounted) {
          setAuthChecking(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && mounted) {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('pft_demo_user');
    setUser(null);
  };

  // Load data for active tab when user is present
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'expense') {
        const [catsRes, totalsRes, expsRes] = await Promise.all([
          api.getCategories('expense'),
          api.getCategoryTotals(),
          api.getExpenses(selectedExpenseCatId ? { category_id: selectedExpenseCatId } : {})
        ]);
        setExpenseCategories(catsRes);
        setExpenseTotals(totalsRes);
        setExpenses(expsRes);
      } else if (activeTab === 'income') {
        const [catsRes, summaryRes, incsRes] = await Promise.all([
          api.getCategories('income'),
          api.getIncomeSummary(),
          api.getIncomes(selectedIncomeCatId ? { category_id: selectedIncomeCatId } : {})
        ]);
        setIncomeCategories(catsRes);
        setIncomeSummary(summaryRes);
        setIncomes(incsRes);
      } else if (activeTab === 'debt') {
        const [summaryRes, debtsRes] = await Promise.all([
          api.getDebtSummary(),
          api.getDebts(debtFilter ? { status_filter: debtFilter } : {})
        ]);
        setDebtSummary(summaryRes);
        setDebts(debtsRes);
      } else if (activeTab === 'savings') {
        const [summaryRes, goalsRes] = await Promise.all([
          api.getSavingsSummary(),
          api.getSavingsGoals()
        ]);
        setSavingsSummary(summaryRes);
        setSavingsGoals(goalsRes);
      } else if (activeTab === 'budget') {
        const [catsRes, budgetsRes] = await Promise.all([
          api.getCategories('expense'),
          api.getBudgets()
        ]);
        setExpenseCategories(catsRes);
        setBudgets(budgetsRes);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Error loading financial data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedExpenseCatId, selectedIncomeCatId, debtFilter, user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [loadData, user]);

  // Form Submit Handlers
  const handleExpenseSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.updateExpense(editingItem.id, formData);
      } else {
        await api.createExpense(formData);
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncomeSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.updateIncome(editingItem.id, formData);
      } else {
        await api.createIncome(formData);
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDebtSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.updateDebt(editingItem.id, formData);
      } else {
        await api.createDebt(formData);
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavingsSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.updateSavingsGoal(editingItem.id, formData);
      } else {
        await api.createSavingsGoal(formData);
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleBudgetSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await api.saveBudget(formData);
      setIsFormOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense transaction?')) return;
    try {
      await api.deleteExpense(id);
      await loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Delete this income stream?')) return;
    try {
      await api.deleteIncome(id);
      await loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDeleteDebt = async (id) => {
    if (!window.confirm('Delete this debt entry and all its payment history?')) return;
    try {
      await api.deleteDebt(id);
      await loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDeleteSavingsGoal = async (id) => {
    if (!window.confirm('Delete this savings goal and all its deposit history?')) return;
    try {
      await api.deleteSavingsGoal(id);
      await loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this category budget limit?')) return;
    try {
      await api.deleteBudget(id);
      await loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // 1. Initial Session Loading Screen (Branded Fast Pulse)
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', gap: '1.25rem' }}>
        <div style={{
          width: '3.75rem',
          height: '3.75rem',
          borderRadius: '1.25rem',
          background: 'var(--primary-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 10px 28px rgba(37, 99, 235, 0.4)'
        }}>
          <Wallet size={28} />
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Loading FinanceTracker...
        </div>
      </div>
    );
  }

  // 2. FIRST PAGE: Dedicated Login / Auth Page if not authenticated
  if (!user) {
    return <LoginPage onAuthSuccess={(userObj) => setUser(userObj)} />;
  }

  const getActiveTabHasEntries = () => {
    switch (activeTab) {
      case 'expense': return expenses.length > 0;
      case 'income': return incomes.length > 0;
      case 'debt': return debts.length > 0;
      case 'savings': return savingsGoals.length > 0;
      case 'budget': return budgets.length > 0;
      default: return false;
    }
  };

  // 3. MAIN DASHBOARD APPLICATION
  return (
    <div className="app-layout">
      {/* Desktop Persistent Left Sidebar */}
      <SidebarNav
        activeTab={activeTab}
        onSelectTab={(tab) => { setActiveTab(tab); setIsFormOpen(false); }}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAccountModalOpen(true)}
        currency={currency}
        onSelectCurrency={handleSelectCurrency}
      />

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        <TopNavbar
          activeTab={activeTab}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenForm={() => { setEditingItem(null); setIsFormOpen(true); }}
          onOpenAuth={() => setIsAccountModalOpen(true)}
          currency={currency}
          onSelectCurrency={handleSelectCurrency}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          hasEntries={getActiveTabHasEntries()}
        />

        <main className="content-body">
          {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>{error}</div>}

          {activeTab === 'dashboard' && (
            <DashboardView 
              onNavigate={(tab) => { setActiveTab(tab); setIsFormOpen(false); }}
              onOpenForm={(tab) => { setActiveTab(tab); setEditingItem(null); setIsFormOpen(true); }}
              onOpenReport={() => setIsReportModalOpen(true)}
              currency={currency}
            />
          )}

          {activeTab === 'expense' && (
            <>
              <CategoryTotals
                totals={expenseTotals}
                selectedCategoryId={selectedExpenseCatId}
                onSelectCategory={(id) => setSelectedExpenseCatId(id)}
                currency={currency}
                currentSort={expenseSort}
                onSortChange={(s) => setExpenseSort(s)}
              />

              <ExpenseList
                expenses={sortedExpenses}
                onEdit={(exp) => { setEditingItem(exp); setIsFormOpen(true); }}
                onDelete={handleDeleteExpense}
                onAddNew={() => { setEditingItem(null); setIsFormOpen(true); }}
                loading={loading}
                currency={currency}
              />
            </>
          )}

          {activeTab === 'income' && (
            <>
              <IncomeSummaryBar
                summary={incomeSummary}
                selectedCategoryId={selectedIncomeCatId}
                onSelectCategory={(id) => setSelectedIncomeCatId(id)}
                currency={currency}
                currentSort={incomeSort}
                onSortChange={(s) => setIncomeSort(s)}
              />

              <IncomeList
                incomes={sortedIncomes}
                onEdit={(inc) => { setEditingItem(inc); setIsFormOpen(true); }}
                onDelete={handleDeleteIncome}
                onAddNew={() => { setEditingItem(null); setIsFormOpen(true); }}
                loading={loading}
                currency={currency}
              />
            </>
          )}

          {activeTab === 'debt' && (
            <>
              <DebtSummaryBar 
                summary={debtSummary}
                activeFilter={debtFilter}
                onSelectFilter={(f) => setDebtFilter(f)}
                currency={currency}
                currentSort={debtSort}
                onSortChange={(s) => setDebtSort(s)}
              />

              <DebtList
                debts={sortedDebts}
                onEdit={(d) => { setEditingItem(d); setIsFormOpen(true); }}
                onDelete={handleDeleteDebt}
                onLogPayment={(d) => setPaymentDebtTarget(d)}
                onViewHistory={(d) => setPaymentDebtTarget(d)}
                onAddNew={() => { setEditingItem(null); setIsFormOpen(true); }}
                loading={loading}
                currency={currency}
              />
            </>
          )}

          {activeTab === 'savings' && (
            <>
              <SavingsSummaryBar 
                summary={savingsSummary} 
                currency={currency}
                currentSort={savingsSort}
                onSortChange={(s) => setSavingsSort(s)}
              />

              <SavingsList
                goals={sortedSavingsGoals}
                onEdit={(g) => { setEditingItem(g); setIsFormOpen(true); }}
                onDelete={handleDeleteSavingsGoal}
                onLogDeposit={(g) => setContributionGoalTarget(g)}
                onViewHistory={(g) => setContributionGoalTarget(g)}
                onAddNew={() => { setEditingItem(null); setIsFormOpen(true); }}
                loading={loading}
                currency={currency}
              />
            </>
          )}

          {activeTab === 'budget' && (
            <BudgetList
              budgets={sortedBudgets}
              onEdit={(b) => { setEditingItem(b); setIsFormOpen(true); }}
              onDelete={handleDeleteBudget}
              onAddNew={() => { setEditingItem(null); setIsFormOpen(true); }}
              currency={currency}
              loading={loading}
              currentSort={budgetSort}
              onSortChange={(s) => setBudgetSort(s)}
            />
          )}
        </main>

        {/* Mobile Floating Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => { setActiveTab(tab); setIsFormOpen(false); }}
        />
      </div>

      {/* Floating "+" Button for Mobile (Visible after at least 1 entry is present) */}
      {activeTab !== 'dashboard' && getActiveTabHasEntries() && (
        <button
          className="fab-btn"
          onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
          title="Add New Entry"
        >
          <Plus size={26} />
        </button>
      )}

      {/* Modals */}
      {isFormOpen && activeTab === 'expense' && (
        <ExpenseForm
          categories={expenseCategories}
          initialData={editingItem}
          onSubmit={handleExpenseSubmit}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
          submitting={submitting}
          defaultCurrency={currency}
        />
      )}

      {isFormOpen && activeTab === 'income' && (
        <IncomeForm
          categories={incomeCategories}
          initialData={editingItem}
          onSubmit={handleIncomeSubmit}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
          submitting={submitting}
          defaultCurrency={currency}
        />
      )}

      {isFormOpen && activeTab === 'debt' && (
        <DebtForm
          initialData={editingItem}
          onSubmit={handleDebtSubmit}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
          submitting={submitting}
          defaultCurrency={currency}
        />
      )}

      {isFormOpen && activeTab === 'savings' && (
        <SavingsForm
          initialData={editingItem}
          onSubmit={handleSavingsSubmit}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
          submitting={submitting}
          defaultCurrency={currency}
        />
      )}

      {isFormOpen && activeTab === 'budget' && (
        <BudgetForm
          categories={expenseCategories}
          initialData={editingItem}
          onSubmit={handleBudgetSubmit}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
          submitting={submitting}
          defaultCurrency={currency}
        />
      )}

      {/* Debt Payment Modal */}
      {paymentDebtTarget && (
        <PaymentModal
          debt={paymentDebtTarget}
          onClose={() => setPaymentDebtTarget(null)}
          onPaymentChange={loadData}
        />
      )}

      {/* Savings Contribution Modal */}
      {contributionGoalTarget && (
        <ContributionModal
          goal={contributionGoalTarget}
          onClose={() => setContributionGoalTarget(null)}
          onContributionChange={loadData}
        />
      )}

      {/* Global Spotlight Search Modal */}
      {isSearchOpen && (
        <SearchModal
          onClose={() => setIsSearchOpen(false)}
          onNavigate={(tab) => { setActiveTab(tab); setIsFormOpen(false); }}
          currency={currency}
        />
      )}

      {/* Financial Notifications & Alerts Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setIsNotificationsOpen(false)}
          onNavigate={(tab) => { setActiveTab(tab); setIsFormOpen(false); }}
          currency={currency}
        />
      )}

      {/* Account Settings & Deletion Modal */}
      {isAccountModalOpen && (
        <AccountSettingsModal
          user={user}
          onClose={() => setIsAccountModalOpen(false)}
          onLogout={handleLogout}
          onDataReset={loadData}
          onOpenReport={() => setIsReportModalOpen(true)}
        />
      )}

      {/* Visual Financial Report Modal (JPG Download) */}
      {isReportModalOpen && (
        <FinancialReportModal
          user={user}
          currency={currency}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
}
