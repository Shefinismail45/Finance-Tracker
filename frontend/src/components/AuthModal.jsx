import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Database, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase, isLiveSupabaseConfigured } from '../supabaseClient';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const isSignUp = authMode === 'signup';

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setGoogleLoading(true);
    try {
      if (!isLiveSupabaseConfigured()) {
        const demoGoogleUser = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'google.user@example.com',
          user_metadata: { 
            name: 'Google User',
            full_name: 'Google User',
            avatar_url: 'https://lh3.googleusercontent.com/a/default-user'
          }
        };
        localStorage.setItem('pft_demo_user', JSON.stringify(demoGoogleUser));
        onAuthSuccess(demoGoogleUser);
        onClose();
        return;
      }

      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (err) throw err;
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: fullName.trim() || email.split('@')[0] }
          }
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setMessage('Signup successful! Check your email to confirm your account, or sign in.');
          setAuthMode('login');
        } else if (data.user) {
          onAuthSuccess(data.user);
          onClose();
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (err) throw err;
        if (data.user) {
          onAuthSuccess(data.user);
          onClose();
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@financetracker.io',
        user_metadata: { name: 'Demo User', full_name: 'Demo User' }
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{isSignUp ? '✨ Create Account' : '🔐 Log In'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={13} color={isLive ? '#10b981' : '#f59e0b'} />
              <span>{isLive ? 'Connected to Supabase' : 'Running in Local Demo Mode'}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-subtle)',
          padding: '0.25rem',
          borderRadius: '0.75rem',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(''); }}
            style={{
              padding: '0.55rem 0.5rem',
              borderRadius: '0.55rem',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: !isSignUp ? 'var(--bg-card)' : 'transparent',
              color: !isSignUp ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: !isSignUp ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none'
            }}
          >
            <LogIn size={15} /> Log In
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setError(''); }}
            style={{
              padding: '0.55rem 0.5rem',
              borderRadius: '0.55rem',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isSignUp ? 'var(--bg-card)' : 'transparent',
              color: isSignUp ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: isSignUp ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none'
            }}
          >
            <UserPlus size={15} /> Sign Up
          </button>
        </div>

        {error && <div className="error-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        {message && <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
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
              autoFocus={!isSignUp}
            />
          </div>

          <div className="form-group">
            <label>Password {isSignUp && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(min 6 chars)</span>}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Please wait...' : isSignUp ? 'Create Free Account' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ padding: '0 0.65rem', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        {/* Switcher & Demo */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign Up
              </button>
            </span>
          )}
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDemoLogin}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.82rem', padding: '0.55rem' }}
          >
            <ShieldCheck size={16} color="#10b981" /> Use Demo Account
          </button>
        </div>
      </div>
    </div>
  );
}
