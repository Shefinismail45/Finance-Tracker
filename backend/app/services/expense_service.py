from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import func, or_
from app.extensions import db
from app.models import User, Category, Expense

class ExpenseValidationError(ValueError):
    """Custom exception raised for expense domain validation failures."""
    pass

class ExpenseNotFoundError(Exception):
    """Custom exception raised when an expense is not found or not owned by user."""
    pass

def validate_category_ownership(user_id: int, category_id: int) -> Category:
    """
    Validates that a category exists and is either:
    1. A system default category (user_id IS NULL), OR
    2. A custom category owned by the requesting user (user_id == user_id).
    """
    category = db.session.query(Category).filter(
        Category.id == category_id,
        or_(Category.user_id == user_id, Category.user_id.is_(None))
    ).first()

    if not category:
        raise ExpenseValidationError(
            f"Category {category_id} does not exist or is not available for user {user_id}."
        )
    return category

def create_expense(
    user_id: int,
    category_id: int,
    amount: Decimal,
    currency: str,
    occurred_at: datetime,
    note: str = None,
    is_recurring: bool = False
) -> Expense:
    """
    Creates a new expense record after validating domain constraints.
    """
    # 1. Domain Validation: Amount must be positive
    if amount <= Decimal("0"):
        raise ExpenseValidationError("Expense amount must be greater than zero.")

    # 2. Domain Validation: User must exist
    user = db.session.get(User, user_id)
    if not user:
        raise ExpenseValidationError(f"User {user_id} does not exist.")

    # 3. Domain Validation: Category must be valid and accessible for this user
    validate_category_ownership(user_id, category_id)

    # 4. Handle timezone for occurred_at
    if occurred_at.tzinfo is None:
        occurred_at = occurred_at.replace(tzinfo=timezone.utc)

    # 5. Snapshot converted amount (defaults to amount when currency is primary or un-converted)
    from app.services.currency_service import convert_amount, get_user_primary_currency
    primary_curr = get_user_primary_currency(user_id)
    converted_amt, exchange_rate, is_fallback, _ = convert_amount(amount, currency, primary_curr)

    expense = Expense(
        user_id=user_id,
        category_id=category_id,
        amount=amount,
        currency=currency.upper(),
        converted_amount=converted_amt,
        note=note.strip() if note else None,
        occurred_at=occurred_at,
        is_recurring=is_recurring
    )

    db.session.add(expense)
    db.session.commit()
    return expense

def get_expenses(
    user_id: int,
    category_id: int = None,
    start_date: datetime = None,
    end_date: datetime = None
) -> list[Expense]:
    """
    Retrieves expenses for a given user, with optional category and date filtering.
    """
    query = db.session.query(Expense).filter(Expense.user_id == user_id)

    if category_id is not None:
        query = query.filter(Expense.category_id == category_id)

    if start_date is not None:
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        query = query.filter(Expense.occurred_at >= start_date)

    if end_date is not None:
        if end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)
        query = query.filter(Expense.occurred_at <= end_date)

    return query.order_by(Expense.occurred_at.desc()).all()

def get_category_totals(
    user_id: int,
    start_date: datetime = None,
    end_date: datetime = None
) -> list[dict]:
    """
    Computes category totals dynamically on-demand from the transaction log.
    """
    query = db.session.query(
        Category.id.label("category_id"),
        Category.name.label("category_name"),
        Category.icon.label("category_icon"),
        func.sum(Expense.amount).label("total_amount"),
        func.count(Expense.id).label("transaction_count")
    ).join(Expense, Expense.category_id == Category.id)\
     .filter(Expense.user_id == user_id)

    if start_date is not None:
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        query = query.filter(Expense.occurred_at >= start_date)

    if end_date is not None:
        if end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)
        query = query.filter(Expense.occurred_at <= end_date)

    results = query.group_by(Category.id, Category.name, Category.icon).all()

    return [
        {
            "category_id": row.category_id,
            "category_name": row.category_name,
            "category_icon": row.category_icon,
            "total_amount": float(row.total_amount) if row.total_amount else 0.0,
            "transaction_count": row.transaction_count
        }
        for row in results
    ]

def update_expense(
    expense_id: int,
    user_id: int,
    **kwargs
) -> Expense:
    """
    Updates an existing expense record owned by user_id.
    """
    expense = db.session.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user_id
    ).first()

    if not expense:
        raise ExpenseNotFoundError(f"Expense {expense_id} not found for user {user_id}.")

    if "amount" in kwargs:
        new_amount = Decimal(str(kwargs["amount"]))
        if new_amount <= Decimal("0"):
            raise ExpenseValidationError("Expense amount must be greater than zero.")
        expense.amount = new_amount
        expense.converted_amount = new_amount

    if "category_id" in kwargs:
        new_cat_id = kwargs["category_id"]
        validate_category_ownership(user_id, new_cat_id)
        expense.category_id = new_cat_id

    if "currency" in kwargs:
        expense.currency = kwargs["currency"].upper()

    if "occurred_at" in kwargs:
        dt = kwargs["occurred_at"]
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        expense.occurred_at = dt

    if "note" in kwargs:
        expense.note = kwargs["note"].strip() if kwargs["note"] else None

    if "is_recurring" in kwargs:
        expense.is_recurring = bool(kwargs["is_recurring"])

    db.session.commit()
    return expense

def delete_expense(expense_id: int, user_id: int) -> bool:
    """
    Deletes an expense record owned by user_id.
    """
    expense = db.session.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user_id
    ).first()

    if not expense:
        raise ExpenseNotFoundError(f"Expense {expense_id} not found for user {user_id}.")

    db.session.delete(expense)
    db.session.commit()
    return True
