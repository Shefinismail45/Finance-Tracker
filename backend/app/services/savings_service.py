from decimal import Decimal
from datetime import date, datetime, timezone
from app.extensions import db
from app.models import User, SavingsGoal, SavingsContribution

class SavingsValidationError(ValueError):
    """Raised when savings domain rules are violated."""
    pass

class SavingsNotFoundError(Exception):
    """Raised when a savings goal or contribution record is not found or not owned by user."""
    pass

def create_savings_goal(
    user_id: int,
    name: str,
    currency: str,
    contribution_amount: Decimal,
    period_months: int,
    start_date: date,
    target_amount: Decimal = None,
    end_date: date = None,
    is_active: bool = True,
    note: str = None
) -> SavingsGoal:
    """
    Creates a new savings goal after enforcing domain rules.
    """
    if contribution_amount <= Decimal("0"):
        raise SavingsValidationError("Planned contribution amount must be greater than zero.")

    if period_months < 1:
        raise SavingsValidationError("Period in months must be at least 1.")

    if target_amount is not None and target_amount <= Decimal("0"):
        raise SavingsValidationError("Target amount, if provided, must be greater than zero.")

    if end_date and end_date < start_date:
        raise SavingsValidationError("End date cannot be earlier than start date.")

    user = db.session.get(User, user_id)
    if not user:
        raise SavingsValidationError(f"User {user_id} does not exist.")

    goal = SavingsGoal(
        user_id=user_id,
        name=name.strip(),
        target_amount=target_amount,
        currency=currency.upper(),
        contribution_amount=contribution_amount,
        period_months=period_months,
        start_date=start_date,
        end_date=end_date,
        is_active=is_active,
        note=note.strip() if note else None
    )

    db.session.add(goal)
    db.session.commit()
    return goal

def get_savings_goals(user_id: int, active_only: bool = False) -> list[SavingsGoal]:
    """
    Retrieves savings goals for user_id.
    """
    query = db.session.query(SavingsGoal).filter(SavingsGoal.user_id == user_id)
    if active_only:
        query = query.filter(SavingsGoal.is_active.is_(True))

    goals = query.all()
    # Sort active goals first, then by name
    return sorted(goals, key=lambda g: (not g.is_active, g.name))

def add_contribution(
    savings_goal_id: int,
    user_id: int,
    amount: Decimal,
    currency: str,
    contributed_date: date,
    note: str = None
) -> SavingsContribution:
    """
    Logs an individual contribution deposit against a savings goal.
    """
    if amount <= Decimal("0"):
        raise SavingsValidationError("Contribution amount must be greater than zero.")

    goal = db.session.query(SavingsGoal).filter(
        SavingsGoal.id == savings_goal_id,
        SavingsGoal.user_id == user_id
    ).first()

    if not goal:
        raise SavingsNotFoundError(f"Savings goal {savings_goal_id} not found for user {user_id}.")

    from app.services.currency_service import convert_amount, get_user_primary_currency
    primary_curr = get_user_primary_currency(user_id)
    converted_amt, _, _, _ = convert_amount(amount, currency, primary_curr)

    contribution = SavingsContribution(
        savings_goal_id=savings_goal_id,
        amount=amount,
        currency=currency.upper(),
        converted_amount=converted_amt,
        contributed_date=contributed_date,
        note=note.strip() if note else None
    )

    db.session.add(contribution)
    db.session.commit()
    return contribution

def get_contributions(savings_goal_id: int, user_id: int) -> list[SavingsContribution]:
    """
    Retrieves contribution deposit history for a specific savings goal.
    """
    goal = db.session.query(SavingsGoal).filter(
        SavingsGoal.id == savings_goal_id,
        SavingsGoal.user_id == user_id
    ).first()

    if not goal:
        raise SavingsNotFoundError(f"Savings goal {savings_goal_id} not found for user {user_id}.")

    return db.session.query(SavingsContribution).filter(
        SavingsContribution.savings_goal_id == savings_goal_id
    ).order_by(SavingsContribution.contributed_date.desc(), SavingsContribution.created_at.desc()).all()

def delete_contribution(contribution_id: int, user_id: int) -> bool:
    """
    Deletes a contribution deposit record owned by user_id.
    """
    contribution = db.session.query(SavingsContribution).join(SavingsGoal)\
        .filter(SavingsContribution.id == contribution_id, SavingsGoal.user_id == user_id).first()

    if not contribution:
        raise SavingsNotFoundError(f"Contribution {contribution_id} not found for user {user_id}.")

    db.session.delete(contribution)
    db.session.commit()
    return True

def get_savings_summary(user_id: int) -> dict:
    """
    Computes overall savings totals and total planned monthly contribution commitment.
    """
    goals = db.session.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id,
        SavingsGoal.is_active.is_(True)
    ).all()

    total_saved = sum(g.total_saved for g in goals)
    total_planned_monthly_savings = sum(g.monthly_planned_contribution for g in goals)
    target_reached_count = sum(
        1 for g in goals if g.target_amount is not None and g.total_saved >= float(g.target_amount)
    )

    return {
        "total_saved": round(total_saved, 2),
        "total_planned_monthly_savings": round(total_planned_monthly_savings, 2),
        "active_goal_count": len(goals),
        "target_reached_count": target_reached_count
    }

def update_savings_goal(goal_id: int, user_id: int, **kwargs) -> SavingsGoal:
    """
    Updates an existing savings goal owned by user_id.
    """
    goal = db.session.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == user_id
    ).first()

    if not goal:
        raise SavingsNotFoundError(f"Savings goal {goal_id} not found for user {user_id}.")

    if "contribution_amount" in kwargs:
        ca = Decimal(str(kwargs["contribution_amount"]))
        if ca <= Decimal("0"):
            raise SavingsValidationError("Contribution amount must be greater than zero.")
        goal.contribution_amount = ca

    if "period_months" in kwargs:
        pm = int(kwargs["period_months"])
        if pm < 1:
            raise SavingsValidationError("Period in months must be at least 1.")
        goal.period_months = pm

    if "target_amount" in kwargs:
        if kwargs["target_amount"] is None:
            goal.target_amount = None
        else:
            ta = Decimal(str(kwargs["target_amount"]))
            if ta <= Decimal("0"):
                raise SavingsValidationError("Target amount must be greater than zero.")
            goal.target_amount = ta

    if "name" in kwargs:
        goal.name = kwargs["name"].strip()

    if "currency" in kwargs:
        goal.currency = kwargs["currency"].upper()

    if "start_date" in kwargs:
        goal.start_date = kwargs["start_date"]

    if "end_date" in kwargs:
        goal.end_date = kwargs["end_date"]

    if goal.end_date and goal.start_date and goal.end_date < goal.start_date:
        raise SavingsValidationError("End date cannot be earlier than start date.")

    if "is_active" in kwargs:
        goal.is_active = bool(kwargs["is_active"])

    if "note" in kwargs:
        goal.note = kwargs["note"].strip() if kwargs["note"] else None

    db.session.commit()
    return goal

def delete_savings_goal(goal_id: int, user_id: int) -> bool:
    """
    Deletes a savings goal and all its logged contributions.
    """
    goal = db.session.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == user_id
    ).first()

    if not goal:
        raise SavingsNotFoundError(f"Savings goal {goal_id} not found for user {user_id}.")

    db.session.delete(goal)
    db.session.commit()
    return True
