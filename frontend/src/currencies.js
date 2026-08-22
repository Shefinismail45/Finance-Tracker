export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ) - UAE Dirham' },
  { code: 'SAR', symbol: '﷼', label: 'SAR (﷼) - Saudi Riyal' },
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
