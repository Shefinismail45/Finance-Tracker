import pytest
from datetime import date
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category, Budget

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

def test_budget_creation_and_uniqueness(app):
    with app.app_context():
        user = User(name="Mia", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        cat = Category(name="Dining Out", kind="expense", user_id=user.id)
        db.session.add(cat)
        db.session.commit()

        b1 = Budget(
            user_id=user.id,
            category_id=cat.id,
            planned_amount=Decimal("300.00"),
            period_months=1,
            currency="USD",
            start_date=date(2026, 1, 1)
        )
        db.session.add(b1)
        db.session.commit()

        assert b1.id is not None
        assert b1.planned_amount == Decimal("300.00")
        assert b1.period_label == "Monthly"

        # Duplicate budget for same user/category/period -> IntegrityError
        b2 = Budget(
            user_id=user.id,
            category_id=cat.id,
            planned_amount=Decimal("400.00"),
            period_months=1,
            currency="USD",
            start_date=date(2026, 1, 1)
        )
        db.session.add(b2)
        with pytest.raises(IntegrityError):
            db.session.commit()
