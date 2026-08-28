import { supabase, isLiveSupabaseConfigured } from './supabaseClient.js';
import { convertAmount, getExchangeRate, fetchLiveExchangeRates } from './currencies.js';

// Helper to get active display currency from localStorage
export function getActiveCurrency() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('pft_currency') || 'USD';
  }
  return 'USD';
}

// Helper to determine if current session is a local demo user
export function isDemoSession(userId) {
  return !userId || userId.startsWith('00000000-');
}

// Safe Date parser for local date-only strings (YYYY-MM-DD) avoiding UTC timezone off-by-one shifts
export function parseLocalDate(dStr) {
  if (!dStr) return null;
  if (dStr instanceof Date) return dStr;
  if (typeof dStr !== 'string') return new Date(dStr);
  if (dStr.includes('T')) return new Date(dStr);
  const parts = dStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date(dStr);
}

// Helper to get active user ID
export async function getActiveUserId() {
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) return data.user.id;
  } catch (e) {
    console.warn('Error fetching auth user:', e);
  }
  
  const demoUser = localStorage.getItem('pft_demo_user');
  if (demoUser) {
    try {
      const parsed = JSON.parse(demoUser);
      return parsed.id || '00000000-0000-0000-0000-000000000001';
    } catch (e) {}
  }
  return null;
}

// Default Seed Categories for local fallback
const DEFAULT_CATEGORIES = [
  // Expense Categories
  { id: '00000000-0000-0000-0001-000000000001', user_id: null, kind: 'expense', name: 'Housing & Rent', icon: 'home', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000002', user_id: null, kind: 'expense', name: 'Groceries & Food', icon: 'shopping-cart', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000011', user_id: null, kind: 'expense', name: 'Family', icon: 'users', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000003', user_id: null, kind: 'expense', name: 'Utilities & Bills', icon: 'zap', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000004', user_id: null, kind: 'expense', name: 'Transportation', icon: 'car', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000005', user_id: null, kind: 'expense', name: 'Dining & Entertainment', icon: 'coffee', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000006', user_id: null, kind: 'expense', name: 'Healthcare & Medical', icon: 'activity', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000007', user_id: null, kind: 'expense', name: 'Shopping & Personal', icon: 'shopping-bag', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000008', user_id: null, kind: 'expense', name: 'Education & Learning', icon: 'book-open', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000009', user_id: null, kind: 'expense', name: 'Travel & Vacation', icon: 'plane', is_system_default: true },
  { id: '00000000-0000-0000-0001-000000000010', user_id: null, kind: 'expense', name: 'Other Expense', icon: 'more-horizontal', is_system_default: true },
  // Income Categories
  { id: '00000000-0000-0000-0002-000000000001', user_id: null, kind: 'income', name: 'Salary & Wages', icon: 'briefcase', is_system_default: true },
  { id: '00000000-0000-0000-0002-000000000002', user_id: null, kind: 'income', name: 'Freelance & Contracting', icon: 'laptop', is_system_default: true },
  { id: '00000000-0000-0000-0002-000000000003', user_id: null, kind: 'income', name: 'Investments & Dividends', icon: 'trending-up', is_system_default: true },
  { id: '00000000-0000-0000-0002-000000000004', user_id: null, kind: 'income', name: 'Rental Income', icon: 'key', is_system_default: true },
  { id: '00000000-0000-0000-0002-000000000005', user_id: null, kind: 'income', name: 'Gifts & Grants', icon: 'gift', is_system_default: true },
  { id: '00000000-0000-0000-0002-000000000006', user_id: null, kind: 'income', name: 'Other Income', icon: 'dollar-sign', is_system_default: true },
];

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// Initial mock data if storage is empty
function getLocalStore(key, defaultVal) {
  if (typeof localStorage === 'undefined') return defaultVal;
  const data = localStorage.getItem(`pft_${key}`);
  if (data) {
    try { return JSON.parse(data); } catch (e) { return defaultVal; }
  }
  localStorage.setItem(`pft_${key}`, JSON.stringify(defaultVal));
  return defaultVal;
}

function setLocalStore(key, val) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`pft_${key}`, JSON.stringify(val));
}

// Initialize seed data
if (typeof localStorage !== 'undefined' && !localStorage.getItem('pft_initialized')) {
  setLocalStore('categories', DEFAULT_CATEGORIES);
  setLocalStore('expenses', [
    {
      id: '00000000-0000-0000-0003-000000000001',
      user_id: DEMO_USER_ID,
      category_id: '00000000-0000-0000-0001-000000000001',
      category_name: 'Housing & Rent',
      amount: 1450.00,
      currency: 'USD',
      note: 'Monthly Apartment Rent',
      occurred_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      is_recurring: true
    },
    {
      id: '00000000-0000-0000-0003-000000000002',
      user_id: DEMO_USER_ID,
      category_id: '00000000-0000-0000-0001-000000000002',
      category_name: 'Groceries & Food',
      amount: 142.50,
      currency: 'USD',
      note: 'Weekly Whole Foods haul',
      occurred_at: new Date(Date.now() - 86400000).toISOString(),
      is_recurring: false
    },
    {
      id: '00000000-0000-0000-0003-000000000003',
      user_id: DEMO_USER_ID,
      category_id: '00000000-0000-0000-0001-000000000005',
      category_name: 'Dining & Entertainment',
      amount: 68.00,
      currency: 'USD',
      note: 'Dinner with friends',
      occurred_at: new Date().toISOString(),
      is_recurring: false
    }
  ]);
  setLocalStore('incomes', [
    {
      id: '00000000-0000-0000-0004-000000000001',
      user_id: DEMO_USER_ID,
      category_id: '00000000-0000-0000-0002-000000000001',
      category_name: 'Salary & Wages',
      amount: 4800.00,
      currency: 'USD',
      period_months: 1,
      period_label: 'Monthly',
      monthly_equivalent: 4800.00,
      start_date: '2026-01-01',
      end_date: null,
      is_active: true,
      note: 'Primary Engineering Salary'
    },
    {
      id: '00000000-0000-0000-0004-000000000002',
      user_id: DEMO_USER_ID,
      category_id: '00000000-0000-0000-0002-000000000002',
      category_name: 'Freelance & Contracting',
      amount: 900.00,
      currency: 'USD',
      period_months: 1,
      period_label: 'Monthly',
      monthly_equivalent: 900.00,
      start_date: '2026-02-01',
      end_date: null,
      is_active: true,
      note: 'Web Consulting Retainer'
    }
  ]);
  setLocalStore('debts', [
    {
      id: '00000000-0000-0000-0005-000000000001',
      user_id: DEMO_USER_ID,
      name: 'Chase Sapphire Reserve',
      debt_type: 'credit_card',
      custom_debt_type: null,
      principal_amount: 3200.00,
      interest_rate: 22.49,
      currency: 'USD',
      start_date: '2025-11-15',
      note: 'Holiday travel balance',
      total_paid: 1200.00,
      remaining_balance: 2000.00,
      is_paid_off: false,
      payment_count: 2
    },
    {
      id: '00000000-0000-0000-0005-000000000002',
      user_id: DEMO_USER_ID,
      name: 'Auto Loan - Toyota',
      debt_type: 'loan',
      custom_debt_type: null,
      principal_amount: 8500.00,
      interest_rate: 4.75,
      currency: 'USD',
      start_date: '2024-06-01',
      note: '48-month vehicle financing',
      total_paid: 4500.00,
      remaining_balance: 4000.00,
      is_paid_off: false,
      payment_count: 12
    }
  ]);
  setLocalStore('debt_payments', [
    { id: '00000000-0000-0000-0006-000000000001', debt_id: '00000000-0000-0000-0005-000000000001', user_id: DEMO_USER_ID, amount: 600.00, currency: 'USD', paid_date: '2026-01-15', note: 'Monthly payment' },
    { id: '00000000-0000-0000-0006-000000000002', debt_id: '00000000-0000-0000-0005-000000000001', user_id: DEMO_USER_ID, amount: 600.00, currency: 'USD', paid_date: '2026-02-15', note: 'Monthly payment' }
  ]);
  setLocalStore('savings_goals', [
    {
      id: '00000000-0000-0000-0007-000000000001',
      user_id: DEMO_USER_ID,
      name: 'Emergency Fund (6 Months)',
      target_amount: 15000.00,
      custom_category: 'Emergency',
      currency: 'USD',
      contribution_amount: 500.00,
      period_months: 1,
      start_date: '2025-01-01',
      end_date: null,
      is_active: true,
      note: 'High-yield savings buffer',
      total_saved: 9200.00,
      progress_percent: 61.3,
      contribution_count: 8,
      monthly_planned_contribution: 500.00
    },
    {
      id: '00000000-0000-0000-0007-000000000002',
      user_id: DEMO_USER_ID,
      name: 'Tokyo Trip Fund',
      target_amount: 4000.00,
      custom_category: 'Travel',
      currency: 'USD',
      contribution_amount: 350.00,
      period_months: 1,
      start_date: '2026-01-01',
      end_date: '2026-10-31',
      is_active: true,
      note: 'Autumn in Japan',
      total_saved: 2100.00,
      progress_percent: 52.5,
      contribution_count: 3,
      monthly_planned_contribution: 350.00
    }
  ]);
  setLocalStore('savings_contributions', [
    { id: '00000000-0000-0000-0008-000000000001', savings_goal_id: '00000000-0000-0000-0007-000000000001', user_id: DEMO_USER_ID, amount: 500.00, currency: 'USD', contributed_date: '2026-01-01', note: 'New year deposit' },
    { id: '00000000-0000-0000-0008-000000000002', savings_goal_id: '00000000-0000-0000-0007-000000000001', user_id: DEMO_USER_ID, amount: 500.00, currency: 'USD', contributed_date: '2026-02-01', note: 'Monthly auto-deposit' }
  ]);
  setLocalStore('budgets', [
    {
      id: '00000000-0000-0000-0009-000000000001',
      user_id: DEMO_USER_ID,
      category_id: '00000000-0000-0000-0001-000000000002',
      category_name: 'Groceries & Food',
      planned_amount: 600.00,
      period_months: 1,
      period_label: 'Monthly',
      currency: 'USD',
      start_date: '2026-01-01',
      is_active: true
    },
    {
      id: '00000000-0000-0000-0009-000000000002',
      user_id: DEMO_USER_ID,
      category_id: '00000000-0000-0000-0001-000000000005',
      category_name: 'Dining & Entertainment',
      planned_amount: 250.00,
      period_months: 1,
      period_label: 'Monthly',
      currency: 'USD',
      start_date: '2026-01-01',
      is_active: true
    }
  ]);
  localStorage.setItem('pft_initialized', 'true');
}

export const api = {
  // ==========================================
  // CATEGORIES
  // ==========================================
  getCategories: async (kind) => {
    const userId = await getActiveUserId();
    const isOther = (name) => /^other/i.test(name?.trim() || '');

    const sortCategories = (cats) => {
      return cats.slice().sort((a, b) => {
        const aIsOther = isOther(a.name);
        const bIsOther = isOther(b.name);
        if (aIsOther && !bIsOther) return 1;
        if (!aIsOther && bIsOther) return -1;

        // Default categories come before custom categories
        if (a.is_system_default && !b.is_system_default) return -1;
        if (!a.is_system_default && b.is_system_default) return 1;

        return a.name.localeCompare(b.name);
      });
    };

    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      let query = supabase.from('categories').select('*').or(`user_id.eq.${userId},user_id.is.null`);
      if (kind) query = query.eq('kind', kind);
      const { data, error } = await query;
      if (error) throw error;
      const mapped = data.map(c => ({ ...c, is_system_default: c.user_id === null }));
      return sortCategories(mapped);
    } else {
      const cats = getLocalStore('categories', DEFAULT_CATEGORIES);
      const filtered = cats.filter(c => (!kind || c.kind === kind) && (c.user_id === null || c.user_id === userId));
      return sortCategories(filtered);
    }
  },

  createCategory: async ({ name, kind, icon = 'tag' }) => {
    const userId = await getActiveUserId();
    const trimmed = name.trim();

    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      // 1. Check if a category with this exact name (case-insensitive) already exists for this user or as a default
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('kind', kind)
        .ilike('name', trimmed)
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (existing && existing.length > 0) {
        // Return existing custom category for this user if exists, or system default
        const match = existing.find(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.user_id === userId) ||
                      existing.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
        if (match) {
          return { ...match, is_system_default: match.user_id === null };
        }
      }

      // 2. If no existing match, insert a new user-owned custom category
      const { data, error } = await supabase.from('categories').insert([{
        user_id: userId,
        name: trimmed,
        kind,
        icon
      }]).select().single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint fallback
          const { data: fallback } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .eq('kind', kind)
            .ilike('name', trimmed)
            .single();
          if (fallback) return { ...fallback, is_system_default: false };
        }
        throw error;
      }
      return { ...data, is_system_default: false };
    } else {
      const cats = getLocalStore('categories', DEFAULT_CATEGORIES);
      const match = cats.find(c => c.kind === kind && (c.user_id === null || c.user_id === userId) && c.name.toLowerCase() === trimmed.toLowerCase());
      if (match) {
        return match;
      }
      const newCat = {
        id: '00000000-0000-0000-0001-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
        user_id: userId,
        name: trimmed,
        kind,
        icon,
        is_system_default: false
      };
      cats.push(newCat);
      setLocalStore('categories', cats);
      return newCat;
    }
  },

  // ==========================================
  // EXPENSES
  // ==========================================
  getExpenses: async (params = {}, targetCurrency = null) => {
    const userId = await getActiveUserId();
    if (!userId) return [];
    const displayCurr = targetCurrency || getActiveCurrency();

    let rawList = [];
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      let query = supabase.from('expenses').select('*, categories(name, icon)').eq('user_id', userId);
      if (params.category_id) query = query.eq('category_id', params.category_id);
      const { data, error } = await query.order('occurred_at', { ascending: false });
      if (error) throw error;
      rawList = data.map(e => ({
        ...e,
        category_name: e.categories?.name || 'Uncategorized',
        category_icon: e.categories?.icon || 'tag'
      }));
    } else {
      let list = getLocalStore('expenses', []).filter(e => e.user_id === userId);
      if (params.category_id) {
        list = list.filter(e => String(e.category_id) === String(params.category_id));
      }
      rawList = list.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
    }

    return rawList.map(e => {
      const origCurrency = e.currency || 'USD';
      const origAmount = Number(e.amount || 0);
      const converted = convertAmount(origAmount, origCurrency, displayCurr);
      return {
        ...e,
        original_amount: origAmount,
        original_currency: origCurrency,
        amount: converted,
        converted_amount: converted,
        display_currency: displayCurr
      };
    });
  },

  getCategoryTotals: async (targetCurrency = null) => {
    const userId = await getActiveUserId();
    if (!userId) return [];
    const displayCurr = targetCurrency || getActiveCurrency();

    const expenses = await api.getExpenses({}, displayCurr);
    const map = {};
    for (const exp of expenses) {
      const key = exp.category_id || 'uncat';
      if (!map[key]) {
        map[key] = {
          category_id: exp.category_id,
          category_name: exp.category_name || 'Other',
          category_icon: exp.category_icon || 'tag',
          total_amount: 0,
          transaction_count: 0
        };
      }
      map[key].total_amount += Number(exp.amount || 0);
      map[key].transaction_count += 1;
    }
    return Object.values(map);
  },

  createExpense: async (payload) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('expenses').insert([{
        user_id: userId,
        category_id: payload.category_id,
        amount: payload.amount,
        currency: payload.currency || 'USD',
        occurred_at: payload.occurred_at,
        note: payload.note,
        is_recurring: Boolean(payload.is_recurring)
      }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocalStore('expenses', []);
      const cats = getLocalStore('categories', DEFAULT_CATEGORIES);
      const cat = cats.find(c => String(c.id) === String(payload.category_id));
      const newExp = {
        id: '00000000-0000-0000-0003-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
        user_id: userId,
        category_id: payload.category_id,
        category_name: cat ? cat.name : 'Other Expense',
        amount: Number(payload.amount),
        currency: payload.currency || 'USD',
        occurred_at: payload.occurred_at,
        note: payload.note,
        is_recurring: Boolean(payload.is_recurring)
      };
      list.unshift(newExp);
      setLocalStore('expenses', list);
      return newExp;
    }
  },

  updateExpense: async (id, payload) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('expenses')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocalStore('expenses', []);
      const idx = list.findIndex(e => String(e.id) === String(id));
      if (idx !== -1) {
        const cats = getLocalStore('categories', DEFAULT_CATEGORIES);
        const cat = cats.find(c => String(c.id) === String(payload.category_id || list[idx].category_id));
        list[idx] = { ...list[idx], ...payload, category_name: cat ? cat.name : list[idx].category_name };
        setLocalStore('expenses', list);
        return list[idx];
      }
    }
  },

  deleteExpense: async (id) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      const list = getLocalStore('expenses', []).filter(e => String(e.id) !== String(id));
      setLocalStore('expenses', list);
      return true;
    }
  },

  // ==========================================
  // INCOMES
  // ==========================================
  getIncomes: async (params = {}, targetCurrency = null) => {
    const userId = await getActiveUserId();
    if (!userId) return [];
    const displayCurr = targetCurrency || getActiveCurrency();

    let rawList = [];
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      let query = supabase.from('incomes_view').select('*').eq('user_id', userId);
      if (params.category_id) query = query.eq('category_id', params.category_id);
      const { data, error } = await query.order('start_date', { ascending: false });
      if (error) throw error;
      rawList = data;
    } else {
      let list = getLocalStore('incomes', []).filter(i => i.user_id === userId);
      if (params.category_id) {
        list = list.filter(i => String(i.category_id) === String(params.category_id));
      }
      rawList = list.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    }

    return rawList.map(i => {
      const origCurrency = i.currency || 'USD';
      const origAmount = Number(i.amount || 0);
      const converted = convertAmount(origAmount, origCurrency, displayCurr);
      const period = Number(i.period_months) || 1;
      const isOneTime = Number(i.period_months) === 0;
      const monthlyEq = isOneTime ? 0 : Math.round((converted / period) * 100) / 100;
      return {
        ...i,
        original_amount: origAmount,
        original_currency: origCurrency,
        amount: converted,
        converted_amount: converted,
        monthly_equivalent: monthlyEq,
        display_currency: displayCurr
      };
    });
  },

  getIncome: async (params = {}, targetCurrency = null) => {
    return api.getIncomes(params, targetCurrency);
  },

  getIncomeSummary: async (targetCurrency = null) => {
    const displayCurr = targetCurrency || getActiveCurrency();
    const incomes = await api.getIncomes({}, displayCurr);
    const totalReceived = incomes.reduce((acc, i) => acc + Number(i.converted_amount || i.amount || 0), 0);
    const activeIncomes = incomes.filter(i => i.is_active !== false);
    const recurringActive = activeIncomes.filter(i => Number(i.period_months) > 0);
    const totalMonthly = recurringActive.reduce((acc, i) => acc + Number(i.monthly_equivalent || (Number(i.amount || 0) / (Number(i.period_months) || 1))), 0);

    const catMap = {};
    incomes.forEach(i => {
      const catId = i.category_id || 'other';
      const catName = i.category_name || 'Income Stream';
      if (!catMap[catId]) {
        catMap[catId] = {
          category_id: i.category_id,
          category_name: catName,
          total_received: 0,
          monthly_amount: 0,
          count: 0
        };
      }
      const amt = Number(i.converted_amount || i.amount || 0);
      catMap[catId].total_received += amt;
      catMap[catId].count += 1;
      if (i.is_active !== false && Number(i.period_months) > 0) {
        catMap[catId].monthly_amount += Number(i.monthly_equivalent || (amt / (Number(i.period_months) || 1)));
      }
    });

    return {
      total_received: Math.round(totalReceived * 100) / 100,
      total_monthly_income: Math.round(totalMonthly * 100) / 100,
      active_streams_count: activeIncomes.length,
      total_streams_count: incomes.length,
      categories: Object.values(catMap)
    };
  },

  createIncome: async (payload) => {
    const userId = await getActiveUserId();
    const periodMonths = payload.period_months !== undefined && payload.period_months !== null ? Number(payload.period_months) : 1;
    const isOneTime = periodMonths === 0;

    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('incomes').insert([{
        user_id: userId,
        category_id: payload.category_id,
        amount: payload.amount,
        currency: payload.currency || 'USD',
        period_months: periodMonths,
        start_date: payload.start_date,
        end_date: payload.end_date || null,
        is_active: payload.is_active ?? true,
        note: payload.note
      }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocalStore('incomes', []);
      const cats = getLocalStore('categories', DEFAULT_CATEGORIES);
      const cat = cats.find(c => String(c.id) === String(payload.category_id));
      const periodLabel = isOneTime
        ? 'One-Time'
        : periodMonths === 1
        ? 'Monthly'
        : periodMonths === 2
        ? 'Bi-Monthly'
        : periodMonths === 3
        ? 'Quarterly'
        : periodMonths === 6
        ? 'Half-Yearly'
        : periodMonths === 12
        ? 'Yearly'
        : `Every ${periodMonths} mo`;
      const newInc = {
        id: '00000000-0000-0000-0004-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
        user_id: userId,
        category_id: payload.category_id,
        category_name: cat ? cat.name : 'Other Income',
        amount: Number(payload.amount),
        currency: payload.currency || 'USD',
        period_months: periodMonths,
        period_label: periodLabel,
        monthly_equivalent: isOneTime ? 0 : Math.round((Number(payload.amount) / periodMonths) * 100) / 100,
        start_date: payload.start_date,
        end_date: payload.end_date || null,
        is_active: payload.is_active ?? true,
        note: payload.note
      };
      list.unshift(newInc);
      setLocalStore('incomes', list);
      return newInc;
    }
  },

  updateIncome: async (id, payload) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('incomes')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocalStore('incomes', []);
      const idx = list.findIndex(i => String(i.id) === String(id));
      if (idx !== -1) {
        const periodMonths = payload.period_months !== undefined && payload.period_months !== null
          ? Number(payload.period_months)
          : Number(list[idx].period_months || 1);
        const amount = Number(payload.amount !== undefined ? payload.amount : list[idx].amount);
        const isOneTime = periodMonths === 0;
        const periodLabel = isOneTime
          ? 'One-Time'
          : periodMonths === 1
          ? 'Monthly'
          : periodMonths === 2
          ? 'Bi-Monthly'
          : periodMonths === 3
          ? 'Quarterly'
          : periodMonths === 6
          ? 'Half-Yearly'
          : periodMonths === 12
          ? 'Yearly'
          : `Every ${periodMonths} mo`;
        list[idx] = {
          ...list[idx],
          ...payload,
          period_months: periodMonths,
          period_label: periodLabel,
          monthly_equivalent: isOneTime ? 0 : Math.round((amount / periodMonths) * 100) / 100
        };
        setLocalStore('incomes', list);
        return list[idx];
      }
    }
  },

  deleteIncome: async (id) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { error } = await supabase.from('incomes').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      const list = getLocalStore('incomes', []).filter(i => String(i.id) !== String(id));
      setLocalStore('incomes', list);
      return true;
    }
  },

  // ==========================================
  // DEBTS & PAYMENTS (Avalanche sort)
  // ==========================================
  getDebts: async (params = {}, targetCurrency = null) => {
    const userId = await getActiveUserId();
    if (!userId) return [];
    const displayCurr = targetCurrency || getActiveCurrency();

    let rawList = [];
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      let query = supabase.from('debts_avalanche_view').select('*').eq('user_id', userId);
      if (params.status_filter === 'active') query = query.eq('is_paid_off', false);
      if (params.status_filter === 'paid_off') query = query.eq('is_paid_off', true);
      const { data, error } = await query;
      if (error) throw error;
      rawList = data;
    } else {
      let list = getLocalStore('debts', []).filter(d => d.user_id === userId);
      if (params.status_filter === 'active') list = list.filter(d => !d.is_paid_off);
      if (params.status_filter === 'paid_off') list = list.filter(d => d.is_paid_off);
      rawList = list.sort((a, b) => {
        if (a.is_paid_off !== b.is_paid_off) return a.is_paid_off ? 1 : -1;
        if (b.interest_rate !== a.interest_rate) return b.interest_rate - a.interest_rate;
        return b.remaining_balance - a.remaining_balance;
      });
    }

    return rawList.map(d => {
      const origCurrency = d.currency || 'USD';
      const origPrincipal = Number(d.principal_amount || 0);
      const origPaid = Number(d.total_paid || 0);
      const origRemaining = Number(d.remaining_balance !== undefined ? d.remaining_balance : Math.max(0, origPrincipal - origPaid));
      const origMinPayment = Number(d.minimum_payment || 0);

      return {
        ...d,
        original_principal: origPrincipal,
        original_total_paid: origPaid,
        original_remaining_balance: origRemaining,
        original_currency: origCurrency,
        principal_amount: convertAmount(origPrincipal, origCurrency, displayCurr),
        total_paid: convertAmount(origPaid, origCurrency, displayCurr),
        remaining_balance: convertAmount(origRemaining, origCurrency, displayCurr),
        minimum_payment: convertAmount(origMinPayment, origCurrency, displayCurr),
        display_currency: displayCurr
      };
    });
  },

  getDebtSummary: async (targetCurrency = null) => {
    const displayCurr = targetCurrency || getActiveCurrency();
    const debts = await api.getDebts({}, displayCurr);
    const totalPrincipal = debts.reduce((acc, d) => acc + Number(d.principal_amount || 0), 0);
    const totalPaid = debts.reduce((acc, d) => acc + Number(d.total_paid || 0), 0);
    const totalRemaining = debts.reduce((acc, d) => acc + Number(d.remaining_balance || 0), 0);
    return {
      total_principal: Math.round(totalPrincipal * 100) / 100,
      total_paid: Math.round(totalPaid * 100) / 100,
      total_remaining: Math.round(totalRemaining * 100) / 100,
      active_debt_count: debts.filter(d => !d.is_paid_off).length,
      paid_off_count: debts.filter(d => d.is_paid_off).length
    };
  },

  createDebt: async (payload) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('debts').insert([{
        user_id: userId,
        name: payload.name.trim(),
        debt_type: payload.debt_type,
        custom_debt_type: payload.custom_debt_type || null,
        principal_amount: payload.principal_amount,
        interest_rate: payload.debt_type === 'no_interest' ? 0 : payload.interest_rate,
        currency: payload.currency || 'USD',
        start_date: payload.start_date,
        note: payload.note
      }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocalStore('debts', []);
      const newDebt = {
        id: '00000000-0000-0000-0005-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
        user_id: userId,
        name: payload.name.trim(),
        debt_type: payload.debt_type,
        custom_debt_type: payload.custom_debt_type || null,
        principal_amount: Number(payload.principal_amount),
        interest_rate: payload.debt_type === 'no_interest' ? 0 : Number(payload.interest_rate || 0),
        currency: payload.currency || 'USD',
        start_date: payload.start_date,
        note: payload.note,
        total_paid: 0,
        remaining_balance: Number(payload.principal_amount),
        is_paid_off: false,
        payment_count: 0
      };
      list.push(newDebt);
      setLocalStore('debts', list);
      return newDebt;
    }
  },

  updateDebt: async (id, payload) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('debts')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocalStore('debts', []);
      const idx = list.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
        list[idx].remaining_balance = Math.max(0, list[idx].principal_amount - list[idx].total_paid);
        list[idx].is_paid_off = list[idx].remaining_balance <= 0;
        setLocalStore('debts', list);
        return list[idx];
      }
    }
  },

  deleteDebt: async (id) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { error } = await supabase.from('debts').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      const list = getLocalStore('debts', []).filter(d => String(d.id) !== String(id));
      const payments = getLocalStore('debt_payments', []).filter(p => String(p.debt_id) !== String(id));
      setLocalStore('debts', list);
      setLocalStore('debt_payments', payments);
      return true;
    }
  },

  recordDebtPayment: async (debtId, payload) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('debt_payments').insert([{
        debt_id: debtId,
        user_id: userId,
        amount: payload.amount,
        currency: payload.currency || 'USD',
        paid_date: payload.paid_date,
        note: payload.note
      }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const payments = getLocalStore('debt_payments', []);
      const newP = {
        id: '00000000-0000-0000-0006-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
        debt_id: debtId,
        user_id: userId,
        amount: Number(payload.amount),
        currency: payload.currency || 'USD',
        paid_date: payload.paid_date,
        note: payload.note
      };
      payments.unshift(newP);
      setLocalStore('debt_payments', payments);

      // Recalculate debt balances
      const debts = getLocalStore('debts', []);
      const dIdx = debts.findIndex(d => String(d.id) === String(debtId));
      if (dIdx !== -1) {
        debts[dIdx].total_paid = (debts[dIdx].total_paid || 0) + Number(payload.amount);
        debts[dIdx].remaining_balance = Math.max(0, debts[dIdx].principal_amount - debts[dIdx].total_paid);
        debts[dIdx].is_paid_off = debts[dIdx].remaining_balance <= 0;
        debts[dIdx].payment_count = (debts[dIdx].payment_count || 0) + 1;
        setLocalStore('debts', debts);
      }
      return newP;
    }
  },

  getDebtPayments: async (debtId) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('debt_payments').select('*').eq('debt_id', debtId).order('paid_date', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      return getLocalStore('debt_payments', []).filter(p => String(p.debt_id) === String(debtId));
    }
  },

  getAllDebtPayments: async (targetCurrency = null) => {
    const userId = await getActiveUserId();
    if (!userId) return [];
    const displayCurr = targetCurrency || getActiveCurrency();
    let rawList = [];
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('debt_payments').select('*').eq('user_id', userId).order('paid_date', { ascending: false });
      if (error) throw error;
      rawList = data || [];
    } else {
      rawList = getLocalStore('debt_payments', []).filter(p => p.user_id === userId);
    }
    return rawList.map(p => {
      const origCurrency = p.currency || 'USD';
      const origAmount = Number(p.amount || 0);
      return {
        ...p,
        original_amount: origAmount,
        original_currency: origCurrency,
        amount: convertAmount(origAmount, origCurrency, displayCurr),
        display_currency: displayCurr
      };
    });
  },

  deleteDebtPayment: async (paymentId) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { error } = await supabase.from('debt_payments').delete().eq('id', paymentId).eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      const payments = getLocalStore('debt_payments', []);
      const target = payments.find(p => String(p.id) === String(paymentId));
      const remaining = payments.filter(p => String(p.id) !== String(paymentId));
      setLocalStore('debt_payments', remaining);

      if (target) {
        const debts = getLocalStore('debts', []);
        const dIdx = debts.findIndex(d => String(d.id) === String(target.debt_id));
        if (dIdx !== -1) {
          debts[dIdx].total_paid = Math.max(0, debts[dIdx].total_paid - Number(target.amount));
          debts[dIdx].remaining_balance = Math.max(0, debts[dIdx].principal_amount - debts[dIdx].total_paid);
          debts[dIdx].is_paid_off = debts[dIdx].remaining_balance <= 0;
          debts[dIdx].payment_count = Math.max(0, debts[dIdx].payment_count - 1);
          setLocalStore('debts', debts);
        }
      }
      return true;
    }
  },

  // ==========================================
  // SAVINGS GOALS & CONTRIBUTIONS
  // ==========================================
  getSavingsGoals: async (params = {}, targetCurrency = null) => {
    const userId = await getActiveUserId();
    if (!userId) return [];
    const displayCurr = targetCurrency || getActiveCurrency();

    let rawList = [];
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      let query = supabase.from('savings_goals_view').select('*').eq('user_id', userId);
      if (params.active_only) query = query.eq('is_active', true);
      const { data, error } = await query.order('name');
      if (error) throw error;
      rawList = data;
    } else {
      let list = getLocalStore('savings_goals', []).filter(g => g.user_id === userId);
      if (params.active_only) list = list.filter(g => g.is_active);
      rawList = list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return rawList.map(s => {
      const origCurrency = s.currency || 'USD';
      const origTarget = s.target_amount !== null && s.target_amount !== undefined ? Number(s.target_amount) : null;
      const origSaved = Number(s.total_saved || 0);
      const origContrib = Number(s.contribution_amount || 0);
      const origMonthlyPlanned = Number(s.monthly_planned_contribution || s.contribution_amount || 0);

      const convertedTarget = origTarget !== null ? convertAmount(origTarget, origCurrency, displayCurr) : null;
      const convertedSaved = convertAmount(origSaved, origCurrency, displayCurr);
      const convertedContrib = convertAmount(origContrib, origCurrency, displayCurr);
      const convertedMonthly = convertAmount(origMonthlyPlanned, origCurrency, displayCurr);

      return {
        ...s,
        original_target: origTarget,
        original_total_saved: origSaved,
        original_contribution: origContrib,
        original_currency: origCurrency,
        target_amount: convertedTarget,
        total_saved: convertedSaved,
        contribution_amount: convertedContrib,
        monthly_planned_contribution: convertedMonthly,
        display_currency: displayCurr
      };
    });
  },

  getSavingsSummary: async (targetCurrency = null) => {
    const displayCurr = targetCurrency || getActiveCurrency();
    const goals = await api.getSavingsGoals({}, displayCurr);
    const totalSaved = goals.reduce((acc, g) => acc + Number(g.total_saved || 0), 0);
    const recurringActive = goals.filter(g => g.is_active && Number(g.period_months) > 0);
    const totalPlannedMonthly = recurringActive.reduce((acc, g) => acc + Number(g.monthly_planned_contribution || (Number(g.contribution_amount || 0) / (Number(g.period_months) || 1))), 0);
    const targetReached = goals.filter(g => g.target_amount && Number(g.total_saved) >= Number(g.target_amount)).length;
    return {
      total_saved: Math.round(totalSaved * 100) / 100,
      total_planned_monthly_savings: Math.round(totalPlannedMonthly * 100) / 100,
      active_goal_count: goals.filter(g => g.is_active).length,
      target_reached_count: targetReached
    };
  },

  createSavingsGoal: async (payload) => {
    const userId = await getActiveUserId();
    const periodMonths = payload.period_months !== undefined && payload.period_months !== null ? Number(payload.period_months) : 1;
    const isOneTime = periodMonths === 0;

    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('savings_goals').insert([{
        user_id: userId,
        name: payload.name.trim(),
        target_amount: payload.target_amount || null,
        custom_category: payload.custom_category || null,
        currency: payload.currency || 'USD',
        contribution_amount: payload.contribution_amount,
        period_months: periodMonths,
        start_date: payload.start_date,
        end_date: payload.end_date || null,
        is_active: payload.is_active ?? true,
        note: payload.note
      }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocalStore('savings_goals', []);
      const planned = Number(payload.contribution_amount);
      const target = payload.target_amount ? Number(payload.target_amount) : null;
      const newGoal = {
        id: '00000000-0000-0000-0007-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
        user_id: userId,
        name: payload.name.trim(),
        target_amount: target,
        custom_category: payload.custom_category || null,
        currency: payload.currency || 'USD',
        contribution_amount: planned,
        period_months: periodMonths,
        monthly_planned_contribution: isOneTime ? 0 : Math.round((planned / periodMonths) * 100) / 100,
        start_date: payload.start_date,
        end_date: payload.end_date || null,
        is_active: payload.is_active ?? true,
        note: payload.note,
        total_saved: 0,
        progress_percent: target ? 0 : null,
        contribution_count: 0
      };
      list.push(newGoal);
      setLocalStore('savings_goals', list);
      return newGoal;
    }
  },

  updateSavingsGoal: async (id, payload) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('savings_goals')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocalStore('savings_goals', []);
      const idx = list.findIndex(g => String(g.id) === String(id));
      if (idx !== -1) {
        const periodMonths = payload.period_months !== undefined && payload.period_months !== null
          ? Number(payload.period_months)
          : Number(list[idx].period_months || 1);
        const planned = Number(payload.contribution_amount !== undefined ? payload.contribution_amount : list[idx].contribution_amount);
        const isOneTime = periodMonths === 0;
        list[idx] = {
          ...list[idx],
          ...payload,
          period_months: periodMonths,
          monthly_planned_contribution: isOneTime ? 0 : Math.round((planned / periodMonths) * 100) / 100
        };
        if (list[idx].target_amount) {
          list[idx].progress_percent = Math.min(100, Math.round((list[idx].total_saved / list[idx].target_amount) * 1000) / 10);
        }
        setLocalStore('savings_goals', list);
        return list[idx];
      }
    }
  },

  deleteSavingsGoal: async (id) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      const list = getLocalStore('savings_goals', []).filter(g => String(g.id) !== String(id));
      const contribs = getLocalStore('savings_contributions', []).filter(c => String(c.savings_goal_id) !== String(id));
      setLocalStore('savings_goals', list);
      setLocalStore('savings_contributions', contribs);
      return true;
    }
  },

  recordSavingsContribution: async (goalId, payload) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('savings_contributions').insert([{
        savings_goal_id: goalId,
        user_id: userId,
        amount: payload.amount,
        currency: payload.currency || 'USD',
        contributed_date: payload.contributed_date,
        note: payload.note
      }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const contribs = getLocalStore('savings_contributions', []);
      const newC = {
        id: '00000000-0000-0000-0008-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
        savings_goal_id: goalId,
        user_id: userId,
        amount: Number(payload.amount),
        currency: payload.currency || 'USD',
        contributed_date: payload.contributed_date,
        note: payload.note
      };
      contribs.unshift(newC);
      setLocalStore('savings_contributions', contribs);

      // Recalculate goal total
      const goals = getLocalStore('savings_goals', []);
      const gIdx = goals.findIndex(g => String(g.id) === String(goalId));
      if (gIdx !== -1) {
        goals[gIdx].total_saved = (goals[gIdx].total_saved || 0) + Number(payload.amount);
        if (goals[gIdx].target_amount) {
          goals[gIdx].progress_percent = Math.min(100, Math.round((goals[gIdx].total_saved / goals[gIdx].target_amount) * 1000) / 10);
        }
        goals[gIdx].contribution_count = (goals[gIdx].contribution_count || 0) + 1;
        setLocalStore('savings_goals', goals);
      }
      return newC;
    }
  },

  getSavingsContributions: async (goalId) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('savings_contributions').select('*').eq('savings_goal_id', goalId).order('contributed_date', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      return getLocalStore('savings_contributions', []).filter(c => String(c.savings_goal_id) === String(goalId));
    }
  },

  getAllSavingsContributions: async (targetCurrency = null) => {
    const userId = await getActiveUserId();
    if (!userId) return [];
    const displayCurr = targetCurrency || getActiveCurrency();
    let rawList = [];
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('savings_contributions').select('*').eq('user_id', userId).order('contributed_date', { ascending: false });
      if (error) throw error;
      rawList = data || [];
    } else {
      rawList = getLocalStore('savings_contributions', []).filter(c => c.user_id === userId);
    }
    return rawList.map(c => {
      const origCurrency = c.currency || 'USD';
      const origAmount = Number(c.amount || 0);
      return {
        ...c,
        original_amount: origAmount,
        original_currency: origCurrency,
        amount: convertAmount(origAmount, origCurrency, displayCurr),
        display_currency: displayCurr
      };
    });
  },

  deleteSavingsContribution: async (contributionId) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { error } = await supabase.from('savings_contributions').delete().eq('id', contributionId).eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      const contribs = getLocalStore('savings_contributions', []);
      const target = contribs.find(c => String(c.id) === String(contributionId));
      const remaining = contribs.filter(c => String(c.id) !== String(contributionId));
      setLocalStore('savings_contributions', remaining);

      if (target) {
        const goals = getLocalStore('savings_goals', []);
        const gIdx = goals.findIndex(g => String(g.id) === String(target.savings_goal_id));
        if (gIdx !== -1) {
          goals[gIdx].total_saved = Math.max(0, goals[gIdx].total_saved - Number(target.amount));
          if (goals[gIdx].target_amount) {
            goals[gIdx].progress_percent = Math.min(100, Math.round((goals[gIdx].total_saved / goals[gIdx].target_amount) * 1000) / 10);
          }
          goals[gIdx].contribution_count = Math.max(0, goals[gIdx].contribution_count - 1);
          setLocalStore('savings_goals', goals);
        }
      }
      return true;
    }
  },

  // ==========================================
  // BUDGETS
  // ==========================================
  getBudgets: async (targetCurrency = null) => {
    const userId = await getActiveUserId();
    if (!userId) return [];
    const displayCurr = targetCurrency || getActiveCurrency();

    let rawBudgets = [];
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('budgets').select('*, categories(name)').eq('user_id', userId);
      if (!error && data) {
        rawBudgets = data.map(b => ({ ...b, category_name: b.categories?.name }));
      }
    } else {
      rawBudgets = getLocalStore('budgets', []).filter(b => b.user_id === userId);
    }

    // Get current month expense actuals in displayCurr
    const expenses = await api.getExpenses({}, displayCurr);
    const now = new Date();
    const currentMonthExpenses = expenses.filter(e => {
      const d = parseLocalDate(e.occurred_at || e.created_at);
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    return rawBudgets.map(b => {
      const origCurrency = b.currency || 'USD';
      const origPlanned = Number(b.planned_amount || 0);
      const planned = convertAmount(origPlanned, origCurrency, displayCurr);
      const actual = currentMonthExpenses
        .filter(e => String(e.category_id) === String(b.category_id))
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const usage = planned > 0 ? Math.round((actual / planned) * 1000) / 10 : 0;
      return {
        budget_id: b.id,
        category_id: b.category_id,
        category_name: b.category_name || 'Category',
        original_planned_amount: origPlanned,
        original_currency: origCurrency,
        planned_amount: planned,
        actual_amount: Math.round(actual * 100) / 100,
        remaining_budget: Math.max(0, Math.round((planned - actual) * 100) / 100),
        overage: Math.max(0, Math.round((actual - planned) * 100) / 100),
        usage_percent: usage,
        is_over_budget: actual > planned,
        period_months: b.period_months || 1,
        currency: displayCurr
      };
    });
  },

  saveBudget: async (payload) => {
    const userId = await getActiveUserId();
    const periodMonths = payload.period_months !== undefined && payload.period_months !== null ? Number(payload.period_months) : 1;

    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { data, error } = await supabase.from('budgets').upsert([{
        user_id: userId,
        category_id: payload.category_id,
        planned_amount: payload.planned_amount,
        period_months: periodMonths,
        currency: payload.currency || 'USD',
        start_date: payload.start_date || new Date().toISOString().slice(0, 10),
        is_active: true
      }], { onConflict: 'user_id,category_id,period_months' }).select().single();
      if (error) throw error;
      return data;
    } else {
      const budgets = getLocalStore('budgets', []);
      const cats = getLocalStore('categories', DEFAULT_CATEGORIES);
      const cat = cats.find(c => String(c.id) === String(payload.category_id));
      const idx = budgets.findIndex(b => b.user_id === userId && String(b.category_id) === String(payload.category_id));
      const budgetEntry = {
        id: idx !== -1 ? budgets[idx].id : '00000000-0000-0000-0009-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
        user_id: userId,
        category_id: payload.category_id,
        category_name: cat ? cat.name : 'Category',
        planned_amount: Number(payload.planned_amount),
        period_months: periodMonths,
        period_label: periodMonths === 0 ? 'One-Time Cap' : periodMonths === 1 ? 'Monthly' : `Every ${periodMonths} mo`,
        currency: payload.currency || 'USD',
        start_date: payload.start_date || new Date().toISOString().slice(0, 10),
        is_active: true
      };
      if (idx !== -1) {
        budgets[idx] = budgetEntry;
      } else {
        budgets.push(budgetEntry);
      }
      setLocalStore('budgets', budgets);
      return budgetEntry;
    }
  },

  deleteBudget: async (id) => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      const budgets = getLocalStore('budgets', []).filter(b => String(b.id) !== String(id));
      setLocalStore('budgets', budgets);
      return true;
    }
  },

  // ==========================================
  // OPENING BALANCE & LIQUID CASH
  // ==========================================
  getOpeningBalance: async (targetCurrency = null) => {
    const userId = await getActiveUserId();
    const displayCurr = targetCurrency || getActiveCurrency();
    const defaultVal = { amount: 0, currency: displayCurr, original_amount: 0, original_currency: 'USD', effective_date: '2026-01-01' };
    if (!userId) return defaultVal;

    let balanceData = null;
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      try {
        const { data } = await supabase.auth.getUser();
        const meta = data?.user?.user_metadata?.opening_balance;
        if (meta && typeof meta === 'object') {
          balanceData = {
            amount: Number(meta.amount || 0),
            currency: meta.currency || 'USD',
            effective_date: meta.effective_date || '2026-01-01'
          };
        }
      } catch (e) {
        console.warn('Error fetching opening balance from auth:', e);
      }
    }

    if (!balanceData) {
      const saved = localStorage.getItem(`pft_opening_balance_${userId}`) || localStorage.getItem('pft_opening_balance');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          balanceData = {
            amount: Number(parsed.amount || 0),
            currency: parsed.currency || 'USD',
            effective_date: parsed.effective_date || '2026-01-01'
          };
        } catch (e) {}
      }
    }

    if (!balanceData) return defaultVal;

    const origAmount = Number(balanceData.amount || 0);
    const origCurrency = balanceData.currency || 'USD';
    const converted = convertAmount(origAmount, origCurrency, displayCurr);

    return {
      amount: converted,
      currency: displayCurr,
      original_amount: origAmount,
      original_currency: origCurrency,
      effective_date: balanceData.effective_date || '2026-01-01'
    };
  },

  setOpeningBalance: async (payload) => {
    const userId = await getActiveUserId();
    const balanceData = {
      amount: Number(payload.amount || 0),
      currency: payload.currency || 'USD',
      effective_date: payload.effective_date || new Date().toISOString().slice(0, 10)
    };

    if (userId) {
      localStorage.setItem(`pft_opening_balance_${userId}`, JSON.stringify(balanceData));
    }
    localStorage.setItem('pft_opening_balance', JSON.stringify(balanceData));

    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      try {
        await supabase.auth.updateUser({
          data: { opening_balance: balanceData }
        });
      } catch (e) {
        console.warn('Failed to update supabase user metadata for opening balance:', e);
      }
    }
    return balanceData;
  },

  // ==========================================
  // DASHBOARD COMPILATION
  // ==========================================
  getDashboard: async (days = 30, targetCurrency = null) => {
    const displayCurr = targetCurrency || getActiveCurrency();
    const [savingsSum, debtSum, incomeSum, expenses, budgets, incomes, debts, debtPayments, savingsContribs, openingBalance] = await Promise.all([
      api.getSavingsSummary(displayCurr),
      api.getDebtSummary(displayCurr),
      api.getIncomeSummary(displayCurr),
      api.getExpenses({}, displayCurr),
      api.getBudgets(displayCurr),
      api.getIncome({}, displayCurr),
      api.getDebts({}, displayCurr),
      api.getAllDebtPayments(displayCurr).catch(() => []),
      api.getAllSavingsContributions(displayCurr).catch(() => []),
      api.getOpeningBalance(displayCurr).catch(() => ({ amount: 0, currency: displayCurr, effective_date: '2026-01-01' }))
    ]);

    // 1. Stock Metric: Point-in-time Net Worth (Total Savings Assets - Total Remaining Debts)
    const netWorth = Math.round((savingsSum.total_saved - debtSum.total_remaining) * 100) / 100;
    const stock = {
      net_worth: netWorth,
      total_savings: savingsSum.total_saved,
      total_debt: debtSum.total_remaining,
      as_of_date: new Date().toISOString().slice(0, 10),
      currency: displayCurr
    };

    // 2. This Month's Flow & Debt Breakdown
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Actual Expenses in current calendar month
    const monthExpenses = expenses.filter(e => {
      const d = parseLocalDate(e.occurred_at || e.created_at);
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const actualMonthExpense = Math.round(monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) * 100) / 100;

    // Actual Income in current calendar month (One-time inflows + active recurring streams in this month)
    let actualMonthIncome = 0;
    incomes.forEach(i => {
      const amt = Number(i.amount || 0);
      const isOneTime = Number(i.period_months) === 0;
      if (isOneTime) {
        if (i.start_date) {
          const d = parseLocalDate(i.start_date);
          if (d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
            actualMonthIncome += amt;
          }
        }
      } else {
        if (i.is_active !== false) {
          const startDate = parseLocalDate(i.start_date);
          const endDate = i.end_date ? parseLocalDate(i.end_date) : null;
          if (startDate && startDate <= currentMonthEnd && (!endDate || endDate >= currentMonthStart)) {
            const monthlyPortion = Number(i.monthly_equivalent || (amt / (i.period_months || 1)));
            actualMonthIncome += monthlyPortion;
          }
        }
      }
    });
    actualMonthIncome = Math.round(actualMonthIncome * 100) / 100;

    // Debt Payments made in current calendar month (cash outflow)
    const monthDebtPaymentsList = debtPayments.filter(p => {
      const d = parseLocalDate(p.paid_date);
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const actualMonthDebtPayments = Math.round(monthDebtPaymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0) * 100) / 100;

    // New Debts borrowed in current calendar month (cash inflow)
    const monthNewDebtList = debts.filter(d => {
      const dt = parseLocalDate(d.start_date || d.created_at);
      return dt && dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    });
    const actualMonthNewDebt = Math.round(monthNewDebtList.reduce((sum, d) => sum + Number(d.principal_amount || 0), 0) * 100) / 100;

    // Savings Deposited in current calendar month
    const monthSavingsContribsList = savingsContribs.filter(c => {
      const cd = parseLocalDate(c.contributed_date);
      return cd && cd.getFullYear() === now.getFullYear() && cd.getMonth() === now.getMonth();
    });
    const actualMonthSavingsDeposited = Math.round(monthSavingsContribsList.reduce((sum, c) => sum + Number(c.amount || 0), 0) * 100) / 100;

    // LINE 1: Earned vs. Spent (Lifestyle coverage before debt): Income − Expense
    const earnedVsSpent = Math.round((actualMonthIncome - actualMonthExpense) * 100) / 100;
    const isEarnedSurplus = earnedVsSpent > 0;
    const isEarnedDeficit = earnedVsSpent < 0;

    // LINE 2: Real Cash Change This Month (Spendable cash change): Income − Expense − Debt Payments + New Debt Taken
    const realCashChange = Math.round((actualMonthIncome - actualMonthExpense - actualMonthDebtPayments + actualMonthNewDebt) * 100) / 100;
    const isCashPositive = realCashChange > 0;
    const isCashNegative = realCashChange < 0;

    const this_month_flow = {
      month_name: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear(),
      currency: displayCurr,
      actual_income: actualMonthIncome,
      actual_expense: actualMonthExpense,
      debt_payments: actualMonthDebtPayments,
      new_debt_taken: actualMonthNewDebt,
      savings_deposited: actualMonthSavingsDeposited,
      
      // Line 1 metrics
      earned_vs_spent: earnedVsSpent,
      abs_earned_vs_spent: Math.abs(earnedVsSpent),
      is_earned_surplus: isEarnedSurplus,
      is_earned_deficit: isEarnedDeficit,
      is_earned_even: earnedVsSpent === 0,
      earned_status_label: isEarnedSurplus ? 'Surplus' : isEarnedDeficit ? 'Deficit' : 'Balanced',

      // Line 2 metrics
      real_cash_change: realCashChange,
      abs_real_cash_change: Math.abs(realCashChange),
      is_cash_positive: isCashPositive,
      is_cash_negative: isCashNegative,
      is_cash_even: realCashChange === 0,
      cash_status_label: isCashPositive ? 'Net Cash Inflow' : isCashNegative ? 'Net Cash Outflow' : 'Net Zero Change',

      // Backward compatibility fields
      difference: earnedVsSpent,
      abs_difference: Math.abs(earnedVsSpent),
      is_surplus: isEarnedSurplus,
      is_deficit: isEarnedDeficit,
      status_label: isEarnedSurplus ? 'Surplus' : isEarnedDeficit ? 'Deficit' : 'Balanced',
      month_expenses_count: monthExpenses.length
    };

    // 3. Liquid Cash: Current Spendable Balance Calculation
    const effectiveDate = openingBalance?.effective_date ? parseLocalDate(openingBalance.effective_date) : null;
    const openingAmount = Number(openingBalance?.amount || 0);

    let cumulativeIncome = 0;
    incomes.forEach(i => {
      const amt = Number(i.amount || 0);
      const isOneTime = Number(i.period_months) === 0;
      const itemDate = parseLocalDate(i.start_date || i.created_at);

      if (isOneTime) {
        if (!effectiveDate || (itemDate && itemDate >= effectiveDate)) {
          cumulativeIncome += amt;
        }
      } else {
        if (i.is_active !== false) {
          const streamStart = parseLocalDate(i.start_date || i.created_at) || now;
          const streamEnd = i.end_date ? parseLocalDate(i.end_date) : now;
          const startRef = effectiveDate && effectiveDate > streamStart ? effectiveDate : streamStart;
          const endRef = streamEnd < now ? streamEnd : now;

          if (startRef <= endRef) {
            const monthsCount = Math.max(1, (endRef.getFullYear() - startRef.getFullYear()) * 12 + (endRef.getMonth() - startRef.getMonth()) + 1);
            const monthlyPortion = Number(i.monthly_equivalent || (amt / (Number(i.period_months) || 1)));
            cumulativeIncome += (monthlyPortion * monthsCount);
          }
        } else if (!effectiveDate || (itemDate && itemDate >= effectiveDate)) {
          cumulativeIncome += amt;
        }
      }
    });

    const cumulativeExpenses = expenses
      .filter(e => {
        if (!effectiveDate) return true;
        const d = parseLocalDate(e.occurred_at || e.created_at);
        return d && d >= effectiveDate;
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const cumulativeDebtPayments = debtPayments
      .filter(p => {
        if (!effectiveDate) return true;
        const d = parseLocalDate(p.paid_date);
        return d && d >= effectiveDate;
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const cumulativeNewDebt = debts
      .filter(d => {
        if (!effectiveDate) return true;
        const dt = parseLocalDate(d.start_date || d.created_at);
        return dt && dt >= effectiveDate;
      })
      .reduce((sum, d) => sum + Number(d.principal_amount || 0), 0);

    const cumulativeSavingsDeposited = savingsContribs
      .filter(c => {
        if (!effectiveDate) return true;
        const cd = parseLocalDate(c.contributed_date);
        return cd && cd >= effectiveDate;
      })
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const netCashFlowSinceOpening = Math.round((cumulativeIncome - cumulativeExpenses - cumulativeDebtPayments + cumulativeNewDebt - cumulativeSavingsDeposited) * 100) / 100;
    const currentSpendableBalance = Math.round((openingAmount + netCashFlowSinceOpening) * 100) / 100;

    const liquid_cash = {
      current_spendable_balance: currentSpendableBalance,
      opening_balance: openingAmount,
      opening_date: openingBalance?.effective_date || '2026-01-01',
      currency: displayCurr,
      net_flow_since_opening: netCashFlowSinceOpening,
      cumulative_income: Math.round(cumulativeIncome * 100) / 100,
      cumulative_expense: Math.round(cumulativeExpenses * 100) / 100,
      cumulative_debt_paid: Math.round(cumulativeDebtPayments * 100) / 100,
      cumulative_new_debt: Math.round(cumulativeNewDebt * 100) / 100,
      cumulative_savings_deposited: Math.round(cumulativeSavingsDeposited * 100) / 100,
      has_custom_opening: Boolean(openingAmount > 0 || (openingBalance?.effective_date && openingBalance?.effective_date !== '2026-01-01'))
    };

    // 4. Flow Metric: Normalized / Smoothed Monthly Cadence
    const normalizedIncome = incomeSum.total_monthly_income;
    const plannedSavings = savingsSum.total_planned_monthly_savings;
    const plannedSavingsRate = normalizedIncome > 0 ? Math.round((plannedSavings / normalizedIncome) * 1000) / 10 : 0;
    const netMonthlyFlow = Math.round((normalizedIncome - actualMonthExpense) * 100) / 100;

    const flow = {
      normalized_income: normalizedIncome,
      actual_expense: actualMonthExpense,
      planned_savings: plannedSavings,
      planned_savings_rate_pct: plannedSavingsRate,
      net_monthly_flow: netMonthlyFlow,
      currency: displayCurr
    };

    // 5. Forecast Metric: 30 / 90 Days
    const dailyInflow = normalizedIncome / 30.44;
    const recurringExpenses = expenses.filter(e => e.is_recurring);
    const dailyRecurringOutflow = (recurringExpenses.reduce((sum, e) => sum + Number(e.amount), 0) + plannedSavings) / 30.44;
    const projectedInflows = Math.round(dailyInflow * days * 100) / 100;
    const projectedOutflows = Math.round(dailyRecurringOutflow * days * 100) / 100;
    const projectedNet = Math.round((projectedInflows - projectedOutflows) * 100) / 100;

    const forecast = {
      forecast_days: days,
      projected_inflows: projectedInflows,
      projected_outflows: projectedOutflows,
      projected_net_cash_flow: projectedNet,
      currency: displayCurr
    };

    // 6. Budgets Adherence
    const overBudgetCount = budgets.filter(b => b.is_over_budget).length;

    return {
      stock,
      liquid_cash,
      this_month_flow,
      flow,
      forecast,
      budgets_overview: {
        total_budgets: budgets.length,
        over_budget_count: overBudgetCount,
        budgets
      }
    };
  },

  // 12. ACCOUNT DATA & PROFILE DELETION
  clearAllUserData: async () => {
    const userId = await getActiveUserId();
    if (!userId) return;

    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      await supabase.from('debt_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('savings_contributions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('expenses').delete().eq('user_id', userId);
      await supabase.from('incomes').delete().eq('user_id', userId);
      await supabase.from('debts').delete().eq('user_id', userId);
      await supabase.from('savings_goals').delete().eq('user_id', userId);
      await supabase.from('budgets').delete().eq('user_id', userId);
      await supabase.from('categories').delete().eq('user_id', userId);
    } else {
      ['expenses', 'incomes', 'debts', 'debt_payments', 'savings_goals', 'savings_contributions', 'budgets', 'opening_balance'].forEach(k => {
        localStorage.removeItem(`pft_${k}`);
      });
      if (userId) {
        localStorage.removeItem(`pft_opening_balance_${userId}`);
      }
    }
  },

  deleteUserAccount: async () => {
    const userId = await getActiveUserId();
    if (isLiveSupabaseConfigured() && !isDemoSession(userId)) {
      await api.clearAllUserData();
      try {
        await supabase.rpc('delete_user');
      } catch (e) {}
      await supabase.auth.signOut();
    } else {
      ['expenses', 'incomes', 'debts', 'debt_payments', 'savings_goals', 'savings_contributions', 'budgets', 'demo_user', 'opening_balance'].forEach(k => {
        localStorage.removeItem(`pft_${k}`);
      });
      if (userId) {
        localStorage.removeItem(`pft_opening_balance_${userId}`);
      }
    }
  }
};
