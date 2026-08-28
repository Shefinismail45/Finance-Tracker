from decimal import Decimal
from datetime import datetime, timezone, date
import urllib.request
import json
from app.extensions import db
from app.models import User

# Tier 3: Static Fallback Exchange Rates (Base: USD)
STATIC_USD_RATES = {
    "USD": Decimal("1.0"),
    "EUR": Decimal("0.92"),
    "GBP": Decimal("0.79"),
    "INR": Decimal("83.50"),
    "AED": Decimal("3.6725"),  # Pegged to USD: 1 USD = 3.6725 AED
    "SAR": Decimal("3.75"),    # Pegged to USD: 1 USD = 3.75 SAR
    "QAR": Decimal("3.64"),    # Pegged to USD: 1 USD = 3.64 QAR
    "KWD": Decimal("0.307"),
    "CAD": Decimal("1.36"),
    "AUD": Decimal("1.51"),
    "SGD": Decimal("1.34"),
    "JPY": Decimal("155.0"),
    "CHF": Decimal("0.90"),
    "UAH": Decimal("41.0")
}

# In-memory cache for live fetched rates
_RATE_CACHE = {}

def fetch_live_rates_from_api(base_currency: str = "USD") -> dict | None:
    """
    Attempts to fetch live exchange rates from open API (https://open.er-api.com).
    Times out gracefully if offline or network is unreachable.
    """
    try:
        url = f"https://open.er-api.com/v6/latest/{base_currency.upper()}"
        req = urllib.request.Request(url, headers={'User-Agent': 'AntigravityFinanceTracker/1.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                if data.get("result") == "success" and "rates" in data:
                    return {k: Decimal(str(v)) for k, v in data["rates"].items()}
    except Exception:
        # Offline or API error -> Fall back seamlessly
        pass
    return None

def get_exchange_rate(from_currency: str, to_currency: str) -> tuple[Decimal, bool, str]:
    """
    Resolves exchange rate using 3-tier fallback strategy:
    Tier 1: Live API lookup (or fresh memory cache)
    Tier 2: Cached rates
    Tier 3: Static fallback table
    Returns tuple: (rate: Decimal, is_fallback: bool, source: str)
    """
    fc = from_currency.upper()
    tc = to_currency.upper()

    if fc == tc:
        return Decimal("1.0"), False, "1:1 Same Currency"

    cache_key = f"{fc}_{tc}"
    now = datetime.now(timezone.utc)

    # Check Tier 1 memory cache (valid for 1 hour)
    if cache_key in _RATE_CACHE:
        cached_rate, cached_time = _RATE_CACHE[cache_key]
        if (now - cached_time).total_seconds() < 3600:
            return cached_rate, False, "Live Cached API"

    # Try Tier 1 Live API Fetch
    live_rates = fetch_live_rates_from_api(fc)
    if live_rates and tc in live_rates:
        rate = live_rates[tc]
        _RATE_CACHE[cache_key] = (rate, now)
        return rate, False, "Live API"

    # Tier 3 Static Fallback Resolution
    fc_to_usd = STATIC_USD_RATES.get(fc, Decimal("1.0"))
    tc_to_usd = STATIC_USD_RATES.get(tc, Decimal("1.0"))

    # Convert fc -> USD -> tc
    # (amount / fc_to_usd) * tc_to_usd
    fallback_rate = (Decimal("1.0") / fc_to_usd) * tc_to_usd
    return round(fallback_rate, 6), True, "Static Offline Fallback"

def convert_amount(amount: Decimal, from_currency: str, to_currency: str) -> tuple[Decimal, Decimal, bool, str]:
    """
    Converts amount from_currency to to_currency.
    Returns: (converted_amount, rate, is_fallback, source)
    """
    if amount is None or amount == Decimal("0"):
        return Decimal("0.00"), Decimal("1.0"), False, "Zero Amount"

    rate, is_fallback, source = get_exchange_rate(from_currency, to_currency)
    converted = round(amount * rate, 2)
    return converted, rate, is_fallback, source

def get_user_primary_currency(user_id: int) -> str:
    """
    Retrieves user's primary currency (defaults to USD).
    """
    user = db.session.get(User, user_id)
    if user and user.primary_currency:
        return user.primary_currency.upper()
    return "USD"
