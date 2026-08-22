import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, DollarSign } from 'lucide-react';
import { api } from '../api';

export function PaymentModal({ debt, onClose, onPaymentChange }) {
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.getDebtPayments(debt.id);
      setPayments(res);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [debt.id]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setError('');

    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await api.recordDebtPayment(debt.id, {
        amount: numAmt,
        currency: debt.currency,
        paid_date: paidDate,
        note: note.trim() || null
      });

      setAmount('');
      setNote('');
      await fetchPayments();
      onPaymentChange();
    } catch (err) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment entry? The debt balance will recalculate automatically.')) return;
    try {
      await api.deleteDebtPayment(paymentId);
      await fetchPayments();
      onPaymentChange();
    } catch (err) {
      alert(`Failed to delete payment: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Payment History: {debt.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Remaining: ${Number(debt.remaining_balance).toFixed(2)} {debt.currency} (Total Paid: ${Number(debt.total_paid).toFixed(2)})
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        {/* Log Payment Form */}
        <form onSubmit={handleAddPayment} style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '0.875rem', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-primary)' }}>
            <DollarSign size={16} color="var(--success)" /> Record Payment
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Payment Amount</label>
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
              <label>Payment Date</label>
              <input
                type="date"
                className="form-control"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Monthly statement payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ background: 'var(--success)', boxShadow: 'none' }}>
            {submitting ? 'Recording...' : 'Submit Payment'}
          </button>
        </form>

        {/* Payment History Log */}
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Payment Records ({payments.length})
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Loading payment log...</div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No payments recorded for this debt yet.
          </div>
        ) : (
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {payments.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.85rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '0.625rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--success)' }}>
                    +${Number(p.amount).toFixed(2)} {p.currency}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {p.paid_date} {p.note && `• ${p.note}`}
                  </div>
                </div>

                <button className="btn-icon delete" onClick={() => handleDeletePayment(p.id)} title="Delete payment">
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
