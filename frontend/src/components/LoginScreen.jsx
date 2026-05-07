import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .5C5.4.5 0 5.9 0 12.5c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11 11 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0024 12.5C24 5.9 18.6.5 12 .5z" />
  </svg>
);

function SignInForm() {
  const { login, loginError, isLoggingIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-sub">Sign in to pick up where you left off.</p>

      <label className="auth-field">
        <span className="auth-label">Username</span>
        <input
          type="text"
          className={`auth-input${loginError ? ' auth-input--error' : ''}`}
          placeholder="berre"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
          required
        />
      </label>

      <label className="auth-field">
        <span className="auth-label">Password</span>
        <input
          type="password"
          className={`auth-input${loginError ? ' auth-input--error' : ''}`}
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </label>

      {loginError && (
        <p className="auth-error">{loginError}</p>
      )}

      <button
        type="submit"
        className="btn btn--primary auth-submit"
        disabled={isLoggingIn}
      >
        {isLoggingIn ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="auth-divider">or</div>

      <button type="button" className="btn auth-sso" disabled>
        <GitHubIcon />
        Continue with GitHub
      </button>

      <div className="auth-foot">
        New to DevSpace?{' '}
        <button type="button" className="auth-link" disabled style={{ opacity: 0.4 }}>
          Create an account
        </button>
      </div>
    </form>
  );
}

function RegisterForm({ onSwitchToSignIn }) {
  return (
    <div>
      <h1 className="auth-title">Create your workspace</h1>
      <p className="auth-sub">One person, one tool. No team setup needed.</p>

      <div className="auth-notice">
        <span className="auth-notice__icon">🔒</span>
        <span>
          Registration is not available in this version.
          Accounts are created by the server admin.
        </span>
        <button className="auth-link" onClick={onSwitchToSignIn}>
          Back to sign in
        </button>
      </div>
    </div>
  );
}

export function LoginScreen() {
  const [tab, setTab] = useState('signin');

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      <div className="auth-shell">

        <div className="auth-brand">
          <div className="auth-brand__logo">DS</div>
          <div className="auth-brand__name">DevSpace</div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              className={`auth-tab${tab === 'signin' ? ' auth-tab--active' : ''}`}
              onClick={() => setTab('signin')}
              role="tab"
            >
              Sign in
            </button>
            <button
              className={`auth-tab${tab === 'register' ? ' auth-tab--active' : ''}`}
              onClick={() => setTab('register')}
              role="tab"
            >
              Register
            </button>
          </div>

          {tab === 'signin'
            ? <SignInForm />
            : <RegisterForm onSwitchToSignIn={() => setTab('signin')} />
          }
        </div>

      </div>
    </div>
  );
}
