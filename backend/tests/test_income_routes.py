import pytest
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, Category

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

@pytest.fixture
def seed_db(app):
    with app.app_context():
        user = User(name="Elena", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        c_salary = Category(name="Salary", kind="income", user_id=None)
        c_bonus = Category(name="Bonus", kind="income", user_id=user.id)
        c_groceries = Category(name="Groceries", kind="expense", user_id=None)
        db.session.add_all([c_salary, c_bonus, c_groceries])
        db.session.commit()

        return {
            "user_id": user.id,
            "cat_salary_id": c_salary.id,
            "cat_bonus_id": c_bonus.id,
            "cat_groceries_id": c_groceries.id
        }

def test_add_income_api_success(client, seed_db):
    u = str(seed_db["user_id"])
    payload = {
        "category_id": seed_db["cat_salary_id"],
        "amount": 5000.00,
        "currency": "USD",
        "period_months": 1,
        "start_date": "2026-01-01",
        "note": "Primary job"
    }

    res = client.post("/api/incomes", json=payload, headers={"X-User-Id": u})
    assert res.status_code == 201
    data = res.get_json()
    assert data["monthly_equivalent"] == 5000.00
    assert data["period_label"] == "Monthly"

def test_reject_expense_category_api(client, seed_db):
    u = str(seed_db["user_id"])
    payload = {
        "category_id": seed_db["cat_groceries_id"], # Invalid expense category
        "amount": 1000.00,
        "currency": "USD",
        "period_months": 1,
        "start_date": "2026-01-01"
    }

    res = client.post("/api/incomes", json=payload, headers={"X-User-Id": u})
    assert res.status_code == 422
    data = res.get_json()
    assert "not an income category" in data["error"]

def test_income_summary_api(client, seed_db):
    u = str(seed_db["user_id"])
    # $5,000 / month
    client.post("/api/incomes", json={"category_id": seed_db["cat_salary_id"], "amount": 5000.00, "currency": "USD", "period_months": 1, "start_date": "2026-01-01"}, headers={"X-User-Id": u})
    # $12,000 / 12 = $1,000 / month
    client.post("/api/incomes", json={"category_id": seed_db["cat_bonus_id"], "amount": 12000.00, "currency": "USD", "period_months": 12, "start_date": "2026-01-01"}, headers={"X-User-Id": u})

    res = client.get("/api/incomes/summary", headers={"X-User-Id": u})
    assert res.status_code == 200
    data = res.get_json()
    assert data["total_monthly_income"] == 6000.00
