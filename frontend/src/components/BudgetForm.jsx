import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function BudgetForm({ categories, initialData, onSubmit, onClose, submitting }) {
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');
  const [plannedAmount, setPlannedAmount] = useState(initialData?.planned_amount ? String(initialData.planned_amount) : '');
  const [periodMonths, setPeriodMonths] = useState(initialData?.period_months ? String(initialData.period_months) : '1');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [error, setError] = useState('');

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numPlanned = parseFloat(plannedAmount);
    if (isNaN(numPlanned) || numPlanned <= 0) {
      setError('Planned budget amount must be greater than 0.');
      return;
    }

    if (!categoryId) {
      setError('Please select an expense category.');
      return;
    }

    try {
      await onSubmit({
        category_id: categoryId,
        planned_amount: numPlanned,
        period_months: parseInt(periodMonths),
        currency: currency.toUpperCase()
      });
    } catch (err) {
      setError(err.message || 'Failed to save budget.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initialData ? 'Edit Category Budget' : 'Set Category Budget Limit'}</div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Expense Category</label>
            <select
              className="form-control"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!initialData}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Planned Spending Cap</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="400.00"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                required
                autoFocus
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

          <div className="form-group">
            <label>Budget Period</label>
            <select
              className="form-control"
              value={periodMonths}
              onChange={(e) => setPeriodMonths(e.target.value)}
            >
              <option value="1">Monthly Cap</option>
              <option value="3">Quarterly Cap (3 Months)</option>
              <option value="6">Half-Yearly Cap (6 Months)</option>
              <option value="12">Annual Cap (12 Months)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialData ? 'Update Budget' : 'Save Budget Target'}
          </button>
        </form>
      </div>
    </div>
  );
}
