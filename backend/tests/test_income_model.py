import pytest
from datetime import date
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category, Income

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

def test_income_periodicity_and_normalization(app):
    with app.app_context():
        user = User(name="Charlie", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        cat_salary = Category(name="Salary", kind="income", user_id=None)
        cat_bonus = Category(name="Annual Bonus", kind="income", user_id=user.id)
        db.session.add_all([cat_salary, cat_bonus])
        db.session.commit()

        # Monthly salary
        monthly_inc = Income(
            user_id=user.id,
            category_id=cat_salary.id,
            amount=Decimal("5000.00"),
            currency="USD",
            period_months=1,
            start_date=date(2026, 1, 1),
            is_active=True
        )

        # Annual bonus: $12,000 / 12 = $1,000 / month
        yearly_inc = Income(
            user_id=user.id,
            category_id=cat_bonus.id,
            amount=Decimal("12000.00"),
            currency="USD",
            period_months=12,
            start_date=date(2026, 1, 1),
            is_active=True
        )

        # Custom 4-month retainer: $4,000 / 4 = $1,000 / month
        custom_inc = Income(
            user_id=user.id,
            category_id=cat_bonus.id,
            amount=Decimal("4000.00"),
            currency="USD",
            period_months=4,
            start_date=date(2026, 1, 1),
            is_active=True
        )

        db.session.add_all([monthly_inc, yearly_inc, custom_inc])
        db.session.commit()

        assert monthly_inc.monthly_equivalent == 5000.00
        assert monthly_inc.period_label == "Monthly"

        assert yearly_inc.monthly_equivalent == 1000.00
        assert yearly_inc.period_label == "Yearly"

        assert custom_inc.monthly_equivalent == 1000.00
        assert custom_inc.period_label == "Every 4 months"

        inc_dict = yearly_inc.to_dict()
        assert inc_dict["monthly_equivalent"] == 1000.00
        assert inc_dict["period_label"] == "Yearly"
        assert inc_dict["start_date"] == "2026-01-01"
