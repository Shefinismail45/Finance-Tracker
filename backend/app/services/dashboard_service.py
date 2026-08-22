from datetime import date, datetime, timezone, timedelta
from sqlalchemy import func
from app.extensions import db
from app.models import Expense, Income, Debt, SavingsGoal, SavingsContribution
from app.services.income_service import get_income_summary
from app.services.savings_service import get_savings_summary
from app.services.debt_service import get_debt_summary
from app.services.budget_service import get_budgets_with_actuals

DAYS_PER_MONTH = 30.44

def get_net_worth_snapshot(user_id: int, as_of_date: date = None) -> dict:
    """
    Computes Net Worth as a Stock (Point-in-Time) metric:
    Net Worth = Total Savings - Total Outstanding Debt
    """
    if as_of_date is None:
        as_of_date = date.today()

    # Total savings up to as_of_date
    savings_query = db.session.query(func.sum(SavingsContribution.amount))\
        .join(SavingsGoal)\
        .filter(
            SavingsGoal.user_id == user_id,
            SavingsContribution.contributed_date <= as_of_date
        )
    total_savings_res = savings_query.scalar()
    total_savings = float(total_savings_res) if total_savings_res is not None else 0.0

    # Total debt summary up to as_of_date
    debt_sum = get_debt_summary(user_id)
    total_debt = debt_sum["total_remaining"]

    net_worth = round(total_savings - total_debt, 2)

    return {
        "as_of_date": as_of_date.isoformat(),
        "total_savings": round(total_savings, 2),
        "total_debt": round(total_debt, 2),
        "net_worth": net_worth
    }

def get_flow_summary(user_id: int, year: int = None, month: int = None) -> dict:
    """
    Computes Flow metrics over a specific time window (defaulting to current month):
    - Planned Savings Rate
    - Total Monthly Income vs Total Monthly Expense
    """
    if year is None or month is None:
        today = date.today()
        year = today.year
        month = today.month

    start_dt = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_dt = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_dt = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    # Actual Expense spend in period
    actual_expense_res = db.session.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id,
        Expense.occurred_at >= start_dt,
        Expense.occurred_at < end_dt
    ).scalar()
    actual_expense = float(actual_expense_res) if actual_expense_res is not None else 0.0

    # Normalized Monthly Income
    inc_summary = get_income_summary(user_id, target_date=date(year, month, 1))
    normalized_income = inc_summary["total_monthly_income"]

    # Planned Savings Commitment
    sav_summary = get_savings_summary(user_id)
    planned_savings = sav_summary["total_planned_monthly_savings"]

    # Savings Rate Formulas
    planned_savings_rate = round((planned_savings / normalized_income * 100.0), 1) if normalized_income > 0 else 0.0

    return {
        "year": year,
        "month": month,
        "normalized_income": round(normalized_income, 2),
        "actual_expense": round(actual_expense, 2),
        "planned_savings": round(planned_savings, 2),
        "net_monthly_flow": round(normalized_income - actual_expense, 2),
        "planned_savings_rate_pct": planned_savings_rate
    }

def get_cash_flow_forecast(user_id: int, days: int = 30) -> dict:
    """
    Projected Cash Flow Forecast Engine (FR-7.4):
    Projects inflows from active Income streams and outflows from recurring Expenses and planned Savings.
    """
    # 1. Projected Inflows from active income streams
    active_incomes = db.session.query(Income).filter(
        Income.user_id == user_id,
        Income.is_active.is_(True)
    ).all()

    daily_inflow = sum(
        float(inc.converted_amount if inc.converted_amount is not None else inc.amount) / (inc.period_months * DAYS_PER_MONTH)
        for inc in active_incomes
        if inc.period_months > 0
    )
    projected_inflows = round(daily_inflow * days, 2)

    # 2. Projected Outflows from recurring expenses & planned savings goals
    recurring_expenses = db.session.query(Expense).filter(
        Expense.user_id == user_id,
        Expense.is_recurring.is_(True)
    ).all()

    # Calculate average recurring monthly expense
    daily_recurring_expense = sum(
        float(exp.amount) / DAYS_PER_MONTH for exp in recurring_expenses
    )

    # Planned savings daily rate
    active_savings = db.session.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id,
        SavingsGoal.is_active.is_(True)
    ).all()

    daily_savings_commitment = sum(
        float(g.contribution_amount) / (g.period_months * DAYS_PER_MONTH) for g in active_savings
        if g.period_months > 0
    )

    projected_outflows = round((daily_recurring_expense + daily_savings_commitment) * days, 2)
    projected_net = round(projected_inflows - projected_outflows, 2)

    return {
        "forecast_days": days,
        "projected_inflows": projected_inflows,
        "projected_outflows": projected_outflows,
        "projected_net_cash_flow": projected_net,
        "details": {
            "daily_inflow": round(daily_inflow, 2),
            "daily_outflow": round(daily_recurring_expense + daily_savings_commitment, 2)
        }
    }

def get_executive_dashboard(user_id: int, days: int = 30) -> dict:
    """
    Combines Stock, Flow, Forecast, and Budget metrics into a single executive dashboard payload.
    """
    stock_snapshot = get_net_worth_snapshot(user_id)
    flow_summary = get_flow_summary(user_id)
    forecast = get_cash_flow_forecast(user_id, days=days)
    budgets = get_budgets_with_actuals(user_id)

    over_budget_count = sum(1 for b in budgets if b["is_over_budget"])

    return {
        "stock": stock_snapshot,
        "flow": flow_summary,
        "forecast": forecast,
        "budgets_overview": {
            "total_budgets": len(budgets),
            "over_budget_count": over_budget_count,
            "budgets": budgets
        }
    }
