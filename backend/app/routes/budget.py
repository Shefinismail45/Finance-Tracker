from flask import Blueprint, request, jsonify
from datetime import date
from decimal import Decimal, InvalidOperation
from app.routes.expense import get_current_user_id
from app.services.budget_service import (
    set_budget,
    get_budgets_with_actuals,
    suggest_50_30_20_framework,
    delete_budget,
    BudgetValidationError,
    BudgetNotFoundError
)

budget_bp = Blueprint("budget", __name__, url_prefix="/api")

@budget_bp.route("/budgets", methods=["POST"])
def save_budget():
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    required_fields = ["category_id", "planned_amount"]
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({"error": f"Missing required field: '{field}'."}), 400

    try:
        planned_amount = Decimal(str(data["planned_amount"]))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "Field 'planned_amount' must be numeric."}), 400

    period_months = int(data.get("period_months", 1))
    currency = str(data.get("currency", "USD"))

    start_date = None
    if data.get("start_date"):
        try:
            start_date = date.fromisoformat(str(data["start_date"]))
        except (ValueError, TypeError):
            return jsonify({"error": "Field 'start_date' must be YYYY-MM-DD."}), 400

    try:
        budget = set_budget(
            user_id=user_id,
            category_id=int(data["category_id"]),
            planned_amount=planned_amount,
            period_months=period_months,
            currency=currency,
            start_date=start_date
        )
        return jsonify(budget.to_dict()), 201
    except BudgetValidationError as e:
        return jsonify({"error": str(e)}), 422

@budget_bp.route("/budgets", methods=["GET"])
def list_budgets():
    user_id = get_current_user_id()

    year_param = request.args.get("year")
    year = int(year_param) if year_param and year_param.isdigit() else None

    month_param = request.args.get("month")
    month = int(month_param) if month_param and month_param.isdigit() else None

    budgets_with_actuals = get_budgets_with_actuals(user_id=user_id, year=year, month=month)
    return jsonify(budgets_with_actuals), 200

@budget_bp.route("/budgets/framework-suggestion", methods=["GET"])
def framework_suggestion():
    user_id = get_current_user_id()
    suggestion = suggest_50_30_20_framework(user_id=user_id)
    return jsonify(suggestion), 200

@budget_bp.route("/budgets/<int:budget_id>", methods=["DELETE"])
def remove_budget(budget_id: int):
    user_id = get_current_user_id()
    try:
        delete_budget(budget_id=budget_id, user_id=user_id)
        return jsonify({"message": "Budget deleted successfully."}), 200
    except BudgetNotFoundError as e:
        return jsonify({"error": str(e)}), 404
