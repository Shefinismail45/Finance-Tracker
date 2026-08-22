import React, { useState } from 'react';
import { 
  Wallet, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  PiggyBank,
  CheckCircle2
} from 'lucide-react';
import { supabase, isLiveSupabaseConfigured } from '../supabaseClient';

export function LoginPage({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setGoogleLoading(true);
    try {
      if (!isLiveSupabaseConfigured()) {
        // In local demo mode simulate Google Sign In
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
      setError(err.message || 'Failed to sign in with Google. Make sure Google provider is enabled in your Supabase dashboard.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Email & Password Auth
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (isLiveSupabaseConfigured()) {
          const { data, error: err } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: fullName.trim() || email.split('@')[0],
                full_name: fullName.trim() || email.split('@')[0]
              }
            }
          });
          if (err) throw err;
          if (data.user && !data.session) {
            setMessage('Registration successful! Please check your email to confirm your account, or sign in below.');
            setIsSignUp(false);
          } else if (data.user) {
            onAuthSuccess(data.user);
          }
        } else {
          // Local fallback
          const user = {
            id: '00000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
            email: email.trim(),
            user_metadata: { name: fullName.trim() || email.split('@')[0] }
          };
          localStorage.setItem('pft_demo_user', JSON.stringify(user));
          onAuthSuccess(user);
        }
      } else {
        if (isLiveSupabaseConfigured()) {
          const { data, error: err } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          });
          if (err) throw err;
          if (data.user) {
            onAuthSuccess(data.user);
          }
        } else {
          // Local fallback
          const user = {
            id: '00000000-0000-0000-0000-000000000001',
            email: email.trim(),
            user_metadata: { name: email.split('@')[0] }
          };
          localStorage.setItem('pft_demo_user', JSON.stringify(user));
          onAuthSuccess(user);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login
  const handleDemoLogin = () => {
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@financetracker.io',
      user_metadata: { name: 'Demo User', full_name: 'Demo User' }
    };
    localStorage.setItem('pft_demo_user', JSON.stringify(demoUser));
    onAuthSuccess(demoUser);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glowing gradients */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '650px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '1.5rem',
        padding: '2.25rem 2rem',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '1rem',
            background: 'var(--primary-gradient)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)'
          }}>
            <Wallet size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            FinanceTracker
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {isSignUp ? 'Create your personal account to get started' : 'Sign in to access your financial dashboard'}
          </p>
        </div>

        {/* Error / Success Notices */}
        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            padding: '0.85rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '1.25rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            padding: '0.85rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '1.25rem',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            {message}
          </div>
        )}

        {/* 1. GOOGLE OAUTH BUTTON */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          style={{
            width: '100%',
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s ease',
            marginBottom: '1.25rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
        >
          {/* Official Google SVG Logo */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* 2. EMAIL & PASSWORD FORM */}
        <form onSubmit={handleEmailAuth}>
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
            <label>Password</label>
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || googleLoading}
            style={{ marginTop: '1.25rem' }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Free Account' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Switch Sign Up / Sign In */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign Up Free
              </button>
            </span>
          )}
        </div>

        {/* Demo Mode Button */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDemoLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <ShieldCheck size={16} color="#10b981" /> Explore with Demo Account (Instant Preview)
          </button>
        </div>
      </div>
    </div>
  );
}
