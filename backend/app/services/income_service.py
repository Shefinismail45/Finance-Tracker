from decimal import Decimal
from datetime import date, datetime, timezone
from sqlalchemy import or_
from app.extensions import db
from app.models import User, Category, Income

class IncomeValidationError(ValueError):
    """Raised when income domain rules are violated."""
    pass

class IncomeNotFoundError(Exception):
    """Raised when an income record is not found or not owned by user."""
    pass

def validate_income_category(user_id: int, category_id: int) -> Category:
    """
    Validates that a category exists, is accessible by user_id, AND has kind == 'income'.
    """
    category = db.session.query(Category).filter(
        Category.id == category_id,
        Category.kind == "income",
        or_(Category.user_id == user_id, Category.user_id.is_(None))
    ).first()

    if not category:
        raise IncomeValidationError(
            f"Category {category_id} does not exist, is not an income category, or is not available for user {user_id}."
        )
    return category

def create_income(
    user_id: int,
    category_id: int,
    amount: Decimal,
    currency: str,
    period_months: int,
    start_date: date,
    end_date: date = None,
    is_active: bool = True,
    note: str = None
) -> Income:
    """
    Creates a new income record after enforcing domain rules.
    """
    if amount <= Decimal("0"):
        raise IncomeValidationError("Income amount must be greater than zero.")

    if period_months < 0:
        raise IncomeValidationError("Period in months must be at least 0.")

    if end_date and end_date < start_date:
        raise IncomeValidationError("End date cannot be earlier than start date.")

    user = db.session.get(User, user_id)
    if not user:
        raise IncomeValidationError(f"User {user_id} does not exist.")

    validate_income_category(user_id, category_id)

    from app.services.currency_service import convert_amount, get_user_primary_currency
    primary_curr = get_user_primary_currency(user_id)
    converted_amt, _, _, _ = convert_amount(amount, currency, primary_curr)

    income = Income(
        user_id=user_id,
        category_id=category_id,
        amount=amount,
        currency=currency.upper(),
        converted_amount=converted_amt,
        period_months=period_months,
        start_date=start_date,
        end_date=end_date,
        is_active=is_active,
        note=note.strip() if note else None
    )

    db.session.add(income)
    db.session.commit()
    return income

def get_incomes(
    user_id: int,
    category_id: int = None,
    active_only: bool = False,
    target_date: date = None
) -> list[Income]:
    """
    Retrieves income streams for a user with optional filters.
    """
    query = db.session.query(Income).filter(Income.user_id == user_id)

    if category_id is not None:
        query = query.filter(Income.category_id == category_id)

    if active_only:
        query = query.filter(Income.is_active.is_(True))

    if target_date is not None:
        query = query.filter(
            Income.start_date <= target_date,
            or_(Income.end_date.is_(None), Income.end_date >= target_date)
        )

    return query.order_by(Income.start_date.desc()).all()

def get_income_summary(user_id: int, target_date: date = None) -> dict:
    """
    Computes total normalized monthly income, actual total received, and category breakdowns.
    """
    if target_date is None:
        target_date = date.today()

    all_incomes = get_incomes(user_id=user_id, active_only=False)
    active_incomes = get_incomes(user_id=user_id, active_only=True, target_date=target_date)

    total_received = sum(
        float(inc.converted_amount if inc.converted_amount is not None else inc.amount)
        for inc in all_incomes
    )
    total_monthly_income = sum(inc.monthly_equivalent for inc in active_incomes if inc.period_months > 0)

    category_map = {}
    for inc in all_incomes:
        cat_name = inc.category.name if inc.category else "Uncategorized"
        if cat_name not in category_map:
            category_map[cat_name] = {
                "category_id": inc.category_id,
                "category_name": cat_name,
                "total_received": 0.0,
                "monthly_amount": 0.0,
                "stream_count": 0
            }
        amt = float(inc.converted_amount if inc.converted_amount is not None else inc.amount)
        category_map[cat_name]["total_received"] = round(category_map[cat_name]["total_received"] + amt, 2)
        category_map[cat_name]["stream_count"] += 1
        if inc.is_active and inc.period_months > 0 and inc.is_active_on(target_date):
            category_map[cat_name]["monthly_amount"] = round(
                category_map[cat_name]["monthly_amount"] + inc.monthly_equivalent, 2
            )

    return {
        "target_date": target_date.isoformat(),
        "total_received": round(total_received, 2),
        "total_monthly_income": round(total_monthly_income, 2),
        "total_streams_count": len(all_incomes),
        "active_streams_count": len(active_incomes),
        "categories": list(category_map.values())
    }

def update_income(income_id: int, user_id: int, **kwargs) -> Income:
    """
    Updates an existing income stream owned by user_id.
    """
    income = db.session.query(Income).filter(
        Income.id == income_id,
        Income.user_id == user_id
    ).first()

    if not income:
        raise IncomeNotFoundError(f"Income stream {income_id} not found for user {user_id}.")

    if "amount" in kwargs:
        amt = Decimal(str(kwargs["amount"]))
        if amt <= Decimal("0"):
            raise IncomeValidationError("Amount must be greater than zero.")
        income.amount = amt
        income.converted_amount = amt

    if "period_months" in kwargs:
        pm = int(kwargs["period_months"])
        if pm < 0:
            raise IncomeValidationError("Period in months must be at least 0.")
        income.period_months = pm

    if "category_id" in kwargs:
        cat_id = int(kwargs["category_id"])
        validate_income_category(user_id, cat_id)
        income.category_id = cat_id

    if "currency" in kwargs:
        income.currency = str(kwargs["currency"]).upper()

    if "start_date" in kwargs:
        income.start_date = kwargs["start_date"]

    if "end_date" in kwargs:
        income.end_date = kwargs["end_date"]

    if income.end_date and income.start_date and income.end_date < income.start_date:
        raise IncomeValidationError("End date cannot be earlier than start date.")

    if "is_active" in kwargs:
        income.is_active = bool(kwargs["is_active"])

    if "note" in kwargs:
        income.note = kwargs["note"].strip() if kwargs["note"] else None

    db.session.commit()
    return income

def delete_income(income_id: int, user_id: int) -> bool:
    """
    Deletes an income stream record owned by user_id.
    """
    income = db.session.query(Income).filter(
        Income.id == income_id,
        Income.user_id == user_id
    ).first()

    if not income:
        raise IncomeNotFoundError(f"Income stream {income_id} not found for user {user_id}.")

    db.session.delete(income)
    db.session.commit()
    return True
