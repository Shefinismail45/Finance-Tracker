export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'AED', symbol: 'AED', label: 'AED (AED) - UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR (SAR) - Saudi Riyal' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', label: 'AUD ($) - Australian Dollar' },
  { code: 'SGD', symbol: 'SG$', label: 'SGD ($) - Singapore Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF - Swiss Franc' },
  { code: 'UAH', symbol: '₴', label: 'UAH (₴) - Ukrainian Hryvnia' },
  { code: 'KWD', symbol: 'KD', label: 'KWD (KD) - Kuwaiti Dinar' },
  { code: 'QAR', symbol: 'QR', label: 'QAR (QR) - Qatari Riyal' }
];

export const getCurrencySymbol = (code = 'USD') => {
  const match = CURRENCIES.find(c => c.code.toUpperCase() === (code || 'USD').toUpperCase());
  return match ? match.symbol : '$';
};

// Static Fallback Exchange Rates (Base: 1 USD)
export const STATIC_USD_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.50,
  AED: 3.6725, // Fixed peg to USD: 1 USD = 3.6725 AED
  SAR: 3.75,   // Fixed peg to USD: 1 USD = 3.75 SAR
  QAR: 3.64,   // Fixed peg to USD: 1 USD = 3.64 QAR
  CAD: 1.36,
  AUD: 1.51,
  SGD: 1.34,
  JPY: 155.0,
  CHF: 0.90,
  UAH: 41.0,
  KWD: 0.307
};

// Memory & LocalStorage Cache
let _liveRatesCache = null;
let _liveRatesTimestamp = 0;

export function getCachedRates() {
  if (_liveRatesCache && (Date.now() - _liveRatesTimestamp < 3600000)) {
    return _liveRatesCache;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('pft_exchange_rates');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rates && (Date.now() - (parsed.timestamp || 0) < 3600000)) {
          _liveRatesCache = parsed.rates;
          _liveRatesTimestamp = parsed.timestamp;
          return parsed.rates;
        }
      }
    } catch (e) {}
  }
  return STATIC_USD_RATES;
}

export async function fetchLiveExchangeRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.result === 'success' && data.rates) {
        const merged = { ...STATIC_USD_RATES, ...data.rates };
        _liveRatesCache = merged;
        _liveRatesTimestamp = Date.now();
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('pft_exchange_rates', JSON.stringify({
            rates: merged,
            timestamp: _liveRatesTimestamp
          }));
        }
        return merged;
      }
    }
  } catch (e) {
    console.warn('Live exchange rates fetch unavailable, using static rates:', e);
  }
  return getCachedRates();
}

/**
 * Get exchange rate from fromCurr to toCurr
 * rate = 1 unit of fromCurr in toCurr
 */
export function getExchangeRate(fromCurr = 'USD', toCurr = 'USD') {
  const from = (fromCurr || 'USD').toUpperCase();
  const to = (toCurr || 'USD').toUpperCase();
  if (from === to) return 1.0;

  const rates = getCachedRates();
  const fromRateToUSD = rates[from] || STATIC_USD_RATES[from] || 1.0;
  const toRateToUSD = rates[to] || STATIC_USD_RATES[to] || 1.0;

  // 1 unit of from = (1 / fromRateToUSD) USD
  // in toCurr = (1 / fromRateToUSD) * toRateToUSD
  return toRateToUSD / fromRateToUSD;
}

/**
 * Converts an amount from fromCurr to toCurr
 */
export function convertAmount(amount, fromCurr = 'USD', toCurr = 'USD') {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 0;
  const from = (fromCurr || 'USD').toUpperCase();
  const to = (toCurr || 'USD').toUpperCase();
  if (from === to) return num;

  const rate = getExchangeRate(from, to);
  return Math.round(num * rate * 100) / 100;
}
