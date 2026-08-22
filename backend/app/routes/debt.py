from flask import Blueprint, request, jsonify
from datetime import date
from decimal import Decimal, InvalidOperation
from app.routes.expense import get_current_user_id
from app.services.debt_service import (
    create_debt,
    get_debts,
    add_payment,
    get_payments,
    delete_payment,
    get_debt_summary,
    update_debt,
    delete_debt,
    DebtValidationError,
    DebtNotFoundError
)

debt_bp = Blueprint("debt", __name__, url_prefix="/api")

@debt_bp.route("/debts", methods=["POST"])
def add_debt():
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    required_fields = ["name", "debt_type", "principal_amount", "currency", "start_date"]
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({"error": f"Missing required field: '{field}'."}), 400

    try:
        principal_amount = Decimal(str(data["principal_amount"]))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "Field 'principal_amount' must be numeric."}), 400

    interest_rate = Decimal("0.00")
    if "interest_rate" in data and data["interest_rate"] is not None:
        try:
            interest_rate = Decimal(str(data["interest_rate"]))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "Field 'interest_rate' must be numeric."}), 400

    try:
        start_date = date.fromisoformat(str(data["start_date"]))
    except (ValueError, TypeError):
        return jsonify({"error": "Field 'start_date' must be ISO format (YYYY-MM-DD)."}), 400

    try:
        debt = create_debt(
            user_id=user_id,
            name=str(data["name"]),
            debt_type=str(data["debt_type"]),
            principal_amount=principal_amount,
            currency=str(data["currency"]),
            start_date=start_date,
            interest_rate=interest_rate,
            note=data.get("note")
        )
        return jsonify(debt.to_dict()), 201
    except DebtValidationError as e:
        return jsonify({"error": str(e)}), 422

@debt_bp.route("/debts", methods=["GET"])
def list_debts():
    user_id = get_current_user_id()
    status_filter = request.args.get("status_filter")
    debts = get_debts(user_id=user_id, status_filter=status_filter)
    return jsonify([d.to_dict() for d in debts]), 200

@debt_bp.route("/debts/summary", methods=["GET"])
def debt_summary():
    user_id = get_current_user_id()
    summary = get_debt_summary(user_id=user_id)
    return jsonify(summary), 200

@debt_bp.route("/debts/<int:debt_id>", methods=["PUT"])
def edit_debt(debt_id: int):
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    update_kwargs = {}
    if "principal_amount" in data:
        try:
            update_kwargs["principal_amount"] = Decimal(str(data["principal_amount"]))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "Field 'principal_amount' must be numeric."}), 400

    if "interest_rate" in data:
        try:
            update_kwargs["interest_rate"] = Decimal(str(data["interest_rate"]))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "Field 'interest_rate' must be numeric."}), 400

    if "debt_type" in data:
        update_kwargs["debt_type"] = str(data["debt_type"])

    if "name" in data:
        update_kwargs["name"] = str(data["name"])

    if "currency" in data:
        update_kwargs["currency"] = str(data["currency"])

    if "start_date" in data:
        try:
            update_kwargs["start_date"] = date.fromisoformat(str(data["start_date"]))
        except ValueError:
            return jsonify({"error": "Field 'start_date' must be YYYY-MM-DD."}), 400

    if "note" in data:
        update_kwargs["note"] = data["note"]

    try:
        updated = update_debt(debt_id=debt_id, user_id=user_id, **update_kwargs)
        return jsonify(updated.to_dict()), 200
    except DebtNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except DebtValidationError as e:
        return jsonify({"error": str(e)}), 422

@debt_bp.route("/debts/<int:debt_id>", methods=["DELETE"])
def remove_debt(debt_id: int):
    user_id = get_current_user_id()
    try:
        delete_debt(debt_id=debt_id, user_id=user_id)
        return jsonify({"message": "Debt and all associated payments deleted."}), 200
    except DebtNotFoundError as e:
        return jsonify({"error": str(e)}), 404

# Payment Endpoints
@debt_bp.route("/debts/<int:debt_id>/payments", methods=["POST"])
def record_payment(debt_id: int):
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    required = ["amount", "currency", "paid_date"]
    for f in required:
        if f not in data or data[f] is None:
            return jsonify({"error": f"Missing required field: '{f}'."}), 400

    try:
        amount = Decimal(str(data["amount"]))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "Field 'amount' must be numeric."}), 400

    try:
        paid_date = date.fromisoformat(str(data["paid_date"]))
    except (ValueError, TypeError):
        return jsonify({"error": "Field 'paid_date' must be YYYY-MM-DD."}), 400

    try:
        payment = add_payment(
            debt_id=debt_id,
            user_id=user_id,
            amount=amount,
            currency=str(data["currency"]),
            paid_date=paid_date,
            note=data.get("note")
        )
        return jsonify(payment.to_dict()), 201
    except DebtNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except DebtValidationError as e:
        return jsonify({"error": str(e)}), 422

@debt_bp.route("/debts/<int:debt_id>/payments", methods=["GET"])
def list_payments(debt_id: int):
    user_id = get_current_user_id()
    try:
        payments = get_payments(debt_id=debt_id, user_id=user_id)
        return jsonify([p.to_dict() for p in payments]), 200
    except DebtNotFoundError as e:
        return jsonify({"error": str(e)}), 404

@debt_bp.route("/debts/payments/<int:payment_id>", methods=["DELETE"])
def remove_payment(payment_id: int):
    user_id = get_current_user_id()
    try:
        delete_payment(payment_id=payment_id, user_id=user_id)
        return jsonify({"message": "Payment record deleted."}), 200
    except DebtNotFoundError as e:
        return jsonify({"error": str(e)}), 404
