import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to pick up where you left off.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="berre"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
          required
          className={loginError ? 'border-destructive' : ''}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className={loginError ? 'border-destructive' : ''}
        />
      </div>

      {loginError && (
        <p className="text-xs text-destructive">{loginError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoggingIn}>
        {isLoggingIn ? 'Signing in…' : 'Sign in'}
      </Button>

      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button type="button" variant="outline" className="w-full gap-2" disabled>
        <GitHubIcon />
        Continue with GitHub
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        New to DevSpace?{' '}
        <button type="button" className="text-primary hover:underline disabled:opacity-40" disabled>
          Create an account
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitchToSignIn }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Create your workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">One person, one tool. No team setup needed.</p>
      </div>
      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card text-sm text-muted-foreground">
        <span>🔒</span>
        <span>Registration is not available in this version. Accounts are created by the server admin.</span>
      </div>
      <button className="text-xs text-primary hover:underline text-left" onClick={onSwitchToSignIn}>
        Back to sign in
      </button>
    </div>
  );
}

export function LoginScreen() {
  const [tab, setTab] = useState('signin');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-mono font-medium text-sm">
            DS
          </div>
          <span className="font-semibold text-foreground text-lg">DevSpace</span>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex bg-background rounded-lg p-0.5 gap-0.5">
              {['signin', 'register'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                    tab === t
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'signin' ? 'Sign in' : 'Register'}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            {tab === 'signin'
              ? <SignInForm />
              : <RegisterForm onSwitchToSignIn={() => setTab('signin')} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}
