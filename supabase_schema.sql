-- ==============================================================================
-- Personal Finance Tracker - Supabase Postgres Schema Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('expense', 'income')),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'tag',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_categories_user_kind_name UNIQUE (user_id, kind, name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories RLS: Everyone authenticated can view system defaults (user_id IS NULL) or their own
CREATE POLICY "Allow select on default and own categories" 
    ON public.categories FOR SELECT TO authenticated, anon
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Allow insert own categories" 
    ON public.categories FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update own categories" 
    ON public.categories FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete own categories" 
    ON public.categories FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 2. EXPENSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    converted_amount NUMERIC(14, 2),
    exchange_rate NUMERIC(14, 6) DEFAULT 1.0,
    note VARCHAR(255),
    occurred_at TIMESTAMPTZ NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses" 
    ON public.expenses FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 3. INCOMES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    converted_amount NUMERIC(14, 2),
    exchange_rate NUMERIC(14, 6) DEFAULT 1.0,
    period_months INTEGER NOT NULL DEFAULT 1 CHECK (period_months >= 1),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    note VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_income_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own incomes" 
    ON public.incomes FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 4. DEBTS & PAYMENTS TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    debt_type VARCHAR(20) NOT NULL CHECK (debt_type IN ('credit_card', 'loan', 'other', 'no_interest')),
    custom_debt_type VARCHAR(100),
    principal_amount NUMERIC(12, 2) NOT NULL CHECK (principal_amount > 0),
    interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (interest_rate >= 0.00 AND interest_rate <= 100.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    start_date DATE NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_no_interest_rate CHECK (debt_type != 'no_interest' OR interest_rate = 0.00)
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own debts" 
    ON public.debts FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    converted_amount NUMERIC(14, 2),
    exchange_rate NUMERIC(14, 6) DEFAULT 1.0,
    paid_date DATE NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own debt payments" 
    ON public.debt_payments FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 5. SAVINGS GOALS & CONTRIBUTIONS TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_amount NUMERIC(12, 2) CHECK (target_amount IS NULL OR target_amount > 0),
    custom_category VARCHAR(100),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    contribution_amount NUMERIC(12, 2) NOT NULL CHECK (contribution_amount > 0),
    period_months INTEGER NOT NULL DEFAULT 1 CHECK (period_months >= 1),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    note VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_savings_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings goals" 
    ON public.savings_goals FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.savings_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    savings_goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    converted_amount NUMERIC(14, 2),
    exchange_rate NUMERIC(14, 6) DEFAULT 1.0,
    contributed_date DATE NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings contributions" 
    ON public.savings_contributions FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 6. BUDGETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    planned_amount NUMERIC(12, 2) NOT NULL CHECK (planned_amount > 0),
    period_months INTEGER NOT NULL DEFAULT 1 CHECK (period_months >= 1),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_budget_user_cat_period UNIQUE (user_id, category_id, period_months)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets" 
    ON public.budgets FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 7. POSTGRES VIEWS (Computed derived metrics respecting RLS)
-- ==============================================================================

-- 7.1 Debt Balances & Avalanche Priority View
CREATE OR REPLACE VIEW public.debts_avalanche_view WITH (security_invoker = on) AS
SELECT
    d.id,
    d.user_id,
    d.name,
    d.debt_type,
    d.custom_debt_type,
    d.principal_amount,
    d.interest_rate,
    d.currency,
    d.start_date,
    d.note,
    d.created_at,
    d.updated_at,
    COALESCE(SUM(p.amount), 0) AS total_paid,
    GREATEST(0, d.principal_amount - COALESCE(SUM(p.amount), 0)) AS remaining_balance,
    (COALESCE(SUM(p.amount), 0) >= d.principal_amount) AS is_paid_off,
    COUNT(p.id) AS payment_count
FROM public.debts d
LEFT JOIN public.debt_payments p ON p.debt_id = d.id
GROUP BY d.id
ORDER BY 
    (COALESCE(SUM(p.amount), 0) >= d.principal_amount) ASC,
    d.interest_rate DESC,
    GREATEST(0, d.principal_amount - COALESCE(SUM(p.amount), 0)) DESC;

-- 7.2 Savings Goals Derived Progress View
CREATE OR REPLACE VIEW public.savings_goals_view WITH (security_invoker = on) AS
SELECT
    g.id,
    g.user_id,
    g.name,
    g.target_amount,
    g.custom_category,
    g.currency,
    g.contribution_amount,
    g.period_months,
    ROUND(g.contribution_amount / g.period_months, 2) AS monthly_planned_contribution,
    g.start_date,
    g.end_date,
    g.is_active,
    g.note,
    g.created_at,
    g.updated_at,
    COALESCE(SUM(c.amount), 0) AS total_saved,
    CASE 
        WHEN g.target_amount IS NOT NULL AND g.target_amount > 0 THEN
            LEAST(100.0, ROUND((COALESCE(SUM(c.amount), 0) / g.target_amount) * 100.0, 1))
        ELSE NULL
    END AS progress_percent,
    COUNT(c.id) AS contribution_count
FROM public.savings_goals g
LEFT JOIN public.savings_contributions c ON c.savings_goal_id = g.id
GROUP BY g.id;

-- 7.3 Income Streams Derived Monthly View
CREATE OR REPLACE VIEW public.incomes_view WITH (security_invoker = on) AS
SELECT
    i.id,
    i.user_id,
    i.category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    i.amount,
    i.currency,
    i.period_months,
    ROUND(i.amount / i.period_months, 2) AS monthly_equivalent,
    CASE 
        WHEN i.period_months = 1 THEN 'Monthly'
        WHEN i.period_months = 3 THEN 'Quarterly'
        WHEN i.period_months = 6 THEN 'Half-yearly'
        WHEN i.period_months = 12 THEN 'Yearly'
        ELSE 'Every ' || i.period_months || ' months'
    END AS period_label,
    i.start_date,
    i.end_date,
    i.is_active,
    i.note,
    i.created_at,
    i.updated_at
FROM public.incomes i
LEFT JOIN public.categories c ON c.id = i.category_id;

-- 7.4 Expense Category Totals View
CREATE OR REPLACE VIEW public.expense_category_totals_view WITH (security_invoker = on) AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    e.user_id,
    SUM(e.amount) AS total_amount,
    COUNT(e.id) AS transaction_count
FROM public.expenses e
JOIN public.categories c ON c.id = e.category_id
GROUP BY c.id, c.name, c.icon, e.user_id;

-- ==============================================================================
-- 8. SYSTEM DEFAULT CATEGORY SEEDS
-- ==============================================================================
INSERT INTO public.categories (user_id, kind, name, icon) VALUES
    -- Default Expense Categories
    (NULL, 'expense', 'Housing & Rent', 'home'),
    (NULL, 'expense', 'Groceries & Food', 'shopping-cart'),
    (NULL, 'expense', 'Utilities & Bills', 'zap'),
    (NULL, 'expense', 'Transportation', 'car'),
    (NULL, 'expense', 'Dining & Entertainment', 'coffee'),
    (NULL, 'expense', 'Healthcare & Medical', 'activity'),
    (NULL, 'expense', 'Shopping & Personal', 'shopping-bag'),
    (NULL, 'expense', 'Education & Learning', 'book-open'),
    (NULL, 'expense', 'Travel & Vacation', 'plane'),
    (NULL, 'expense', 'Other Expense', 'more-horizontal'),
    -- Default Income Categories
    (NULL, 'income', 'Salary & Wages', 'briefcase'),
    (NULL, 'income', 'Freelance & Contracting', 'laptop'),
    (NULL, 'income', 'Investments & Dividends', 'trending-up'),
    (NULL, 'income', 'Rental Income', 'key'),
    (NULL, 'income', 'Gifts & Grants', 'gift'),
    (NULL, 'income', 'Other Income', 'dollar-sign')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 9. USER ACCOUNT DELETION FUNCTION (CASCADE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
