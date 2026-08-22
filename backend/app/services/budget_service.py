from decimal import Decimal
from datetime import date, datetime, timezone
from sqlalchemy import func, or_
from app.extensions import db
from app.models import User, Category, Expense, Budget
from app.services.income_service import get_income_summary

class BudgetValidationError(ValueError):
    """Raised when budget domain rules are violated."""
    pass

class BudgetNotFoundError(Exception):
    """Raised when a budget is not found or not owned by user."""
    pass

def validate_expense_category(user_id: int, category_id: int) -> Category:
    """
    Validates that a category exists, is accessible by user_id, AND has kind == 'expense'.
    """
    category = db.session.query(Category).filter(
        Category.id == category_id,
        Category.kind == "expense",
        or_(Category.user_id == user_id, Category.user_id.is_(None))
    ).first()

    if not category:
        raise BudgetValidationError(
            f"Category {category_id} does not exist, is not an expense category, or is not available for user {user_id}."
        )
    return category

def set_budget(
    user_id: int,
    category_id: int,
    planned_amount: Decimal,
    period_months: int = 1,
    currency: str = "USD",
    start_date: date = None
) -> Budget:
    """
    Upserts a budget for a given user, category, and period.
    """
    if planned_amount <= Decimal("0"):
        raise BudgetValidationError("Planned budget amount must be greater than zero.")

    if period_months < 1:
        raise BudgetValidationError("Period in months must be at least 1.")

    validate_expense_category(user_id, category_id)

    if start_date is None:
        start_date = date.today()

    existing = db.session.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category_id == category_id,
        Budget.period_months == period_months
    ).first()

    if existing:
        existing.planned_amount = planned_amount
        existing.currency = currency.upper()
        existing.start_date = start_date
        db.session.commit()
        return existing

    budget = Budget(
        user_id=user_id,
        category_id=category_id,
        planned_amount=planned_amount,
        period_months=period_months,
        currency=currency.upper(),
        start_date=start_date
    )

    db.session.add(budget)
    db.session.commit()
    return budget

def get_budgets_with_actuals(user_id: int, year: int = None, month: int = None) -> list[dict]:
    """
    Retrieves budgets for user_id and compares them against actual expense totals
    for the specified month/year (defaulting to current month).
    """
    if year is None or month is None:
        today = date.today()
        year = today.year
        month = today.month

    # Date range for current month
    start_dt = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_dt = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_dt = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    budgets = db.session.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.is_active.is_(True)
    ).all()

    results = []
    for b in budgets:
        # Sum actual expenses for this category in the month
        actual_sum = db.session.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.category_id == b.category_id,
            Expense.occurred_at >= start_dt,
            Expense.occurred_at < end_dt
        ).scalar()

        actual = float(actual_sum) if actual_sum is not None else 0.0
        planned = float(b.planned_amount)

        usage_pct = round((actual / planned) * 100.0, 1) if planned > 0 else 0.0
        is_over = actual > planned
        overage = round(max(0.0, actual - planned), 2)

        results.append({
            "budget_id": b.id,
            "category_id": b.category_id,
            "category_name": b.category.name if b.category else None,
            "planned_amount": planned,
            "actual_amount": round(actual, 2),
            "remaining_budget": round(max(0.0, planned - actual), 2),
            "overage": overage,
            "usage_percent": usage_pct,
            "is_over_budget": is_over,
            "period_months": b.period_months,
            "period_label": b.period_label,
            "currency": b.currency
        })

    return sorted(results, key=lambda x: (-x["is_over_budget"], -x["usage_percent"]))

def check_expense_budget_warning(user_id: int, category_id: int, expense_date: datetime) -> dict | None:
    """
    Checks if an expense entry causes a category budget to be crossed.
    Returns a warning dict if over budget, otherwise None.
    """
    year = expense_date.year
    month = expense_date.month

    budget = db.session.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category_id == category_id,
        Budget.period_months == 1,
        Budget.is_active.is_(True)
    ).first()

    if not budget:
        return None

    start_dt = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_dt = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_dt = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    actual_sum = db.session.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id,
        Expense.category_id == category_id,
        Expense.occurred_at >= start_dt,
        Expense.occurred_at < end_dt
    ).scalar()

    actual = float(actual_sum) if actual_sum is not None else 0.0
    planned = float(budget.planned_amount)

    if actual > planned:
        return {
            "category_name": budget.category.name if budget.category else "Category",
            "planned_amount": planned,
            "actual_amount": round(actual, 2),
            "overage": round(actual - planned, 2),
            "usage_percent": round((actual / planned) * 100.0, 1)
        }
    return None

def suggest_50_30_20_framework(user_id: int) -> dict:
    """
    Suggests a default 50/30/20 budgeting allocation based on Total Normalized Monthly Income.
    """
    income_summary = get_income_summary(user_id=user_id)
    monthly_income = income_summary.get("total_monthly_income", 0.0)

    needs_50 = round(monthly_income * 0.50, 2)
    wants_30 = round(monthly_income * 0.30, 2)
    savings_20 = round(monthly_income * 0.20, 2)

    return {
        "monthly_income": monthly_income,
        "framework": {
            "needs_50_pct": needs_50,
            "wants_30_pct": wants_30,
            "savings_debt_20_pct": savings_20
        },
        "description": "50% Needs (Rent, Groceries), 30% Wants (Dining, Fun), 20% Savings & Debt Repayment."
    }

def delete_budget(budget_id: int, user_id: int) -> bool:
    """
    Deletes a budget record owned by user_id.
    """
    budget = db.session.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if not budget:
        raise BudgetNotFoundError(f"Budget {budget_id} not found for user {user_id}.")

    db.session.delete(budget)
    db.session.commit()
    return True
