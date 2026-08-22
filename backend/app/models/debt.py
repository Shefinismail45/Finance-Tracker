from datetime import datetime, timezone, date
from decimal import Decimal
from app.extensions import db

class Debt(db.Model):
    __tablename__ = "debts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    name = db.Column(db.String(100), nullable=False)
    debt_type = db.Column(db.String(20), nullable=False)  # 'credit_card' | 'loan' | 'other' | 'no_interest'

    principal_amount = db.Column(db.Numeric(12, 2), nullable=False)
    interest_rate = db.Column(db.Numeric(5, 2), nullable=False, default=0.00)  # APR e.g. 18.50
    currency = db.Column(db.String(3), nullable=False)

    start_date = db.Column(db.Date, nullable=False)
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

    payments = db.relationship("DebtPayment", backref="debt", lazy=True, cascade="all, delete-orphan")

    @property
    def total_paid(self) -> float:
        paid = sum(float(p.converted_amount if p.converted_amount is not None else p.amount) for p in self.payments)
        return round(paid, 2)

    @property
    def remaining_balance(self) -> float:
        princ = float(self.principal_amount)
        rem = princ - self.total_paid
        return round(max(0.0, rem), 2)

    @property
    def is_paid_off(self) -> bool:
        return self.total_paid >= float(self.principal_amount)

    def to_dict(self):
        princ = float(self.principal_amount) if self.principal_amount is not None else None
        ir = float(self.interest_rate) if self.interest_rate is not None else 0.0
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "debt_type": self.debt_type,
            "principal_amount": princ,
            "interest_rate": ir,
            "currency": self.currency,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "note": self.note,
            "total_paid": self.total_paid,
            "remaining_balance": self.remaining_balance,
            "is_paid_off": self.is_paid_off,
            "payment_count": len(self.payments),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class DebtPayment(db.Model):
    __tablename__ = "debt_payments"

    id = db.Column(db.Integer, primary_key=True)
    debt_id = db.Column(db.Integer, db.ForeignKey("debts.id"), nullable=False, index=True)

    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)

    exchange_rate = db.Column(db.Numeric(14, 6), nullable=True)
    converted_amount = db.Column(db.Numeric(14, 2), nullable=True)

    paid_date = db.Column(db.Date, nullable=False)
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
            "debt_id": self.debt_id,
            "amount": amt,
            "currency": self.currency,
            "exchange_rate": float(self.exchange_rate) if self.exchange_rate is not None else None,
            "converted_amount": conv_amt,
            "paid_date": self.paid_date.isoformat() if self.paid_date else None,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
