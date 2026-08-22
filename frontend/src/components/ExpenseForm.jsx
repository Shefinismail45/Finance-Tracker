import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Tag } from 'lucide-react';
import { api } from '../api';

export function ExpenseForm({ categories, initialData, onSubmit, onClose, submitting }) {
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');
  const [isCreatingCustomCat, setIsCreatingCustomCat] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [occurredAt, setOccurredAt] = useState(
    initialData?.occurred_at
      ? new Date(initialData.occurred_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState(initialData?.note || '');
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring || false);
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
      setError('Amount must be a positive number greater than 0.');
      return;
    }

    let finalCategoryId = categoryId;

    // Handle universal "Other" custom category creation
    if (isCreatingCustomCat || categoryId === '__custom_new__') {
      if (!customCategoryName.trim()) {
        setError('Please provide a name for your custom expense category.');
        return;
      }
      try {
        const createdCat = await api.createCategory({
          name: customCategoryName.trim(),
          kind: 'expense',
          icon: 'tag'
        });
        finalCategoryId = createdCat.id;
      } catch (err) {
        setError(`Failed to create category: ${err.message}`);
        return;
      }
    }

    if (!finalCategoryId) {
      setError('Please select or specify an expense category.');
      return;
    }

    try {
      await onSubmit({
        category_id: finalCategoryId,
        amount: numAmount,
        currency: currency.toUpperCase(),
        occurred_at: new Date(occurredAt).toISOString(),
        note: note.trim() || null,
        is_recurring: isRecurring
      });
    } catch (err) {
      setError(err.message || 'Failed to save expense.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initialData ? 'Edit Expense' : 'Log New Expense'}</div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Amount Spent</label>
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

          {/* Category Dropdown with Universal "Other" Option */}
          <div className="form-group">
            <label>Category</label>
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
              <option value="__custom_new__">✨ + Add Custom / Other Category...</option>
            </select>

            {isCreatingCustomCat && (
              <div className="custom-other-input-box">
                <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PlusCircle size={14} /> New Custom Category Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Pet Care, Software Subscriptions, Gym"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  autoFocus
                  style={{ marginTop: '0.35rem' }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              className="form-control"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Note / Description (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Whole Foods haul, Dinner with team"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              id="is_recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer' }}
            />
            <label htmlFor="is_recurring" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Mark as recurring fixed expense (rent, subscription, insurance)
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving to Database...' : initialData ? 'Update Expense' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
