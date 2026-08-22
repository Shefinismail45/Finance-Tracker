import React, { useState, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { api } from '../api';

export function IncomeForm({ categories, initialData, onSubmit, onClose, submitting }) {
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');
  const [isCreatingCustomCat, setIsCreatingCustomCat] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  
  // Recurring vs One-Time Recurrence
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

  const [startDate, setStartDate] = useState(
    initialData?.start_date || new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [note, setNote] = useState(initialData?.note || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (categories.length > 0 && !categoryId && !isCreatingCustomCat) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const handleCategorySelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom_new__') {
      setIsCreatingCustomCat(true);
      setCategoryId('__custom_new__');
    } else {
      setIsCreatingCustomCat(false);
      setCategoryId(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    const numPeriod = isRecurring ? parseInt(frequency) : 0;
    if (isNaN(numPeriod) || numPeriod < 0) {
      setError('Please select a valid recurring frequency.');
      return;
    }

    if (!startDate) {
      setError('Please select a start date.');
      return;
    }

    if (endDate && endDate < startDate) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    let finalCategoryId = categoryId;

    // Handle universal "Other" custom category creation
    if (isCreatingCustomCat || categoryId === '__custom_new__') {
      if (!customCategoryName.trim()) {
        setError('Please provide a name for your custom income category.');
        return;
      }
      try {
        const createdCat = await api.createCategory({
          name: customCategoryName.trim(),
          kind: 'income',
          icon: 'dollar-sign'
        });
        finalCategoryId = createdCat.id;
      } catch (err) {
        setError(`Failed to create income category: ${err.message}`);
        return;
      }
    }

    if (!finalCategoryId) {
      setError('Please select or specify an income category.');
      return;
    }

    try {
      await onSubmit({
        category_id: finalCategoryId,
        amount: numAmount,
        currency: currency.toUpperCase(),
        period_months: numPeriod,
        start_date: startDate,
        end_date: endDate || null,
        is_active: isRecurring ? isActive : false,
        note: note.trim() || null
      });
    } catch (err) {
      setError(err.message || 'Failed to save income stream.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initialData ? 'Edit Income Stream' : 'Add Income Stream'}</div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Amount Received</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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

          {/* Income Category with Universal "Other" */}
          <div className="form-group">
            <label>Income Category / Stream Type</label>
            <select
              className="form-control"
              value={categoryId}
              onChange={handleCategorySelectChange}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.is_system_default ? '(Default)' : '(Custom)'}
                </option>
              ))}
              <option value="__custom_new__">✨ + Add Custom / Other Stream...</option>
            </select>

            {isCreatingCustomCat && (
              <div className="custom-other-input-box">
                <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PlusCircle size={14} /> New Custom Income Category Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Side Hustle, Consulting, YouTube, Royalties"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  autoFocus
                  style={{ marginTop: '0.35rem' }}
                />
              </div>
            )}
          </div>

          {/* Recurrence Selection: Recurring or Not */}
          <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>Recurrence</label>
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
                <span>⚡</span> One-Time Inflow
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
                <span>🔄</span> Recurring Income
              </button>
            </div>
            {!isRecurring && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                💡 One-time income inflow (e.g. bonus, freelance payout, gift, asset sale). No recurring frequency needed.
              </div>
            )}
          </div>

          {/* Frequency is ONLY shown if Recurring is selected */}
          {isRecurring && (
            <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <label>Recurring Frequency</label>
              <select
                className="form-control"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="1">Monthly (Every month)</option>
                <option value="2">Bi-Monthly (Every 2 months)</option>
                <option value="3">Quarterly (Every 3 months)</option>
                <option value="6">Half-Yearly (Every 6 months)</option>
                <option value="12">Yearly (Annual salary / retainer)</option>
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Date Received</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            {isRecurring && (
              <div className="form-group">
                <label>End Date (Optional)</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Note / Source (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Tech Corp Primary Salary, Client Project"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {isRecurring && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer' }}
              />
              <label htmlFor="is_active" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Active income stream (currently recurring)
              </label>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialData ? 'Update Stream' : 'Save Income Stream'}
          </button>
        </form>
      </div>
    </div>
  );
}
