import pytest
from datetime import date
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User
from app.services.savings_service import (
    create_savings_goal,
    get_savings_goals,
    add_contribution,
    get_contributions,
    delete_contribution,
    get_savings_summary,
    SavingsValidationError,
    SavingsNotFoundError
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
def seed_user(app):
    with app.app_context():
        user = User(name="Kevin", primary_currency="USD")
        db.session.add(user)
        db.session.commit()
        return user.id

def test_create_savings_goal_validation(app, seed_user):
    with app.app_context():
        u = seed_user
        # Valid goal
        g = create_savings_goal(u, "House Downpayment", "USD", Decimal("500.00"), 1, date(2026, 1, 1), target_amount=Decimal("20000.00"))
        assert g.id is not None
        assert g.monthly_planned_contribution == 500.00

        # Reject negative contribution
        with pytest.raises(SavingsValidationError, match="must be greater than zero"):
            create_savings_goal(u, "Bad Goal", "USD", Decimal("-100.00"), 1, date(2026, 1, 1))

def test_over_contribution_and_summary(app, seed_user):
    with app.app_context():
        u = seed_user
        # Goal with $2000 target
        g = create_savings_goal(u, "Laptop", "USD", Decimal("200.00"), 1, date(2026, 1, 1), target_amount=Decimal("20000.00"))

        # Deposit $2,200
        add_contribution(g.id, u, Decimal("2200.00"), "USD", date(2026, 1, 15))

        # Check model getters
        assert g.total_saved == 2200.00
        assert g.progress_percent == 11.0

        summary = get_savings_summary(u)
        assert summary["total_saved"] == 2200.00
        assert summary["total_planned_monthly_savings"] == 200.00
        assert summary["active_goal_count"] == 1
