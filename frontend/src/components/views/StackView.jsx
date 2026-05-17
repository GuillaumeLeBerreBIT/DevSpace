import { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useEnvVars, useCreateEnvVar, useDeleteEnvVar, useUnlockVault, useSetVaultPassword } from '../../hooks/useEnvVars';

// ─── Vault state machine ───────────────────────────────────────────────────
// 'no-password'  → vault has no password, vars are visible freely
// 'locked'       → password set, waiting for user to unlock
// 'unlocked'     → password verified, showing values (with timeout)

export const StackView = ({ project, onOpenSettings }) => {
  const stack = project?.stack || [];

  const { data: envVars = [] } = useEnvVars(project?.id);
  const createEnvVar = useCreateEnvVar();
  const deleteEnvVar = useDeleteEnvVar();
  const unlockVault = useUnlockVault();
  const setVaultPassword = useSetVaultPassword();

  const hasVaultPassword = !!project?.has_vault_password;
  const vaultTimeout = project?.vault_timeout ?? 15;

  // We track unlock expiry as a timestamp in memory — never persisted to localStorage
  const [unlockedUntil, setUnlockedUntil] = useState(null);
  const [showVaultUnlock, setShowVaultUnlock] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [revealedIds, setRevealedIds] = useState(new Set());

  // New env var draft
  const [addingVar, setAddingVar] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');

  // unlockedUntil is cleared by setTimeout when it expires — safe to derive from without Date.now()
  const isVaultOpen = !hasVaultPassword || !!unlockedUntil;

  // Auto-lock after timeout — Math.max(0, ms) handles already-expired timestamps without sync setState
  useEffect(() => {
    if (!unlockedUntil) return;
    const ms = unlockedUntil - Date.now();
    const t = setTimeout(() => setUnlockedUntil(null), Math.max(0, ms));
    return () => clearTimeout(t);
  }, [unlockedUntil]);

  // Minutes remaining counter (updates every 10s) — reset in cleanup to avoid sync setState
  const [minsLeft, setMinsLeft] = useState(null);
  useEffect(() => {
    if (!unlockedUntil) return;
    const update = () => {
      const remaining = Math.ceil((unlockedUntil - Date.now()) / 60000);
      setMinsLeft(remaining > 0 ? remaining : 0);
    };
    update();
    const t = setInterval(update, 10000);
    return () => { clearInterval(t); setMinsLeft(null); };
  }, [unlockedUntil]);

  const handleUnlock = (password) => {
    unlockVault.mutate(
      { projectId: project.id, password },
      {
        onSuccess: (data) => {
          if (data.success) {
            setUnlockedUntil(Date.now() + data.timeout * 60 * 1000);
            setShowVaultUnlock(false);
          }
        },
      }
    );
  };

  const handleSetPassword = (password) => {
    setVaultPassword.mutate(
      { projectId: project.id, password },
      {
        onSuccess: () => {
          setShowSetPassword(false);
          // Immediately unlock for the current session after setting a new password
          setUnlockedUntil(Date.now() + vaultTimeout * 60 * 1000);
        },
      }
    );
  };

  const handleAddVar = () => {
    if (!draftKey.trim()) return;
    createEnvVar.mutate(
      { project: project.id, key: draftKey.trim(), value: draftValue },
      {
        onSuccess: () => {
          setDraftKey('');
          setDraftValue('');
          setAddingVar(false);
        },
      }
    );
  };

  const toggleReveal = (id) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>Tech stack</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Technologies powering {project?.name}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onOpenSettings}>
          <Icon name="settings" size={13} />
          Edit stack
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Stack list */}
        {stack.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 10, color: 'var(--fg-faint)', fontSize: 13 }}>
            <Icon name="layers" size={28} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 14px' }}>No technologies tracked yet for this project.</p>
            <Button size="sm" onClick={onOpenSettings}>
              <Icon name="plus" size={13} />
              Add stack items
            </Button>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {stack.map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < stack.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: 'var(--bg-surface-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 50, background: project.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Environment Variables ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Environment variables</h3>
              {isVaultOpen && minsLeft !== null && (
                <span style={{ fontSize: 11, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '1px 6px' }}>
                  locks in {minsLeft}m
                </span>
              )}
              {isVaultOpen && hasVaultPassword && (
                <button
                  onClick={() => setUnlockedUntil(null)}
                  title="Lock vault now"
                  style={{ color: 'var(--fg-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                >
                  <Icon name="lock" size={13} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {!hasVaultPassword && (
                <Button size="sm" variant="secondary" onClick={() => setShowSetPassword(true)}>
                  <Icon name="lock" size={13} />
                  Set vault password
                </Button>
              )}
              {isVaultOpen && (
                <Button size="sm" variant="secondary" onClick={() => setAddingVar(v => !v)}>
                  <Icon name="plus" size={13} />
                  Add variable
                </Button>
              )}
              {hasVaultPassword && !isVaultOpen && (
                <Button size="sm" onClick={() => setShowVaultUnlock(true)}>
                  <Icon name="lock" size={13} />
                  Unlock vault
                </Button>
              )}
            </div>
          </div>

          {/* Locked state */}
          {hasVaultPassword && !isVaultOpen && (
            <div style={{ padding: 40, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg-muted)', fontSize: 13, background: 'var(--bg-surface-2)' }}>
              <Icon name="lock" size={24} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ margin: '0 0 12px', color: 'var(--fg-faint)' }}>Vault is locked</p>
              <Button size="sm" onClick={() => setShowVaultUnlock(true)}>
                Enter vault password
              </Button>
            </div>
          )}

          {/* Env vars list */}
          {isVaultOpen && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {envVars.length === 0 && !addingVar && (
                <div style={{ padding: '20px 16px', color: 'var(--fg-faint)', fontSize: 12, textAlign: 'center' }}>
                  No variables yet. Click "Add variable" to add one.
                </div>
              )}
              {envVars.map((v, i) => (
                <EnvVarRow
                  key={v.id}
                  variable={v}
                  revealed={revealedIds.has(v.id)}
                  onToggleReveal={() => toggleReveal(v.id)}
                  onDelete={() => deleteEnvVar.mutate({ id: v.id, projectId: project.id })}
                  isLast={i === envVars.length - 1 && !addingVar}
                />
              ))}

              {/* Add new var row */}
              {addingVar && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'var(--bg-canvas)', borderTop: envVars.length > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <Input
                    value={draftKey}
                    onChange={e => setDraftKey(e.target.value)}
                    placeholder="VARIABLE_NAME"
                    autoFocus
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase' }}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddVar(); if (e.key === 'Escape') setAddingVar(false); }}
                  />
                  <Input
                    value={draftValue}
                    onChange={e => setDraftValue(e.target.value)}
                    placeholder="value"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddVar(); if (e.key === 'Escape') setAddingVar(false); }}
                  />
                  <Button size="sm" onClick={handleAddVar} disabled={!draftKey.trim() || createEnvVar.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAddingVar(false); setDraftKey(''); setDraftValue(''); }}>
                    <Icon name="x" size={13} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vault unlock modal */}
      {showVaultUnlock && (
        <VaultModal
          title="Unlock vault"
          submitLabel="Unlock"
          isPending={unlockVault.isPending}
          error={unlockVault.isError || (unlockVault.data && !unlockVault.data.success) ? 'Wrong password.' : null}
          onSubmit={handleUnlock}
          onClose={() => { setShowVaultUnlock(false); unlockVault.reset(); }}
        />
      )}

      {/* Set password modal */}
      {showSetPassword && (
        <VaultModal
          title="Set vault password"
          submitLabel="Set password"
          isPending={setVaultPassword.isPending}
          confirm
          onSubmit={handleSetPassword}
          onClose={() => setShowSetPassword(false)}
        />
      )}
    </div>
  );
};

// ─── EnvVarRow ──────────────────────────────────────────────────────────────
const EnvVarRow = ({ variable, revealed, onToggleReveal, onDelete, isLast }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'center', padding: '10px 16px', borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--fg)', letterSpacing: '0.02em' }}>
        {variable.key}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: revealed ? 'var(--fg-muted)' : 'var(--fg-faint)', letterSpacing: revealed ? '0.02em' : '0.15em' }}>
        {revealed ? variable.value : '•'.repeat(Math.min(variable.value.length || 8, 20))}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
        <button
          onClick={onToggleReveal}
          title={revealed ? 'Hide' : 'Reveal'}
          style={{ color: 'var(--fg-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center' }}
        >
          <Icon name={revealed ? 'eyeOff' : 'eye'} size={14} />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          style={{ color: 'var(--fg-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-faint)'}
        >
          <Icon name="x" size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── VaultModal ─────────────────────────────────────────────────────────────
const VaultModal = ({ title, submitLabel, isPending, error, confirm, onSubmit, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirm2, setConfirm2] = useState('');
  const [localError, setLocalError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (confirm && password !== confirm2) {
      setLocalError("Passwords don't match.");
      return;
    }
    if (!password) return;
    onSubmit(password);
  };

  const displayError = localError || error;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)' }}
      />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201, width: 340, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lock" size={15} style={{ color: 'var(--accent)' }} />
            {title}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--fg-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            ref={inputRef}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
          />
          {confirm && (
            <Input
              type="password"
              value={confirm2}
              onChange={e => setConfirm2(e.target.value)}
              placeholder="Confirm password"
            />
          )}
          {displayError && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--red)' }}>{displayError}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!password || isPending}>
              {isPending ? 'Checking…' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
