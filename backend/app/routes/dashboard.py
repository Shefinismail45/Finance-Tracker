from flask import Blueprint, request, jsonify
from datetime import date
from app.routes.expense import get_current_user_id
from app.services.dashboard_service import (
    get_executive_dashboard,
    get_net_worth_snapshot,
    get_flow_summary,
    get_cash_flow_forecast
)

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")

@dashboard_bp.route("/dashboard", methods=["GET"])
def executive_dashboard():
    user_id = get_current_user_id()

    days_param = request.args.get("days", "30")
    days = int(days_param) if days_param and days_param.isdigit() else 30

    data = get_executive_dashboard(user_id=user_id, days=days)
    return jsonify(data), 200

@dashboard_bp.route("/reports/summary", methods=["GET"])
def period_report_summary():
    user_id = get_current_user_id()

    year_param = request.args.get("year")
    year = int(year_param) if year_param and year_param.isdigit() else None

    month_param = request.args.get("month")
    month = int(month_param) if month_param and month_param.isdigit() else None

    stock = get_net_worth_snapshot(user_id=user_id)
    flow = get_flow_summary(user_id=user_id, year=year, month=month)
    forecast = get_cash_flow_forecast(user_id=user_id, days=30)

    return jsonify({
        "report_type": "Executive Period Summary",
        "stock_snapshot": stock,
        "flow_summary": flow,
        "forecast_30d": forecast
    }), 200
