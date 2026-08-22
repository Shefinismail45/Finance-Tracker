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
def seed_db(app):
    with app.app_context():
        u1 = User(name="Alice", primary_currency="USD")
        u2 = User(name="Bob", primary_currency="EUR")
        db.session.add_all([u1, u2])
        db.session.commit()

        c_groceries = Category(name="Groceries", icon="shopping-cart", user_id=None)
        c_alice_tech = Category(name="Alice Tech", icon="laptop", user_id=u1.id)
        db.session.add_all([c_groceries, c_alice_tech])
        db.session.commit()

        return {
            "u1_id": u1.id,
            "u2_id": u2.id,
            "cat_groceries_id": c_groceries.id,
            "cat_alice_tech_id": c_alice_tech.id
        }

def test_add_expense_api_success(client, seed_db):
    payload = {
        "category_id": seed_db["cat_groceries_id"],
        "amount": 84.25,
        "currency": "USD",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "note": "Weekly grocery run",
        "is_recurring": False
    }

    res = client.post(
        "/api/expenses",
        json=payload,
        headers={"X-User-Id": str(seed_db["u1_id"])}
    )

    assert res.status_code == 201
    data = res.get_json()
    assert data["amount"] == 84.25
    assert data["category_name"] == "Groceries"
    assert data["user_id"] == seed_db["u1_id"]

def test_add_expense_validation_error_422(client, seed_db):
    payload = {
        "category_id": seed_db["cat_groceries_id"],
        "amount": -15.00,  # Invalid negative amount
        "currency": "USD",
        "occurred_at": datetime.now(timezone.utc).isoformat()
    }

    res = client.post(
        "/api/expenses",
        json=payload,
        headers={"X-User-Id": str(seed_db["u1_id"])}
    )

    assert res.status_code == 422
    data = res.get_json()
    assert "must be greater than zero" in data["error"]

def test_add_expense_missing_field_400(client, seed_db):
    payload = {
        "amount": 50.00,
        "currency": "USD"
        # missing category_id and occurred_at
    }

    res = client.post(
        "/api/expenses",
        json=payload,
        headers={"X-User-Id": str(seed_db["u1_id"])}
    )

    assert res.status_code == 400
    data = res.get_json()
    assert "Missing required field" in data["error"]

def test_category_totals_api(client, seed_db):
    u1 = str(seed_db["u1_id"])
    cat1 = seed_db["cat_groceries_id"]
    cat2 = seed_db["cat_alice_tech_id"]
    now = datetime.now(timezone.utc).isoformat()

    # Log 2 grocery expenses & 1 tech expense
    client.post("/api/expenses", json={"category_id": cat1, "amount": 30.00, "currency": "USD", "occurred_at": now}, headers={"X-User-Id": u1})
    client.post("/api/expenses", json={"category_id": cat1, "amount": 20.00, "currency": "USD", "occurred_at": now}, headers={"X-User-Id": u1})
    client.post("/api/expenses", json={"category_id": cat2, "amount": 200.00, "currency": "USD", "occurred_at": now}, headers={"X-User-Id": u1})

    res = client.get("/api/expenses/category-totals", headers={"X-User-Id": u1})
    assert res.status_code == 200
    totals = res.get_json()

    totals_map = {t["category_name"]: t["total_amount"] for t in totals}
    assert totals_map["Groceries"] == 50.00
    assert totals_map["Alice Tech"] == 200.00

def test_delete_expense_api(client, seed_db):
    u1 = str(seed_db["u1_id"])
    now = datetime.now(timezone.utc).isoformat()

    res_add = client.post("/api/expenses", json={"category_id": seed_db["cat_groceries_id"], "amount": 10.00, "currency": "USD", "occurred_at": now}, headers={"X-User-Id": u1})
    exp_id = res_add.get_json()["id"]

    # Delete
    res_del = client.delete(f"/api/expenses/{exp_id}", headers={"X-User-Id": u1})
    assert res_del.status_code == 200

    # Delete non-existent or unowned ID -> 404 Not Found
    res_del_again = client.delete(f"/api/expenses/{exp_id}", headers={"X-User-Id": u1})
    assert res_del_again.status_code == 404
