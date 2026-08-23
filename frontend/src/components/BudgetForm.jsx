import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function BudgetForm({ categories = [], initialData, onSubmit, onClose, submitting }) {
  const defaultCategories = categories.filter(c => c.is_system_default);
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id || defaultCategories[0]?.id || (categories.length > 0 ? categories[0].id : '')
  );
  const [plannedAmount, setPlannedAmount] = useState(initialData?.planned_amount ? String(initialData.planned_amount) : '');
  
  // Recurring vs One-Time Budget Cap
  const [isRecurring, setIsRecurring] = useState(
    initialData?.period_months !== undefined && initialData?.period_months !== null
      ? Number(initialData.period_months) > 0
      : true
  );
  const [frequency, setFrequency] = useState(
    initialData?.period_months && Number(initialData.period_months) > 0
      ? String(initialData.period_months)
      : '1'
  );

  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultCategories.length > 0 && !categoryId) {
      setCategoryId(defaultCategories[0].id);
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

    const numPeriod = isRecurring ? parseInt(frequency) : 0;

    try {
      await onSubmit({
        category_id: categoryId,
        planned_amount: numPlanned,
        period_months: numPeriod,
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
              {defaultCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              {initialData?.category_id && !defaultCategories.some(c => c.id === initialData.category_id) && initialData?.category_name && (
                <option value={initialData.category_id}>
                  {initialData.category_name} (Custom)
                </option>
              )}
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

          {/* Budget Recurrence Toggle */}
          <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>Budget Recurrence</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                style={{
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '0.5rem',
                  border: !isRecurring ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: !isRecurring ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-subtle)',
                  color: !isRecurring ? 'var(--primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>⚡</span> One-Time Cap
              </button>
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                style={{
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '0.5rem',
                  border: isRecurring ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isRecurring ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-subtle)',
                  color: isRecurring ? 'var(--primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🔄</span> Recurring Budget
              </button>
            </div>
            {!isRecurring && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                💡 One-time spending cap for a specific project or event (e.g. Renovation, Wedding, Vacation). No recurring period needed.
              </div>
            )}
          </div>

          {/* Frequency is ONLY shown if Recurring is selected */}
          {isRecurring && (
            <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <label>Recurring Budget Frequency</label>
              <select
                className="form-control"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="1">Monthly Cap</option>
                <option value="3">Quarterly Cap (3 Months)</option>
                <option value="6">Half-Yearly Cap (6 Months)</option>
                <option value="12">Annual Cap (12 Months)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialData ? 'Update Budget' : 'Save Budget Target'}
          </button>
        </form>
      </div>
    </div>
  );
}
