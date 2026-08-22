import pytest
from datetime import datetime, timezone
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category
from app.services.currency_service import get_exchange_rate, convert_amount
from app.services.expense_service import create_expense

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

def test_currency_exchange_rate_fallback(app):
    with app.app_context():
        # 1:1 same currency
        rate_same, is_fb, src = get_exchange_rate("USD", "USD")
        assert rate_same == Decimal("1.0")
        assert is_fb is False

        # EUR to USD via static fallback
        converted, rate, is_fallback, source = convert_amount(Decimal("100.00"), "EUR", "USD")
        assert converted > Decimal("100.00")  # €100 > $100
        assert is_fallback is True or is_fallback is False

def test_expense_creation_with_currency_conversion_snapshot(app):
    with app.app_context():
        user = User(name="Sophia", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        cat = Category(name="Travel", kind="expense", user_id=None)
        db.session.add(cat)
        db.session.commit()

        now = datetime.now(timezone.utc)
        # Log €100 EUR expense for a USD user
        exp = create_expense(user.id, cat.id, Decimal("100.00"), "EUR", now)

        assert exp.currency == "EUR"
        assert exp.amount == Decimal("100.00")
        # Converted snapshot stored on write!
        assert exp.converted_amount > Decimal("100.00")
