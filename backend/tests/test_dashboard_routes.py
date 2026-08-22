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
        user = User(name="Oscar", primary_currency="USD")
        db.session.add(user)
        db.session.commit()
        return user.id

def test_dashboard_api_endpoint(client, seed_user):
    u = str(seed_user)
    res = client.get("/api/dashboard?days=30", headers={"X-User-Id": u})
    assert res.status_code == 200
    data = res.get_json()
    assert "stock" in data
    assert "flow" in data
    assert "forecast" in data
    assert "budgets_overview" in data

def test_reports_summary_api_endpoint(client, seed_user):
    u = str(seed_user)
    res = client.get("/api/reports/summary", headers={"X-User-Id": u})
    assert res.status_code == 200
    data = res.get_json()
    assert data["report_type"] == "Executive Period Summary"
    assert "stock_snapshot" in data
    assert "flow_summary" in data
