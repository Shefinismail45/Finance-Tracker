from flask import Blueprint, request, jsonify
from datetime import date
from decimal import Decimal, InvalidOperation
from app.routes.expense import get_current_user_id
from app.services.income_service import (
    create_income,
    get_incomes,
    get_income_summary,
    update_income,
    delete_income,
    IncomeValidationError,
    IncomeNotFoundError
)

income_bp = Blueprint("income", __name__, url_prefix="/api")

@income_bp.route("/incomes", methods=["POST"])
def add_income():
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    required_fields = ["category_id", "amount", "currency", "period_months", "start_date"]
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({"error": f"Missing required field: '{field}'."}), 400

    try:
        amount = Decimal(str(data["amount"]))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "Field 'amount' must be numeric."}), 400

    try:
        period_months = int(data["period_months"])
    except (ValueError, TypeError):
        return jsonify({"error": "Field 'period_months' must be an integer."}), 400

    try:
        start_date = date.fromisoformat(str(data["start_date"]))
    except (ValueError, TypeError):
        return jsonify({"error": "Field 'start_date' must be ISO format (YYYY-MM-DD)."}), 400

    end_date = None
    if data.get("end_date"):
        try:
            end_date = date.fromisoformat(str(data["end_date"]))
        except (ValueError, TypeError):
            return jsonify({"error": "Field 'end_date' must be ISO format (YYYY-MM-DD)."}), 400

    try:
        income = create_income(
            user_id=user_id,
            category_id=int(data["category_id"]),
            amount=amount,
            currency=str(data["currency"]),
            period_months=period_months,
            start_date=start_date,
            end_date=end_date,
            is_active=bool(data.get("is_active", True)),
            note=data.get("note")
        )
        return jsonify(income.to_dict()), 201
    except IncomeValidationError as e:
        return jsonify({"error": str(e)}), 422

@income_bp.route("/incomes", methods=["GET"])
def list_incomes():
    user_id = get_current_user_id()

    cat_id_param = request.args.get("category_id")
    category_id = int(cat_id_param) if cat_id_param and cat_id_param.isdigit() else None
    active_only = request.args.get("active_only", "false").lower() == "true"

    target_date = None
    if request.args.get("target_date"):
        try:
            target_date = date.fromisoformat(request.args.get("target_date"))
        except ValueError:
            return jsonify({"error": "Invalid target_date format (YYYY-MM-DD)."}), 400

    incomes = get_incomes(
        user_id=user_id,
        category_id=category_id,
        active_only=active_only,
        target_date=target_date
    )
    return jsonify([i.to_dict() for i in incomes]), 200

@income_bp.route("/incomes/summary", methods=["GET"])
def income_summary():
    user_id = get_current_user_id()

    target_date = None
    if request.args.get("target_date"):
        try:
            target_date = date.fromisoformat(request.args.get("target_date"))
        except ValueError:
            return jsonify({"error": "Invalid target_date format (YYYY-MM-DD)."}), 400

    summary = get_income_summary(user_id=user_id, target_date=target_date)
    return jsonify(summary), 200

@income_bp.route("/incomes/<int:income_id>", methods=["PUT"])
def edit_income(income_id: int):
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

    if "period_months" in data:
        try:
            update_kwargs["period_months"] = int(data["period_months"])
        except (ValueError, TypeError):
            return jsonify({"error": "Field 'period_months' must be an integer."}), 400

    if "category_id" in data:
        update_kwargs["category_id"] = int(data["category_id"])

    if "currency" in data:
        update_kwargs["currency"] = str(data["currency"])

    if "start_date" in data:
        try:
            update_kwargs["start_date"] = date.fromisoformat(str(data["start_date"]))
        except ValueError:
            return jsonify({"error": "Field 'start_date' must be YYYY-MM-DD."}), 400

    if "end_date" in data:
        if data["end_date"] is None:
            update_kwargs["end_date"] = None
        else:
            try:
                update_kwargs["end_date"] = date.fromisoformat(str(data["end_date"]))
            except ValueError:
                return jsonify({"error": "Field 'end_date' must be YYYY-MM-DD."}), 400

    if "is_active" in data:
        update_kwargs["is_active"] = bool(data["is_active"])

    if "note" in data:
        update_kwargs["note"] = data["note"]

    try:
        updated = update_income(income_id=income_id, user_id=user_id, **update_kwargs)
        return jsonify(updated.to_dict()), 200
    except IncomeNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except IncomeValidationError as e:
        return jsonify({"error": str(e)}), 422

@income_bp.route("/incomes/<int:income_id>", methods=["DELETE"])
def remove_income(income_id: int):
    user_id = get_current_user_id()
    try:
        delete_income(income_id=income_id, user_id=user_id)
        return jsonify({"message": "Income stream deleted successfully."}), 200
    except IncomeNotFoundError as e:
        return jsonify({"error": str(e)}), 404
