import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Database } from 'lucide-react';
import { supabase, isLiveSupabaseConfigured } from '../supabaseClient';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: fullName.trim() || email.split('@')[0] }
          }
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setMessage('Signup successful! Check your email to confirm your account, or sign in.');
        } else {
          onAuthSuccess(data.user);
          onClose();
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (err) throw err;
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoUser = {
        id: 'demo-user-12345',
        email: 'demo@financetracker.io',
        user_metadata: { name: 'Alex Johnson' }
      };
      localStorage.setItem('pft_demo_user', JSON.stringify(demoUser));
      onAuthSuccess(demoUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const isLive = isLiveSupabaseConfigured();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{isSignUp ? 'Create Supabase Account' : 'Sign In to Tracker'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={13} color={isLive ? '#10b981' : '#f59e0b'} />
              <span>{isLive ? 'Connected to Supabase Postgres' : 'Running in Local Demo Mode'}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        {message && <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Authenticating...' : isSignUp ? 'Create Free Account' : 'Sign In with Supabase'}
          </button>

          <div style={{ margin: '1.25rem 0', textAlign: 'center', position: 'relative' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', position: 'absolute', top: '50%', width: '100%', left: 0 }}></div>
            <span style={{ background: 'var(--bg-card)', padding: '0 0.75rem', position: 'relative', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleDemoLogin}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <ShieldCheck size={18} color="#10b981" /> Use Instant Demo Account
          </button>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign Up
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
