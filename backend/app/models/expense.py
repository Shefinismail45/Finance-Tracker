from datetime import datetime, timezone
from app.extensions import db

class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)

    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)

    exchange_rate = db.Column(db.Numeric(14, 6), nullable=True)
    converted_amount = db.Column(db.Numeric(14, 2), nullable=True)

    note = db.Column(db.String(255), nullable=True)

    occurred_at = db.Column(db.DateTime(timezone=True), nullable=False)
    is_recurring = db.Column(db.Boolean, nullable=False, default=False)

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

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "amount": float(self.amount) if self.amount is not None else None,
            "currency": self.currency,
            "exchange_rate": float(self.exchange_rate) if self.exchange_rate is not None else None,
            "converted_amount": float(self.converted_amount) if self.converted_amount is not None else (float(self.amount) if self.amount is not None else None),
            "note": self.note,
            "occurred_at": self.occurred_at.isoformat() if self.occurred_at else None,
            "is_recurring": self.is_recurring,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
