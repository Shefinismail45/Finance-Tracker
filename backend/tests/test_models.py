import pytest
from datetime import datetime, timezone
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category, Expense

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
def client(app):
    return app.test_client()

def test_user_and_category_creation(app):
    with app.app_context():
        user = User(name="Alice", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        # System category (user_id=None)
        sys_cat = Category(name="Groceries", icon="shopping-cart", user_id=None)
        # Custom category
        custom_cat = Category(name="Coffee", icon="cup", user_id=user.id)
        
        db.session.add_all([sys_cat, custom_cat])
        db.session.commit()

        assert sys_cat.is_system_default is True
        assert custom_cat.is_system_default is False
        assert len(user.categories) == 1
        assert user.categories[0].name == "Coffee"

def test_expense_creation_and_precision(app):
    with app.app_context():
        user = User(name="Bob", primary_currency="INR")
        cat = Category(name="Rent", user_id=None)
        db.session.add_all([user, cat])
        db.session.commit()

        now = datetime.now(timezone.utc)
        expense = Expense(
            user_id=user.id,
            category_id=cat.id,
            amount=Decimal("15000.50"),
            currency="INR",
            occurred_at=now,
            note="Monthly apartment rent",
            is_recurring=True
        )
        db.session.add(expense)
        db.session.commit()

        fetched = db.session.get(Expense, expense.id)
        assert fetched is not None
        assert fetched.amount == Decimal("15000.50")
        assert fetched.currency == "INR"
        assert fetched.is_recurring is True
        assert fetched.category.name == "Rent"

        expense_dict = fetched.to_dict()
        assert expense_dict["amount"] == 15000.50
        assert expense_dict["category_name"] == "Rent"
        assert expense_dict["converted_amount"] == 15000.50  # Fallback to amount when converted_amount is null
