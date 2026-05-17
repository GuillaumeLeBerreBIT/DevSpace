import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useMe, useUpdateMe } from '../hooks/useMe';
import { useGithubAccount, useConnectGithub, useDisconnectGithub } from '../hooks/useGithub';
import { useAuth } from '../context/AuthContext';

export const UserSettingsModal = ({ onClose }) => {
  const { data: user } = useMe();
  const updateMe = useUpdateMe();
  const { logout } = useAuth();

  const { data: github } = useGithubAccount();
  const connectGithub = useConnectGithub();
  const disconnectGithub = useDisconnectGithub();

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [ghToken, setGhToken] = useState('');
  const [ghError, setGhError] = useState('');

  // Populate fields once user data loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setRole(user.role || '');
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMe.mutate(
      { display_name: displayName, role },
      { onSuccess: onClose }
    );
  };

  const handleConnectGithub = (e) => {
    e.preventDefault();
    setGhError('');
    const token = ghToken.trim();
    if (!token) return;
    connectGithub.mutate(token, {
      onSuccess: () => setGhToken(''),
      onError: (err) => setGhError(err.response?.data?.detail || 'Could not connect.'),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-96">
        <DialogHeader>
          <DialogTitle>User settings</DialogTitle>
          <DialogDescription>{user?.username}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              autoFocus
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={user?.username || 'Your name'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Solo dev"
            />
          </div>
        </form>

        {/* ── GitHub connection ─────────────────────────────────────────── */}
        <div style={{ padding: '0 24px 16px', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <Label>GitHub</Label>
          {github?.connected ? (
            <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--fg)' }}>
                Connected as <strong>{github.github_username}</strong>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => disconnectGithub.mutate()}
                disabled={disconnectGithub.isPending}
                style={{ alignSelf: 'flex-start', color: 'var(--fg-faint)' }}
              >
                {disconnectGithub.isPending ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConnectGithub} className="flex flex-col gap-2" style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-faint)', lineHeight: 1.5 }}>
                Paste a GitHub Personal Access Token with <code>repo</code> scope.{' '}
                <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  Generate one →
                </a>
              </div>
              <Input
                type="password"
                value={ghToken}
                onChange={e => setGhToken(e.target.value)}
                placeholder="ghp_..."
                autoComplete="off"
              />
              {ghError && (
                <div style={{ fontSize: 11, color: 'var(--red)' }}>{ghError}</div>
              )}
              <Button type="submit" size="sm" disabled={!ghToken.trim() || connectGithub.isPending} style={{ alignSelf: 'flex-start' }}>
                {connectGithub.isPending ? 'Validating…' : 'Connect GitHub'}
              </Button>
            </form>
          )}
        </div>

        <DialogFooter className="justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={logout}
          >
            Sign out
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={updateMe.isPending}>
              {updateMe.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
