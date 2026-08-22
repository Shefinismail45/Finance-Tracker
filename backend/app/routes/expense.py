from flask import Blueprint, request, jsonify
from datetime import datetime
from decimal import Decimal, InvalidOperation
from app.extensions import db
from app.models import User, Category
from app.services.expense_service import (
    create_expense,
    get_expenses,
    get_category_totals,
    update_expense,
    delete_expense,
    ExpenseValidationError,
    ExpenseNotFoundError
)

expense_bp = Blueprint("expense", __name__, url_prefix="/api")

def get_current_user_id() -> int:
    """
    Seam for user identity extraction.
    In v1: reads X-User-Id header, falling back to a default dev user if not provided.
    In v2: will decode Authorization Bearer token.
    """
    user_id_header = request.headers.get("X-User-Id")
    if user_id_header and user_id_header.isdigit():
        return int(user_id_header)

    # Dev fallback for v1: ensure a default user exists
    user = db.session.query(User).first()
    if not user:
        user = User(name="Default User", primary_currency="USD")
        db.session.add(user)
        db.session.commit()
    return user.id

@expense_bp.route("/categories", methods=["GET"])
def list_categories():
    user_id = get_current_user_id()
    kind = request.args.get("kind")

    query = db.session.query(Category).filter(
        (Category.user_id == user_id) | (Category.user_id.is_(None))
    )

    if kind:
        query = query.filter(Category.kind == kind)

    categories = query.all()
    return jsonify([c.to_dict() for c in categories]), 200

@expense_bp.route("/expenses", methods=["POST"])
def add_expense():
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    required_fields = ["category_id", "amount", "currency", "occurred_at"]
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({"error": f"Missing required field: '{field}'."}), 400

    try:
        amount = Decimal(str(data["amount"]))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "Field 'amount' must be a valid numeric value."}), 400

    try:
        occurred_at = datetime.fromisoformat(str(data["occurred_at"]))
    except (ValueError, TypeError):
        return jsonify({"error": "Field 'occurred_at' must be a valid ISO format date/time string."}), 400

    try:
        expense = create_expense(
            user_id=user_id,
            category_id=int(data["category_id"]),
            amount=amount,
            currency=str(data["currency"]),
            occurred_at=occurred_at,
            note=data.get("note"),
            is_recurring=bool(data.get("is_recurring", False))
        )

        from app.services.budget_service import check_expense_budget_warning
        warning = check_expense_budget_warning(user_id=user_id, category_id=expense.category_id, expense_date=expense.occurred_at)

        response_payload = expense.to_dict()
        response_payload["budget_warning"] = warning

        return jsonify(response_payload), 201
    except ExpenseValidationError as e:
        return jsonify({"error": str(e)}), 422

@expense_bp.route("/expenses", methods=["GET"])
def list_expenses():
    user_id = get_current_user_id()

    category_id_param = request.args.get("category_id")
    category_id = int(category_id_param) if category_id_param and category_id_param.isdigit() else None

    start_date = None
    if request.args.get("start_date"):
        try:
            start_date = datetime.fromisoformat(request.args.get("start_date"))
        except ValueError:
            return jsonify({"error": "Invalid start_date format."}), 400

    end_date = None
    if request.args.get("end_date"):
        try:
            end_date = datetime.fromisoformat(request.args.get("end_date"))
        except ValueError:
            return jsonify({"error": "Invalid end_date format."}), 400

    expenses = get_expenses(
        user_id=user_id,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date
    )
    return jsonify([e.to_dict() for e in expenses]), 200

@expense_bp.route("/expenses/category-totals", methods=["GET"])
def category_totals():
    user_id = get_current_user_id()

    start_date = None
    if request.args.get("start_date"):
        try:
            start_date = datetime.fromisoformat(request.args.get("start_date"))
        except ValueError:
            return jsonify({"error": "Invalid start_date format."}), 400

    end_date = None
    if request.args.get("end_date"):
        try:
            end_date = datetime.fromisoformat(request.args.get("end_date"))
        except ValueError:
            return jsonify({"error": "Invalid end_date format."}), 400

    totals = get_category_totals(user_id=user_id, start_date=start_date, end_date=end_date)
    return jsonify(totals), 200

@expense_bp.route("/expenses/<int:expense_id>", methods=["PUT"])
def edit_expense(expense_id: int):
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    update_kwargs = {}
    if "amount" in data:
        try:
            update_kwargs["amount"] = Decimal(str(data["amount"]))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "Field 'amount' must be numeric."}), 400

    if "category_id" in data:
        update_kwargs["category_id"] = int(data["category_id"])

    if "currency" in data:
        update_kwargs["currency"] = str(data["currency"])

    if "occurred_at" in data:
        try:
            update_kwargs["occurred_at"] = datetime.fromisoformat(str(data["occurred_at"]))
        except ValueError:
            return jsonify({"error": "Field 'occurred_at' must be ISO format."}), 400

    if "note" in data:
        update_kwargs["note"] = data["note"]

    if "is_recurring" in data:
        update_kwargs["is_recurring"] = bool(data["is_recurring"])

    try:
        updated = update_expense(expense_id=expense_id, user_id=user_id, **update_kwargs)
        return jsonify(updated.to_dict()), 200
    except ExpenseNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except ExpenseValidationError as e:
        return jsonify({"error": str(e)}), 422

@expense_bp.route("/expenses/<int:expense_id>", methods=["DELETE"])
def remove_expense(expense_id: int):
    user_id = get_current_user_id()
    try:
        delete_expense(expense_id=expense_id, user_id=user_id)
        return jsonify({"message": "Expense deleted successfully."}), 200
    except ExpenseNotFoundError as e:
        return jsonify({"error": str(e)}), 404
