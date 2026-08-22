from flask import Blueprint, request, jsonify
from datetime import date
from decimal import Decimal, InvalidOperation
from app.routes.expense import get_current_user_id
from app.services.savings_service import (
    create_savings_goal,
    get_savings_goals,
    add_contribution,
    get_contributions,
    delete_contribution,
    get_savings_summary,
    update_savings_goal,
    delete_savings_goal,
    SavingsValidationError,
    SavingsNotFoundError
)

savings_bp = Blueprint("savings", __name__, url_prefix="/api")

@savings_bp.route("/savings", methods=["POST"])
def add_savings_goal():
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    required_fields = ["name", "currency", "contribution_amount", "period_months", "start_date"]
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({"error": f"Missing required field: '{field}'."}), 400

    try:
        contribution_amount = Decimal(str(data["contribution_amount"]))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "Field 'contribution_amount' must be numeric."}), 400

    try:
        period_months = int(data["period_months"])
    except (ValueError, TypeError):
        return jsonify({"error": "Field 'period_months' must be an integer."}), 400

    target_amount = None
    if "target_amount" in data and data["target_amount"] is not None:
        try:
            target_amount = Decimal(str(data["target_amount"]))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "Field 'target_amount' must be numeric."}), 400

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
        goal = create_savings_goal(
            user_id=user_id,
            name=str(data["name"]),
            currency=str(data["currency"]),
            contribution_amount=contribution_amount,
            period_months=period_months,
            start_date=start_date,
            target_amount=target_amount,
            end_date=end_date,
            is_active=bool(data.get("is_active", True)),
            note=data.get("note")
        )
        return jsonify(goal.to_dict()), 201
    except SavingsValidationError as e:
        return jsonify({"error": str(e)}), 422

@savings_bp.route("/savings", methods=["GET"])
def list_savings_goals():
    user_id = get_current_user_id()
    active_only = request.args.get("active_only", "false").lower() == "true"
    goals = get_savings_goals(user_id=user_id, active_only=active_only)
    return jsonify([g.to_dict() for g in goals]), 200

@savings_bp.route("/savings/summary", methods=["GET"])
def savings_summary():
    user_id = get_current_user_id()
    summary = get_savings_summary(user_id=user_id)
    return jsonify(summary), 200

@savings_bp.route("/savings/<int:goal_id>", methods=["PUT"])
def edit_savings_goal(goal_id: int):
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    update_kwargs = {}
    if "contribution_amount" in data:
        try:
            update_kwargs["contribution_amount"] = Decimal(str(data["contribution_amount"]))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "Field 'contribution_amount' must be numeric."}), 400

    if "period_months" in data:
        try:
            update_kwargs["period_months"] = int(data["period_months"])
        except (ValueError, TypeError):
            return jsonify({"error": "Field 'period_months' must be an integer."}), 400

    if "target_amount" in data:
        if data["target_amount"] is None:
            update_kwargs["target_amount"] = None
        else:
            try:
                update_kwargs["target_amount"] = Decimal(str(data["target_amount"]))
            except (InvalidOperation, ValueError, TypeError):
                return jsonify({"error": "Field 'target_amount' must be numeric."}), 400

    if "name" in data:
        update_kwargs["name"] = str(data["name"])

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
        updated = update_savings_goal(goal_id=goal_id, user_id=user_id, **update_kwargs)
        return jsonify(updated.to_dict()), 200
    except SavingsNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except SavingsValidationError as e:
        return jsonify({"error": str(e)}), 422

@savings_bp.route("/savings/<int:goal_id>", methods=["DELETE"])
def remove_savings_goal(goal_id: int):
    user_id = get_current_user_id()
    try:
        delete_savings_goal(goal_id=goal_id, user_id=user_id)
        return jsonify({"message": "Savings goal and all associated contributions deleted."}), 200
    except SavingsNotFoundError as e:
        return jsonify({"error": str(e)}), 404

# Contribution Deposit Endpoints
@savings_bp.route("/savings/<int:goal_id>/contributions", methods=["POST"])
def record_contribution(goal_id: int):
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    required = ["amount", "currency", "contributed_date"]
    for f in required:
        if f not in data or data[f] is None:
            return jsonify({"error": f"Missing required field: '{f}'."}), 400

    try:
        amount = Decimal(str(data["amount"]))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "Field 'amount' must be numeric."}), 400

    try:
        contributed_date = date.fromisoformat(str(data["contributed_date"]))
    except (ValueError, TypeError):
        return jsonify({"error": "Field 'contributed_date' must be YYYY-MM-DD."}), 400

    try:
        contribution = add_contribution(
            savings_goal_id=goal_id,
            user_id=user_id,
            amount=amount,
            currency=str(data["currency"]),
            contributed_date=contributed_date,
            note=data.get("note")
        )
        return jsonify(contribution.to_dict()), 201
    except SavingsNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except SavingsValidationError as e:
        return jsonify({"error": str(e)}), 422

@savings_bp.route("/savings/<int:goal_id>/contributions", methods=["GET"])
def list_contributions(goal_id: int):
    user_id = get_current_user_id()
    try:
        contributions = get_contributions(savings_goal_id=goal_id, user_id=user_id)
        return jsonify([c.to_dict() for c in contributions]), 200
    except SavingsNotFoundError as e:
        return jsonify({"error": str(e)}), 404

@savings_bp.route("/savings/contributions/<int:contribution_id>", methods=["DELETE"])
def remove_contribution(contribution_id: int):
    user_id = get_current_user_id()
    try:
        delete_contribution(contribution_id=contribution_id, user_id=user_id)
        return jsonify({"message": "Contribution deposit record deleted."}), 200
    except SavingsNotFoundError as e:
        return jsonify({"error": str(e)}), 404
