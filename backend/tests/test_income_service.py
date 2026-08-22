import pytest
from datetime import date
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category, Income
from app.services.income_service import (
    create_income,
    get_incomes,
    get_income_summary,
    update_income,
    delete_income,
    IncomeValidationError,
    IncomeNotFoundError
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
        user = User(name="David", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        cat_inc_salary = Category(name="Salary", kind="income", user_id=None)
        cat_inc_bonus = Category(name="Bonus", kind="income", user_id=user.id)
        cat_exp_food = Category(name="Groceries", kind="expense", user_id=None)

        db.session.add_all([cat_inc_salary, cat_inc_bonus, cat_exp_food])
        db.session.commit()

        return {
            "user_id": user.id,
            "cat_salary_id": cat_inc_salary.id,
            "cat_bonus_id": cat_inc_bonus.id,
            "cat_expense_id": cat_exp_food.id
        }

def test_create_income_success(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        inc = create_income(
            user_id=u,
            category_id=seed_data["cat_salary_id"],
            amount=Decimal("6000.00"),
            currency="USD",
            period_months=1,
            start_date=date(2026, 1, 1),
            note="Tech Corp Salary"
        )

        assert inc.id is not None
        assert inc.amount == Decimal("6000.00")
        assert inc.monthly_equivalent == 6000.00

def test_reject_expense_category_for_income(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        # Attempting to use an expense category for an income entry
        with pytest.raises(IncomeValidationError, match="not an income category"):
            create_income(
                user_id=u,
                category_id=seed_data["cat_expense_id"],
                amount=Decimal("1000.00"),
                currency="USD",
                period_months=1,
                start_date=date(2026, 1, 1)
            )

def test_income_summary_normalization_and_dates(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        # $6,000 / month = $6,000
        create_income(u, seed_data["cat_salary_id"], Decimal("6000.00"), "USD", 1, date(2026, 1, 1))
        # $12,000 / 12 = $1,000
        create_income(u, seed_data["cat_bonus_id"], Decimal("12000.00"), "USD", 12, date(2026, 1, 1))

        # Stream that ended in 2025
        create_income(u, seed_data["cat_bonus_id"], Decimal("24000.00"), "USD", 12, date(2025, 1, 1), end_date=date(2025, 12, 31))

        # Summary for today (2026) -> $6000 + $1000 = $7000/month
        summary_2026 = get_income_summary(u, target_date=date(2026, 6, 1))
        assert summary_2026["total_monthly_income"] == 7000.00

        # Summary for 2025 -> $24000/12 = $2000/month
        summary_2025 = get_income_summary(u, target_date=date(2025, 6, 1))
        assert summary_2025["total_monthly_income"] == 2000.00
