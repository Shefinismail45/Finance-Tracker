import React, { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';

export function DebtForm({ initialData, onSubmit, onClose, submitting }) {
  const [name, setName] = useState(initialData?.name || '');
  const [debtType, setDebtType] = useState(initialData?.debt_type || 'credit_card');
  const [customDebtType, setCustomDebtType] = useState(initialData?.custom_debt_type || '');
  const [principalAmount, setPrincipalAmount] = useState(initialData?.principal_amount ? String(initialData.principal_amount) : '');
  const [interestRate, setInterestRate] = useState(initialData?.interest_rate !== undefined ? String(initialData.interest_rate) : '0.00');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [startDate, setStartDate] = useState(
    initialData?.start_date || new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState(initialData?.note || '');
  const [error, setError] = useState('');

  const handleTypeChange = (type) => {
    setDebtType(type);
    if (type === 'no_interest') {
      setInterestRate('0.00');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numPrincipal = parseFloat(principalAmount);
    if (isNaN(numPrincipal) || numPrincipal <= 0) {
      setError('Principal amount must be greater than 0.');
      return;
    }

    const numRate = parseFloat(interestRate);
    if (isNaN(numRate) || numRate < 0 || numRate > 100) {
      setError('Interest rate must be between 0.00% and 100.00%.');
      return;
    }

    if (debtType === 'no_interest' && numRate !== 0) {
      setError('No-interest debts must have an interest rate of 0%.');
      return;
    }

    if (!name.trim()) {
      setError('Please provide a name or lender for this debt.');
      return;
    }

    if (debtType === 'other' && !customDebtType.trim()) {
      setError('Please describe what kind of debt this is (e.g. Medical bill, Store credit).');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        debt_type: debtType,
        custom_debt_type: debtType === 'other' ? customDebtType.trim() : null,
        principal_amount: numPrincipal,
        interest_rate: debtType === 'no_interest' ? 0 : numRate,
        currency: currency.toUpperCase(),
        start_date: startDate,
        note: note.trim() || null
      });
    } catch (err) {
      setError(err.message || 'Failed to save debt entry.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initialData ? 'Edit Debt' : 'Add Debt Balance'}</div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Debt Name / Lender</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Chase Sapphire, Auto Loan, Alex Personal Loan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Debt Type</label>
            <select
              className="form-control"
              value={debtType}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="credit_card">💳 Credit Card (High Interest)</option>
              <option value="loan">🏦 Bank Loan / Auto / Mortgage</option>
              <option value="no_interest">🤝 0% Interest Personal / Family Loan</option>
              <option value="other">📝 Other Custom Debt Type...</option>
            </select>

            {/* Universal "Other" Debt Input */}
            {debtType === 'other' && (
              <div className="custom-other-input-box">
                <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                  Specify Debt Classification / Details
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Medical Bill, Store Credit, Student Loan"
                  value={customDebtType}
                  onChange={(e) => setCustomDebtType(e.target.value)}
                  required
                  autoFocus
                  style={{ marginTop: '0.35rem' }}
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Principal / Starting Balance</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="0.00"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Currency</label>
              <select
                className="form-control"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Annual Interest Rate (APR %)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="form-control"
                placeholder="0.00"
                value={debtType === 'no_interest' ? '0.00' : interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                disabled={debtType === 'no_interest'}
                required
              />
            </div>
            <div className="form-group">
              <label>Origination Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 12-month promo 0% rate expiring June"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialData ? 'Update Debt' : 'Save Debt Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}
