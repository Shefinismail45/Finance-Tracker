import pytest
from datetime import datetime, timezone
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
def seed_user(app):
    with app.app_context():
        user = User(name="Nora", primary_currency="USD")
        db.session.add(user)
        db.session.commit()

        c_g = Category(name="Groceries", kind="expense", user_id=None)
        db.session.add(c_g)
        db.session.commit()

        return {
            "user_id": user.id,
            "cat_groceries_id": c_g.id
        }

def test_budget_api_and_expense_warning_flow(client, seed_user):
    u = str(seed_user["user_id"])
    c_g = seed_user["cat_groceries_id"]
    now = datetime.now(timezone.utc).isoformat()

    # 1. Set $200 budget
    res = client.post("/api/budgets", json={"category_id": c_g, "planned_amount": 200.00}, headers={"X-User-Id": u})
    assert res.status_code == 201

    # 2. Log $150 expense -> 201 Created, budget_warning is None
    res_exp1 = client.post("/api/expenses", json={"category_id": c_g, "amount": 150.00, "currency": "USD", "occurred_at": now}, headers={"X-User-Id": u})
    assert res_exp1.status_code == 201
    assert res_exp1.get_json()["budget_warning"] is None

    # 3. Log $100 expense -> 201 Created (NOT BLOCKED!), budget_warning is attached!
    res_exp2 = client.post("/api/expenses", json={"category_id": c_g, "amount": 100.00, "currency": "USD", "occurred_at": now}, headers={"X-User-Id": u})
    assert res_exp2.status_code == 201
    warning = res_exp2.get_json()["budget_warning"]
    assert warning is not None
    assert warning["planned_amount"] == 200.0
    assert warning["actual_amount"] == 250.0
    assert warning["overage"] == 50.0

    # 4. Check list budgets with actuals
    res_b = client.get("/api/budgets", headers={"X-User-Id": u})
    assert res_b.status_code == 200
    b_data = res_b.get_json()
    assert b_data[0]["is_over_budget"] is True
    assert b_data[0]["actual_amount"] == 250.0

def test_50_30_20_framework_api(client, seed_user):
    u = str(seed_user["user_id"])
    res = client.get("/api/budgets/framework-suggestion", headers={"X-User-Id": u})
    assert res.status_code == 200
    data = res.get_json()
    assert "framework" in data
