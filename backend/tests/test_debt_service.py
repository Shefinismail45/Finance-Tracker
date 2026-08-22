import pytest
from datetime import date
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Debt
from app.services.debt_service import (
    create_debt,
    get_debts,
    add_payment,
    get_payments,
    delete_payment,
    get_debt_summary,
    DebtValidationError,
    DebtNotFoundError
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
        user = User(name="Grace", primary_currency="USD")
        db.session.add(user)
        db.session.commit()
        return user.id

def test_create_debt_validation_rules(app, seed_user):
    with app.app_context():
        u = seed_user
        # Valid debt
        d = create_debt(u, "Visa", "credit_card", Decimal("1500.00"), "USD", date(2026, 1, 1), Decimal("24.99"))
        assert d.id is not None
        assert d.interest_rate == Decimal("24.99")

        # Reject no_interest with non-zero rate
        with pytest.raises(DebtValidationError, match="No-interest debts must have an interest rate of 0.00%"):
            create_debt(u, "Friend Loan", "no_interest", Decimal("500.00"), "USD", date(2026, 1, 1), Decimal("5.00"))

        # Reject negative or >100 rate
        with pytest.raises(DebtValidationError, match="Interest rate must be between"):
            create_debt(u, "Bad Card", "credit_card", Decimal("500.00"), "USD", date(2026, 1, 1), Decimal("150.00"))

def test_avalanche_sorting_in_get_debts(app, seed_user):
    with app.app_context():
        u = seed_user
        # Low APR active debt: 5% APR, $2000
        d_low = create_debt(u, "Low APR Loan", "loan", Decimal("2000.00"), "USD", date(2026, 1, 1), Decimal("5.00"))
        # High APR active debt: 24% APR, $1000
        d_high = create_debt(u, "High APR Card", "credit_card", Decimal("1000.00"), "USD", date(2026, 1, 1), Decimal("24.00"))
        # Paid-off debt: 30% APR, $500, paid off completely
        d_paid = create_debt(u, "Paid Store Card", "credit_card", Decimal("500.00"), "USD", date(2026, 1, 1), Decimal("30.00"))
        add_payment(d_paid.id, u, Decimal("500.00"), "USD", date(2026, 1, 15))

        debts = get_debts(u)
        assert len(debts) == 3

        # Active high-APR debt must come FIRST (Avalanche Method)
        assert debts[0].id == d_high.id
        assert debts[1].id == d_low.id
        # Paid-off debt must come LAST
        assert debts[2].id == d_paid.id

def test_debt_payment_and_summary(app, seed_user):
    with app.app_context():
        u = seed_user
        d = create_debt(u, "Personal Loan", "loan", Decimal("1000.00"), "USD", date(2026, 1, 1))

        p = add_payment(d.id, u, Decimal("300.00"), "USD", date(2026, 2, 1))
        assert p.id is not None

        summary = get_debt_summary(u)
        assert summary["total_principal"] == 1000.00
        assert summary["total_paid"] == 300.00
        assert summary["total_remaining"] == 700.00
        assert summary["active_debt_count"] == 1
        assert summary["paid_off_count"] == 0

        # Delete payment -> Summary updates automatically
        delete_payment(p.id, u)
        updated_summary = get_debt_summary(u)
        assert updated_summary["total_paid"] == 0.0
        assert updated_summary["total_remaining"] == 1000.00
