import React, { useState } from 'react';
import { X, Target } from 'lucide-react';

export function SavingsForm({ initialData, onSubmit, onClose, submitting }) {
  const [name, setName] = useState(initialData?.name || '');
  const [customCategory, setCustomCategory] = useState(initialData?.custom_category || 'Emergency');
  const [hasTarget, setHasTarget] = useState(initialData?.target_amount !== null && initialData?.target_amount !== undefined);
  const [targetAmount, setTargetAmount] = useState(initialData?.target_amount ? String(initialData.target_amount) : '');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [contributionAmount, setContributionAmount] = useState(initialData?.contribution_amount ? String(initialData.contribution_amount) : '');
  
  // Recurring vs One-Time Deposit
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
  const [note, setNote] = useState(initialData?.note || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a name for this savings goal.');
      return;
    }

    const numPlanned = parseFloat(contributionAmount);
    if (isNaN(numPlanned) || numPlanned <= 0) {
      setError('Planned contribution amount must be greater than 0.');
      return;
    }

    const numPeriod = isRecurring ? parseInt(frequency) : 0;
    if (isNaN(numPeriod) || numPeriod < 0) {
      setError('Please select a valid deposit frequency.');
      return;
    }

    let numTarget = null;
    if (hasTarget) {
      numTarget = parseFloat(targetAmount);
      if (isNaN(numTarget) || numTarget <= 0) {
        setError('Target amount must be greater than 0, or uncheck target to create an open-ended fund.');
        return;
      }
    }

    try {
      await onSubmit({
        name: name.trim(),
        custom_category: customCategory.trim() || null,
        target_amount: numTarget,
        currency: currency.toUpperCase(),
        contribution_amount: numPlanned,
        period_months: numPeriod,
        start_date: startDate,
        note: note.trim() || null
      });
    } catch (err) {
      setError(err.message || 'Failed to save savings goal.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initialData ? 'Edit Savings Goal' : 'Create Savings Goal'}</div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Savings Goal Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 6-Month Emergency Buffer, Japan 2026, Down Payment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Goal Category / Custom Tag</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {['Emergency', 'Family', 'Travel', 'Retirement', 'Housing', 'Vehicle'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setCustomCategory(tag)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    border: customCategory === tag ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: customCategory === tag ? 'var(--primary-gradient)' : 'var(--bg-subtle)',
                    color: customCategory === tag ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomCategory('')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  border: '1px dashed var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Other Custom...
              </button>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Emergency, Family, Travel, Education, Tech"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.75rem 0' }}>
            <input
              type="checkbox"
              id="has_target"
              checked={hasTarget}
              onChange={(e) => {
                setHasTarget(e.target.checked);
                if (!e.target.checked) setTargetAmount('');
              }}
              style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer' }}
            />
            <label htmlFor="has_target" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Set a target goal amount (uncheck for open-ended buffer)
            </label>
          </div>

          {hasTarget && (
            <div className="form-group">
              <label>Target Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="e.g. 10000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required={hasTarget}
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>{isRecurring ? 'Planned Recurring Deposit' : 'Planned Initial / Lump Deposit'}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="250.00"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
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

          {/* Deposit Recurrence Toggle */}
          <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>Deposit Recurrence</label>
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
                <span>⚡</span> One-Time Deposit
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
                <span>🔄</span> Recurring Deposit
              </button>
            </div>
            {!isRecurring && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                💡 Single / one-time deposit commitment (no recurring periodic allocation).
              </div>
            )}
          </div>

          {/* Frequency is ONLY shown if Recurring is selected */}
          {isRecurring && (
            <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <label>Recurring Contribution Frequency</label>
              <select
                className="form-control"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="1">Monthly</option>
                <option value="3">Quarterly (Every 3 months)</option>
                <option value="6">Half-Yearly (Every 6 months)</option>
                <option value="12">Yearly (Annual lump sum)</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. High-Yield Savings Account at 4.5% APY"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialData ? 'Update Goal' : 'Save Goal'}
          </button>
        </form>
      </div>
    </div>
  );
}
