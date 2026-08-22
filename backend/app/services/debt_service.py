from decimal import Decimal
from datetime import date, datetime, timezone
from app.extensions import db
from app.models import User, Debt, DebtPayment

VALID_DEBT_TYPES = {"credit_card", "loan", "other", "no_interest"}

class DebtValidationError(ValueError):
    """Raised when debt domain rules are violated."""
    pass

class DebtNotFoundError(Exception):
    """Raised when a debt or payment record is not found or not owned by user."""
    pass

def create_debt(
    user_id: int,
    name: str,
    debt_type: str,
    principal_amount: Decimal,
    currency: str,
    start_date: date,
    interest_rate: Decimal = Decimal("0.00"),
    note: str = None
) -> Debt:
    """
    Creates a new debt entry after enforcing domain rules.
    """
    if principal_amount <= Decimal("0"):
        raise DebtValidationError("Principal amount must be greater than zero.")

    if debt_type not in VALID_DEBT_TYPES:
        raise DebtValidationError(f"Invalid debt_type '{debt_type}'. Must be one of {list(VALID_DEBT_TYPES)}.")

    if interest_rate < Decimal("0.00") or interest_rate > Decimal("100.00"):
        raise DebtValidationError("Interest rate must be between 0.00% and 100.00%.")

    if debt_type == "no_interest" and interest_rate != Decimal("0.00"):
        raise DebtValidationError("No-interest debts must have an interest rate of 0.00%.")

    user = db.session.get(User, user_id)
    if not user:
        raise DebtValidationError(f"User {user_id} does not exist.")

    debt = Debt(
        user_id=user_id,
        name=name.strip(),
        debt_type=debt_type,
        principal_amount=principal_amount,
        interest_rate=interest_rate,
        currency=currency.upper(),
        start_date=start_date,
        note=note.strip() if note else None
    )

    db.session.add(debt)
    db.session.commit()
    return debt

def get_debts(user_id: int, status_filter: str = None) -> list[Debt]:
    """
    Retrieves debts for user_id sorted by Debt Avalanche priority:
    Active debts first (sorted by highest interest rate, then highest balance),
    followed by paid-off debts at the bottom.
    """
    debts = db.session.query(Debt).filter(Debt.user_id == user_id).all()

    if status_filter == "active":
        debts = [d for d in debts if not d.is_paid_off]
    elif status_filter == "paid_off":
        debts = [d for d in debts if d.is_paid_off]

    # Avalanche Sort: Active (False) before Paid Off (True), then highest interest rate, then highest balance
    return sorted(
        debts,
        key=lambda d: (d.is_paid_off, -d.interest_rate, -d.remaining_balance)
    )

def add_payment(
    debt_id: int,
    user_id: int,
    amount: Decimal,
    currency: str,
    paid_date: date,
    note: str = None
) -> DebtPayment:
    """
    Logs an individual payment against a debt.
    """
    if amount <= Decimal("0"):
        raise DebtValidationError("Payment amount must be greater than zero.")

    debt = db.session.query(Debt).filter(Debt.id == debt_id, Debt.user_id == user_id).first()
    if not debt:
        raise DebtNotFoundError(f"Debt {debt_id} not found for user {user_id}.")

    from app.services.currency_service import convert_amount, get_user_primary_currency
    primary_curr = get_user_primary_currency(user_id)
    converted_amt, _, _, _ = convert_amount(amount, currency, primary_curr)

    payment = DebtPayment(
        debt_id=debt_id,
        amount=amount,
        currency=currency.upper(),
        converted_amount=converted_amt,
        paid_date=paid_date,
        note=note.strip() if note else None
    )

    db.session.add(payment)
    db.session.commit()
    return payment

def get_payments(debt_id: int, user_id: int) -> list[DebtPayment]:
    """
    Retrieves payment history for a specific debt.
    """
    debt = db.session.query(Debt).filter(Debt.id == debt_id, Debt.user_id == user_id).first()
    if not debt:
        raise DebtNotFoundError(f"Debt {debt_id} not found for user {user_id}.")

    return db.session.query(DebtPayment).filter(DebtPayment.debt_id == debt_id)\
        .order_by(DebtPayment.paid_date.desc(), DebtPayment.created_at.desc()).all()

def delete_payment(payment_id: int, user_id: int) -> bool:
    """
    Deletes a payment record owned by user_id.
    """
    payment = db.session.query(DebtPayment).join(Debt)\
        .filter(DebtPayment.id == payment_id, Debt.user_id == user_id).first()

    if not payment:
        raise DebtNotFoundError(f"Payment {payment_id} not found for user {user_id}.")

    db.session.delete(payment)
    db.session.commit()
    return True

def get_debt_summary(user_id: int) -> dict:
    """
    Computes overall debt totals and status counts for user_id.
    """
    debts = db.session.query(Debt).filter(Debt.user_id == user_id).all()

    total_principal = sum(float(d.principal_amount) for d in debts)
    total_paid = sum(d.total_paid for d in debts)
    total_remaining = sum(d.remaining_balance for d in debts)

    active_count = sum(1 for d in debts if not d.is_paid_off)
    paid_off_count = sum(1 for d in debts if d.is_paid_off)

    return {
        "total_principal": round(total_principal, 2),
        "total_paid": round(total_paid, 2),
        "total_remaining": round(total_remaining, 2),
        "active_debt_count": active_count,
        "paid_off_count": paid_off_count
    }

def update_debt(debt_id: int, user_id: int, **kwargs) -> Debt:
    """
    Updates an existing debt record owned by user_id.
    """
    debt = db.session.query(Debt).filter(Debt.id == debt_id, Debt.user_id == user_id).first()
    if not debt:
        raise DebtNotFoundError(f"Debt {debt_id} not found for user {user_id}.")

    if "principal_amount" in kwargs:
        princ = Decimal(str(kwargs["principal_amount"]))
        if princ <= Decimal("0"):
            raise DebtValidationError("Principal amount must be greater than zero.")
        debt.principal_amount = princ

    if "debt_type" in kwargs:
        dt = kwargs["debt_type"]
        if dt not in VALID_DEBT_TYPES:
            raise DebtValidationError(f"Invalid debt_type '{dt}'.")
        debt.debt_type = dt

    if "interest_rate" in kwargs:
        ir = Decimal(str(kwargs["interest_rate"]))
        if ir < Decimal("0.00") or ir > Decimal("100.00"):
            raise DebtValidationError("Interest rate must be between 0.00% and 100.00%.")
        debt.interest_rate = ir

    if debt.debt_type == "no_interest" and debt.interest_rate != Decimal("0.00"):
        raise DebtValidationError("No-interest debts must have an interest rate of 0.00%.")

    if "name" in kwargs:
        debt.name = kwargs["name"].strip()

    if "currency" in kwargs:
        debt.currency = kwargs["currency"].upper()

    if "start_date" in kwargs:
        debt.start_date = kwargs["start_date"]

    if "note" in kwargs:
        debt.note = kwargs["note"].strip() if kwargs["note"] else None

    db.session.commit()
    return debt

def delete_debt(debt_id: int, user_id: int) -> bool:
    """
    Deletes a debt record and all its associated payments.
    """
    debt = db.session.query(Debt).filter(Debt.id == debt_id, Debt.user_id == user_id).first()
    if not debt:
        raise DebtNotFoundError(f"Debt {debt_id} not found for user {user_id}.")

    db.session.delete(debt)
    db.session.commit()
    return True
