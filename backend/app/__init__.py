from flask import Flask
from app.config import Config
from app.extensions import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)

    from app.routes.expense import expense_bp
    from app.routes.income import income_bp
    from app.routes.debt import debt_bp
    from app.routes.savings import savings_bp
    from app.routes.budget import budget_bp
    from app.routes.dashboard import dashboard_bp
    app.register_blueprint(expense_bp)
    app.register_blueprint(income_bp)
    app.register_blueprint(debt_bp)
    app.register_blueprint(savings_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(dashboard_bp)

    @app.route("/health")
    def health_check():
        return {"status": "ok"}

    return app
