import React from 'react';
import { Icon } from '../Icon';
import { Button } from '../ui/button';

export const StackView = ({ project, onOpenSettings }) => {
  const stack = project?.stack || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
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
              <div
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < stack.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: 'var(--bg-surface-2)',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 50, background: project.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="flag" size={14} style={{ color: 'var(--fg-dim)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            Environment variables and dependency tracking are coming in a future release.
          </span>
        </div>
      </div>
    </div>
  );
};
