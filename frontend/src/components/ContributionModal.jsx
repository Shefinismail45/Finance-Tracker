import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, PlusCircle } from 'lucide-react';
import { api } from '../api';

export function ContributionModal({ goal, onClose, onContributionChange }) {
  const [contributions, setContributions] = useState([]);
  const [amount, setAmount] = useState('');
  const [contributedDate, setContributedDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const res = await api.getSavingsContributions(goal.id);
      setContributions(res);
    } catch (err) {
      console.error('Failed to load contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [goal.id]);

  const handleAddContribution = async (e) => {
    e.preventDefault();
    setError('');

    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('Contribution amount must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await api.recordSavingsContribution(goal.id, {
        amount: numAmt,
        currency: goal.currency,
        contributed_date: contributedDate,
        note: note.trim() || null
      });

      setAmount('');
      setNote('');
      await fetchContributions();
      onContributionChange();
    } catch (err) {
      setError(err.message || 'Failed to record deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContribution = async (contributionId) => {
    if (!window.confirm('Delete this deposit entry? Total saved will recalculate automatically.')) return;
    try {
      await api.deleteSavingsContribution(contributionId);
      await fetchContributions();
      onContributionChange();
    } catch (err) {
      alert(`Failed to delete deposit: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Deposit History: {goal.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Total Saved: ${Number(goal.total_saved).toFixed(2)} {goal.currency} {goal.target_amount ? `(Target: $${Number(goal.target_amount).toFixed(2)})` : '(Open-ended buffer)'}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        {/* Log Contribution Deposit Form */}
        <form onSubmit={handleAddContribution} style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '0.875rem', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-primary)' }}>
            <PlusCircle size={16} color="var(--primary)" /> Record New Deposit
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Deposit Amount</label>
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
              <label>Deposit Date</label>
              <input
                type="date"
                className="form-control"
                value={contributedDate}
                onChange={(e) => setContributedDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Monthly auto-transfer from paycheck"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Recording...' : 'Submit Deposit'}
          </button>
        </form>

        {/* Deposit History Log */}
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Deposit Records ({contributions.length})
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Loading deposit log...</div>
        ) : contributions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No deposits logged for this goal yet.
          </div>
        ) : (
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {contributions.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.85rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '0.625rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                    +${Number(c.amount).toFixed(2)} {c.currency}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {c.contributed_date} {c.note && `• ${c.note}`}
                  </div>
                </div>

                <button className="btn-icon delete" onClick={() => handleDeleteContribution(c.id)} title="Delete deposit">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
