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
        user = User(name="Liam", primary_currency="USD")
        db.session.add(user)
        db.session.commit()
        return user.id

def test_savings_goal_and_contribution_api_flow(client, seed_user):
    u = str(seed_user)

    # 1. Create Savings Goal with $5,000 target ($500/mo planned)
    goal_payload = {
        "name": "Japan Trip",
        "target_amount": 5000.00,
        "currency": "USD",
        "contribution_amount": 500.00,
        "period_months": 1,
        "start_date": "2026-01-01"
    }

    res = client.post("/api/savings", json=goal_payload, headers={"X-User-Id": u})
    assert res.status_code == 201
    goal_id = res.get_json()["id"]
    assert res.get_json()["progress_percent"] == 0.0

    # 2. Record Contribution ($1500)
    c_payload = {
        "amount": 1500.00,
        "currency": "USD",
        "contributed_date": "2026-01-15",
        "note": "January deposit"
    }
    res_c = client.post(f"/api/savings/{goal_id}/contributions", json=c_payload, headers={"X-User-Id": u})
    assert res_c.status_code == 201
    c_id = res_c.get_json()["id"]

    # 3. Check Savings list -> Total saved $1500, Progress 30%
    res_list = client.get("/api/savings", headers={"X-User-Id": u})
    assert res_list.status_code == 200
    goals = res_list.get_json()
    assert goals[0]["total_saved"] == 1500.00
    assert goals[0]["progress_percent"] == 30.0

    # 4. Check Savings Summary API
    res_sum = client.get("/api/savings/summary", headers={"X-User-Id": u})
    assert res_sum.status_code == 200
    summary = res_sum.get_json()
    assert summary["total_saved"] == 1500.00
    assert summary["total_planned_monthly_savings"] == 500.00
    assert summary["active_goal_count"] == 1

    # 5. Delete Contribution -> Total saved auto-recalculates to $0
    res_del = client.delete(f"/api/savings/contributions/{c_id}", headers={"X-User-Id": u})
    assert res_del.status_code == 200

    res_final = client.get("/api/savings", headers={"X-User-Id": u})
    assert res_final.get_json()[0]["total_saved"] == 0.0
    assert res_final.get_json()[0]["progress_percent"] == 0.0

def test_open_ended_savings_goal_api(client, seed_user):
    u = str(seed_user)
    payload = {
        "name": "Rainy Day Buffer",
        "target_amount": None, # Open-ended
        "currency": "USD",
        "contribution_amount": 200.00,
        "period_months": 1,
        "start_date": "2026-01-01"
    }

    res = client.post("/api/savings", json=payload, headers={"X-User-Id": u})
    assert res.status_code == 201
    assert res.get_json()["progress_percent"] is None

    goal_id = res.get_json()["id"]
    client.post(f"/api/savings/{goal_id}/contributions", json={"amount": 800.00, "currency": "USD", "contributed_date": "2026-01-20"}, headers={"X-User-Id": u})

    res_check = client.get("/api/savings", headers={"X-User-Id": u})
    assert res_check.get_json()[0]["total_saved"] == 800.00
    assert res_check.get_json()[0]["progress_percent"] is None
