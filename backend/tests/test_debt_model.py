import pytest
from datetime import date
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Debt, DebtPayment

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

def test_debt_and_payment_log_computation(app):
    with app.app_context():
        user = User(name="Frank", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        debt = Debt(
            user_id=user.id,
            name="Credit Card",
            debt_type="credit_card",
            principal_amount=Decimal("1000.00"),
            interest_rate=Decimal("18.50"),
            currency="USD",
            start_date=date(2026, 1, 1)
        )
        db.session.add(debt)
        db.session.commit()

        assert debt.total_paid == 0.0
        assert debt.remaining_balance == 1000.00
        assert debt.is_paid_off is False

        # Pay $400
        p1 = DebtPayment(debt_id=debt.id, amount=Decimal("400.00"), currency="USD", paid_date=date(2026, 1, 15))
        db.session.add(p1)
        db.session.commit()

        assert debt.total_paid == 400.00
        assert debt.remaining_balance == 600.00
        assert debt.is_paid_off is False

        # Pay $600 -> Paid off!
        p2 = DebtPayment(debt_id=debt.id, amount=Decimal("600.00"), currency="USD", paid_date=date(2026, 2, 15))
        db.session.add(p2)
        db.session.commit()

        assert debt.total_paid == 1000.00
        assert debt.remaining_balance == 0.0
        assert debt.is_paid_off is True

        # Delete p1 -> Balance auto-recalculates to $600 remaining
        db.session.delete(p1)
        db.session.commit()

        assert debt.total_paid == 600.00
        assert debt.remaining_balance == 400.00
        assert debt.is_paid_off is False
