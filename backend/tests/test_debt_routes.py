import pytest
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User

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
        user = User(name="Hannah", primary_currency="USD")
        db.session.add(user)
        db.session.commit()
        return user.id

def test_debt_and_payment_api_flow(client, seed_user):
    u = str(seed_user)

    # 1. Create Credit Card Debt ($1000 @ 18.5%)
    debt_payload = {
        "name": "Visa Card",
        "debt_type": "credit_card",
        "principal_amount": 1000.00,
        "interest_rate": 18.50,
        "currency": "USD",
        "start_date": "2026-01-01"
    }

    res = client.post("/api/debts", json=debt_payload, headers={"X-User-Id": u})
    assert res.status_code == 201
    debt_id = res.get_json()["id"]
    assert res.get_json()["remaining_balance"] == 1000.00
    assert res.get_json()["is_paid_off"] is False

    # 2. Record Payment ($400)
    pay_payload = {
        "amount": 400.00,
        "currency": "USD",
        "paid_date": "2026-01-15",
        "note": "First installment"
    }
    res_p = client.post(f"/api/debts/{debt_id}/payments", json=pay_payload, headers={"X-User-Id": u})
    assert res_p.status_code == 201
    p_id = res_p.get_json()["id"]

    # 3. Check debt list -> Remaining balance is $600
    res_list = client.get("/api/debts", headers={"X-User-Id": u})
    assert res_list.status_code == 200
    debts = res_list.get_json()
    assert debts[0]["remaining_balance"] == 600.00
    assert debts[0]["total_paid"] == 400.00

    # 4. Check Debt Summary API
    res_sum = client.get("/api/debts/summary", headers={"X-User-Id": u})
    assert res_sum.status_code == 200
    summary = res_sum.get_json()
    assert summary["total_remaining"] == 600.00
    assert summary["active_debt_count"] == 1

    # 5. Record second payment ($600) -> Paid off!
    client.post(f"/api/debts/{debt_id}/payments", json={"amount": 600.00, "currency": "USD", "paid_date": "2026-02-15"}, headers={"X-User-Id": u})
    
    res_list_after = client.get("/api/debts", headers={"X-User-Id": u})
    assert res_list_after.get_json()[0]["is_paid_off"] is True
    assert res_list_after.get_json()[0]["remaining_balance"] == 0.0

    # 6. Delete payment 1 -> Balance auto-recalculates to $400 remaining
    res_del = client.delete(f"/api/debts/payments/{p_id}", headers={"X-User-Id": u})
    assert res_del.status_code == 200

    res_list_final = client.get("/api/debts", headers={"X-User-Id": u})
    assert res_list_final.get_json()[0]["is_paid_off"] is False
    assert res_list_final.get_json()[0]["remaining_balance"] == 400.00
