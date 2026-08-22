import pytest
from datetime import datetime, timezone
from decimal import Decimal
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category, Expense
from app.services.expense_service import (
    create_expense,
    get_expenses,
    get_category_totals,
    update_expense,
    delete_expense,
    ExpenseValidationError,
    ExpenseNotFoundError
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
        user1 = User(name="Alice", primary_currency="USD")
        user2 = User(name="Bob", primary_currency="USD")
        db.session.add_all([user1, user2])
        db.session.commit()

        sys_cat = Category(name="Food", icon="utensils", user_id=None)
        custom_cat1 = Category(name="Alice Tech", icon="laptop", user_id=user1.id)
        custom_cat2 = Category(name="Bob Gaming", icon="gamepad", user_id=user2.id)

        db.session.add_all([sys_cat, custom_cat1, custom_cat2])
        db.session.commit()

        return {
            "user1_id": user1.id,
            "user2_id": user2.id,
            "sys_cat_id": sys_cat.id,
            "custom_cat1_id": custom_cat1.id,
            "custom_cat2_id": custom_cat2.id
        }

def test_create_expense_success(app, seed_data):
    with app.app_context():
        now = datetime.now(timezone.utc)
        expense = create_expense(
            user_id=seed_data["user1_id"],
            category_id=seed_data["sys_cat_id"],
            amount=Decimal("45.50"),
            currency="USD",
            occurred_at=now,
            note="Dinner with colleagues"
        )

        assert expense.id is not None
        assert expense.amount == Decimal("45.50")
        assert expense.user_id == seed_data["user1_id"]

def test_create_expense_negative_amount_fails(app, seed_data):
    with app.app_context():
        now = datetime.now(timezone.utc)
        with pytest.raises(ExpenseValidationError, match="must be greater than zero"):
            create_expense(
                user_id=seed_data["user1_id"],
                category_id=seed_data["sys_cat_id"],
                amount=Decimal("-10.00"),
                currency="USD",
                occurred_at=now
            )

def test_create_expense_unauthorized_category_fails(app, seed_data):
    with app.app_context():
        now = datetime.now(timezone.utc)
        # User 1 attempting to use User 2's custom category
        with pytest.raises(ExpenseValidationError, match="not available for user"):
            create_expense(
                user_id=seed_data["user1_id"],
                category_id=seed_data["custom_cat2_id"],
                amount=Decimal("100.00"),
                currency="USD",
                occurred_at=now
            )

def test_get_category_totals_dynamic_sum_and_deletion(app, seed_data):
    with app.app_context():
        u1 = seed_data["user1_id"]
        cat_food = seed_data["sys_cat_id"]
        cat_tech = seed_data["custom_cat1_id"]
        now = datetime.now(timezone.utc)

        exp1 = create_expense(u1, cat_food, Decimal("30.00"), "USD", now)
        exp2 = create_expense(u1, cat_food, Decimal("20.00"), "USD", now)
        exp3 = create_expense(u1, cat_tech, Decimal("150.00"), "USD", now)

        # Verify dynamic category totals
        totals = get_category_totals(u1)
        totals_map = {t["category_name"]: t["total_amount"] for t in totals}
        
        assert totals_map["Food"] == 50.00
        assert totals_map["Alice Tech"] == 150.00

        # Delete an expense and verify log-based total updates automatically
        delete_expense(exp1.id, u1)

        updated_totals = get_category_totals(u1)
        updated_totals_map = {t["category_name"]: t["total_amount"] for t in updated_totals}
        assert updated_totals_map["Food"] == 20.00

def test_update_expense(app, seed_data):
    with app.app_context():
        u1 = seed_data["user1_id"]
        now = datetime.now(timezone.utc)
        exp = create_expense(u1, seed_data["sys_cat_id"], Decimal("50.00"), "USD", now)

        updated = update_expense(exp.id, u1, amount=Decimal("75.00"), note="Updated note")
        assert updated.amount == Decimal("75.00")
        assert updated.note == "Updated note"
