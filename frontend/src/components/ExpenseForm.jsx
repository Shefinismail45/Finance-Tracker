import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Tag } from 'lucide-react';
import { api } from '../api';

export function ExpenseForm({ categories, initialData, onSubmit, onClose, submitting, defaultCurrency = 'USD' }) {
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');
  const [isCreatingCustomCat, setIsCreatingCustomCat] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [currency, setCurrency] = useState(initialData?.currency || defaultCurrency || 'USD');
  
  // Date & Time + All Day State
  const parseInitialDate = () => {
    if (initialData?.occurred_at) {
      const dt = new Date(initialData.occurred_at);
      const isDateOnly = initialData.occurred_at.length === 10 || 
                         initialData.occurred_at.endsWith('T00:00:00') || 
                         initialData.occurred_at.endsWith('T12:00:00.000Z') ||
                         initialData.occurred_at.endsWith('T00:00:00.000Z');
      const d = dt.toISOString().slice(0, 10);
      const hours = String(dt.getHours()).padStart(2, '0');
      const mins = String(dt.getMinutes()).padStart(2, '0');
      return {
        date: d,
        time: `${hours}:${mins}`,
        allDay: isDateOnly
      };
    }
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return {
      date: now.toISOString().slice(0, 10),
      time: `${hours}:${mins}`,
      allDay: true // Default to All Day
    };
  };

  const initialDateTime = parseInitialDate();
  const [dateVal, setDateVal] = useState(initialDateTime.date);
  const [timeVal, setTimeVal] = useState(initialDateTime.time);
  const [isAllDay, setIsAllDay] = useState(initialDateTime.allDay);

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

    if (!dateVal) {
      setError('Please specify a date.');
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

    // Determine final ISO timestamp
    let finalOccurredAt;
    if (isAllDay) {
      finalOccurredAt = new Date(`${dateVal}T12:00:00`).toISOString();
    } else {
      finalOccurredAt = new Date(`${dateVal}T${timeVal || '00:00'}:00`).toISOString();
    }

    try {
      await onSubmit({
        category_id: finalCategoryId,
        amount: numAmount,
        currency: currency.toUpperCase(),
        occurred_at: finalOccurredAt,
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

          {/* Date & Time with "All Day" Checkbox */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ marginBottom: 0, fontWeight: 600 }}>
                {isAllDay ? 'Date' : 'Date & Time'}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  style={{ width: '1.05rem', height: '1.05rem', cursor: 'pointer' }}
                />
                <span>All Day (No specific time)</span>
              </label>
            </div>

            {isAllDay ? (
              <input
                type="date"
                className="form-control"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                required
              />
            ) : (
              <div className="form-row" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div className="form-group" style={{ flex: 3, marginBottom: 0 }}>
                  <input
                    type="date"
                    className="form-control"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <input
                    type="time"
                    className="form-control"
                    value={timeVal}
                    onChange={(e) => setTimeVal(e.target.value)}
                    required={!isAllDay}
                  />
                </div>
              </div>
            )}
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

          <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
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
                <span>⚡</span> One-Time Expense
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
                <span>🔄</span> Recurring Expense
              </button>
            </div>
            {isRecurring ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                💡 Recurring fixed expense (rent, subscriptions, insurance). Factored into regular monthly cashflow projections.
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                💡 One-time purchase or single transaction (groceries, dining, shopping, repairs).
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving to Database...' : initialData ? 'Update Expense' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
