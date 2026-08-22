from datetime import datetime, timezone, date
from decimal import Decimal
from app.extensions import db

class Income(db.Model):
    __tablename__ = "incomes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)

    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)

    exchange_rate = db.Column(db.Numeric(14, 6), nullable=True)
    converted_amount = db.Column(db.Numeric(14, 2), nullable=True)

    period_months = db.Column(db.Integer, nullable=False)  # 1, 3, 6, 12, or custom N
    start_date = db.Column(db.Date, nullable=False)        # date-granularity
    end_date = db.Column(db.Date, nullable=True)          # date-granularity, null means ongoing
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    note = db.Column(db.String(255), nullable=True)

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

    category = db.relationship("Category", backref="incomes", lazy=True)

    @property
    def monthly_equivalent(self) -> float:
        if not self.amount or not self.period_months:
            return 0.0
        amt = float(self.converted_amount) if self.converted_amount is not None else float(self.amount)
        return round(amt / self.period_months, 2)

    @property
    def period_label(self) -> str:
        labels = {
            1: "Monthly",
            3: "Quarterly",
            6: "Half-yearly",
            12: "Yearly"
        }
        return labels.get(self.period_months, f"Every {self.period_months} months")

    def is_active_on(self, target_date: date) -> bool:
        """
        Determines if this income stream was active on a specific target date.
        """
        if self.start_date and target_date < self.start_date:
            return False
        if self.end_date and target_date > self.end_date:
            return False
        return self.is_active

    def to_dict(self):
        amt = float(self.amount) if self.amount is not None else None
        conv_amt = float(self.converted_amount) if self.converted_amount is not None else amt
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "amount": amt,
            "currency": self.currency,
            "exchange_rate": float(self.exchange_rate) if self.exchange_rate is not None else None,
            "converted_amount": conv_amt,
            "period_months": self.period_months,
            "period_label": self.period_label,
            "monthly_equivalent": self.monthly_equivalent,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
