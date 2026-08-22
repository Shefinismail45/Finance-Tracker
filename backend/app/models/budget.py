from datetime import datetime, timezone, date
from decimal import Decimal
from app.extensions import db

class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)

    planned_amount = db.Column(db.Numeric(12, 2), nullable=False)
    period_months = db.Column(db.Integer, nullable=False, default=1)  # 1 = Monthly, 3 = Quarterly, 12 = Yearly
    currency = db.Column(db.String(3), nullable=False, default="USD")

    start_date = db.Column(db.Date, nullable=False, default=date.today)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    category = db.relationship("Category", backref="budgets", lazy=True)

    __table_args__ = (
        db.UniqueConstraint("user_id", "category_id", "period_months", name="uq_budget_user_category_period"),
    )

    @property
    def period_label(self) -> str:
        labels = {
            1: "Monthly",
            3: "Quarterly",
            6: "Half-Yearly",
            12: "Yearly"
        }
        return labels.get(self.period_months, f"Every {self.period_months} months")

    def to_dict(self):
        planned = float(self.planned_amount) if self.planned_amount is not None else None
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "planned_amount": planned,
            "period_months": self.period_months,
            "period_label": self.period_label,
            "currency": self.currency,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
