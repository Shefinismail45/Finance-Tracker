from datetime import datetime, timezone, date
from decimal import Decimal
from app.extensions import db

class SavingsGoal(db.Model):
    __tablename__ = "savings_goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Numeric(12, 2), nullable=True)  # None = open-ended goal
    currency = db.Column(db.String(3), nullable=False)

    contribution_amount = db.Column(db.Numeric(12, 2), nullable=False)  # planned, per period
    period_months = db.Column(db.Integer, nullable=False, default=1)

    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
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

    contributions = db.relationship("SavingsContribution", backref="goal", lazy=True, cascade="all, delete-orphan")

    @property
    def total_saved(self) -> float:
        total = sum(float(c.converted_amount if c.converted_amount is not None else c.amount) for c in self.contributions)
        return round(total, 2)

    @property
    def progress_percent(self) -> float | None:
        if self.target_amount is None or float(self.target_amount) <= 0:
            return None
        pct = (self.total_saved / float(self.target_amount)) * 100.0
        return round(min(100.0, pct), 1)

    @property
    def monthly_planned_contribution(self) -> float:
        if not self.contribution_amount or not self.period_months:
            return 0.0
        return round(float(self.contribution_amount) / self.period_months, 2)

    def to_dict(self):
        target = float(self.target_amount) if self.target_amount is not None else None
        planned = float(self.contribution_amount) if self.contribution_amount is not None else None
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "target_amount": target,
            "currency": self.currency,
            "contribution_amount": planned,
            "period_months": self.period_months,
            "monthly_planned_contribution": self.monthly_planned_contribution,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "note": self.note,
            "total_saved": self.total_saved,
            "progress_percent": self.progress_percent,
            "contribution_count": len(self.contributions),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class SavingsContribution(db.Model):
    __tablename__ = "savings_contributions"

    id = db.Column(db.Integer, primary_key=True)
    savings_goal_id = db.Column(db.Integer, db.ForeignKey("savings_goals.id"), nullable=False, index=True)

    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)

    exchange_rate = db.Column(db.Numeric(14, 6), nullable=True)
    converted_amount = db.Column(db.Numeric(14, 2), nullable=True)

    contributed_date = db.Column(db.Date, nullable=False)
    note = db.Column(db.String(255), nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        amt = float(self.amount) if self.amount is not None else None
        conv_amt = float(self.converted_amount) if self.converted_amount is not None else amt
        return {
            "id": self.id,
            "savings_goal_id": self.savings_goal_id,
            "amount": amt,
            "currency": self.currency,
            "exchange_rate": float(self.exchange_rate) if self.exchange_rate is not None else None,
            "converted_amount": conv_amt,
            "contributed_date": self.contributed_date.isoformat() if self.contributed_date else None,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
