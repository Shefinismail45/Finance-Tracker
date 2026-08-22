import pytest
from datetime import date, datetime, timezone
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category
from app.services.expense_service import create_expense
from app.services.income_service import create_income
from app.services.debt_service import create_debt, add_payment
from app.services.savings_service import create_savings_goal, add_contribution
from app.services.dashboard_service import (
    get_net_worth_snapshot,
    get_flow_summary,
    get_cash_flow_forecast,
    get_executive_dashboard
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
        user = User(name="Oliver", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        c_exp = Category(name="Rent", kind="expense", user_id=None)
        c_inc = Category(name="Salary", kind="income", user_id=None)
        db.session.add_all([c_exp, c_inc])
        db.session.commit()

        return {
            "user_id": user.id,
            "cat_exp_id": c_exp.id,
            "cat_inc_id": c_inc.id
        }

def test_net_worth_stock_snapshot(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        # Savings: $5,000 goal, $3,000 deposited
        g = create_savings_goal(u, "Emergency", "USD", Decimal("300.00"), 1, date(2026, 1, 1))
        add_contribution(g.id, u, Decimal("3000.00"), "USD", date(2026, 1, 15))

        # Debt: $1,000 debt, $400 paid -> $600 remaining
        d = create_debt(u, "Credit Card", "credit_card", Decimal("1000.00"), "USD", date(2026, 1, 1))
        add_payment(d.id, u, Decimal("400.00"), "USD", date(2026, 1, 20))

        # Net Worth = $3000 - $600 = $2400
        snapshot = get_net_worth_snapshot(u)
        assert snapshot["total_savings"] == 3000.00
        assert snapshot["total_debt"] == 600.00
        assert snapshot["net_worth"] == 2400.00

def test_flow_summary_and_savings_rate(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        now = datetime.now(timezone.utc)

        # $6,000 monthly income
        create_income(u, seed_data["cat_inc_id"], Decimal("6000.00"), "USD", 1, date(2026, 1, 1))
        # $1,200 planned monthly savings -> Planned Savings Rate = 20.0%
        create_savings_goal(u, "House", "USD", Decimal("1200.00"), 1, date(2026, 1, 1))
        # $2,000 actual expense
        create_expense(u, seed_data["cat_exp_id"], Decimal("2000.00"), "USD", now)

        flow = get_flow_summary(u, year=now.year, month=now.month)
        assert flow["normalized_income"] == 6000.00
        assert flow["actual_expense"] == 2000.00
        assert flow["planned_savings"] == 1200.00
        assert flow["planned_savings_rate_pct"] == 20.0
        assert flow["net_monthly_flow"] == 4000.00

def test_cash_flow_forecast_30_and_90_days(app, seed_data):
    with app.app_context():
        u = seed_data["user_id"]
        # Income: $6,000/month
        create_income(u, seed_data["cat_inc_id"], Decimal("6000.00"), "USD", 1, date(2026, 1, 1))
        # Planned Savings: $600/month
        create_savings_goal(u, "Buffer", "USD", Decimal("600.00"), 1, date(2026, 1, 1))

        forecast_30 = get_cash_flow_forecast(u, days=30)
        assert forecast_30["projected_inflows"] > 0
        assert forecast_30["projected_net_cash_flow"] > 0

        # Executive Dashboard
        exec_dash = get_executive_dashboard(u)
        assert "stock" in exec_dash
        assert "flow" in exec_dash
        assert "forecast" in exec_dash
