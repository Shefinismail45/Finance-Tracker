import pytest
from datetime import date, datetime, timezone
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category
from app.services.expense_service import create_expense
from app.services.income_service import create_income
from app.services.budget_service import (
    set_budget,
    get_budgets_with_actuals,
    check_expense_budget_warning,
    suggest_50_30_20_framework,
    BudgetValidationError,
    BudgetNotFoundError
)

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def seed_data(app):
    with app.app_context():
        user = User(name="Nathan", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        c_groceries = Category(name="Groceries", kind="expense", user_id=None)
        c_dining = Category(name="Dining Out", kind="expense", user_id=user.id)
        c_salary = Category(name="Salary", kind="income", user_id=None)

        db.session.add_all([c_groceries, c_dining, c_salary])
        db.session.commit()

        return {
            "user_id": user.id,
            "cat_groceries_id": c_groceries.id,
            "cat_dining_id": c_dining.id,
            "cat_salary_id": c_salary.id
        }

def test_set_budget_and_upsert(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        # Create Groceries budget $400
        b1 = set_budget(u, seed_data["cat_groceries_id"], Decimal("400.00"), period_months=1)
        assert b1.id is not None
        assert b1.planned_amount == Decimal("400.00")

        # Upsert: Update Groceries budget to $500
        b2 = set_budget(u, seed_data["cat_groceries_id"], Decimal("500.00"), period_months=1)
        assert b2.id == b1.id
        assert b2.planned_amount == Decimal("500.00")

        # Reject income category for budget
        with pytest.raises(BudgetValidationError, match="not an expense category"):
            set_budget(u, seed_data["cat_salary_id"], Decimal("1000.00"))

def test_actual_spend_vs_budget_and_warning(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        c_g = seed_data["cat_groceries_id"]
        now = datetime.now(timezone.utc)

        # Set $200 budget for Groceries
        set_budget(u, c_g, Decimal("200.00"))

        # Log $150 expense -> Under budget ($50 remaining)
        create_expense(u, c_g, Decimal("150.00"), "USD", now)
        warn1 = check_expense_budget_warning(u, c_g, now)
        assert warn1 is None  # No warning when under budget

        # Log $100 expense -> Total $250 -> OVER BUDGET by $50!
        create_expense(u, c_g, Decimal("100.00"), "USD", now)
        warn2 = check_expense_budget_warning(u, c_g, now)
        assert warn2 is not None
        assert warn2["planned_amount"] == 200.0
        assert warn2["actual_amount"] == 250.0
        assert warn2["overage"] == 50.0
        assert warn2["usage_percent"] == 125.0

        # Check get_budgets_with_actuals
        budgets_with_actuals = get_budgets_with_actuals(u, year=now.year, month=now.month)
        assert len(budgets_with_actuals) == 1
        assert budgets_with_actuals[0]["is_over_budget"] is True
        assert budgets_with_actuals[0]["overage"] == 50.0

def test_50_30_20_framework_suggestion(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        # Add $6,000 monthly income
        create_income(u, seed_data["cat_salary_id"], Decimal("6000.00"), "USD", 1, date(2026, 1, 1))

        suggestion = suggest_50_30_20_framework(u)
        assert suggestion["monthly_income"] == 6000.00
        assert suggestion["framework"]["needs_50_pct"] == 3000.00
        assert suggestion["framework"]["wants_30_pct"] == 1800.00
        assert suggestion["framework"]["savings_debt_20_pct"] == 1200.00
