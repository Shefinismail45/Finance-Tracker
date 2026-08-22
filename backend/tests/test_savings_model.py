import pytest
from datetime import date
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, SavingsGoal, SavingsContribution

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

def test_savings_goal_with_target(app):
    with app.app_context():
        user = User(name="Isabel", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        goal = SavingsGoal(
            user_id=user.id,
            name="Vacation Fund",
            target_amount=Decimal("5000.00"),
            currency="USD",
            contribution_amount=Decimal("500.00"),
            period_months=1,
            start_date=date(2026, 1, 1)
        )
        db.session.add(goal)
        db.session.commit()

        assert goal.total_saved == 0.0
        assert goal.progress_percent == 0.0

        # Log $1,500 contribution -> 30% progress
        c1 = SavingsContribution(savings_goal_id=goal.id, amount=Decimal("1500.00"), currency="USD", contributed_date=date(2026, 1, 15))
        db.session.add(c1)
        db.session.commit()

        assert goal.total_saved == 1500.00
        assert goal.progress_percent == 30.0

def test_open_ended_savings_goal(app):
    with app.app_context():
        user = User(name="Jack", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        # Open-ended Emergency Fund with target_amount=None
        goal = SavingsGoal(
            user_id=user.id,
            name="Emergency Buffer",
            target_amount=None,
            currency="USD",
            contribution_amount=Decimal("300.00"),
            period_months=1,
            start_date=date(2026, 1, 1)
        )
        db.session.add(goal)
        db.session.commit()

        assert goal.total_saved == 0.0
        assert goal.progress_percent is None

        # Log $2,500 contribution
        c1 = SavingsContribution(savings_goal_id=goal.id, amount=Decimal("2500.00"), currency="USD", contributed_date=date(2026, 1, 10))
        db.session.add(c1)
        db.session.commit()

        assert goal.total_saved == 2500.00
        assert goal.progress_percent is None
        assert goal.to_dict()["progress_percent"] is None
