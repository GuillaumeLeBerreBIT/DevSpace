import { Icon } from './Icon';
import { Button } from './ui/button';

export const EmptyState = ({ icon, heading, subtext, action, actionLabel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 60, textAlign: 'center', gap: 12 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', marginBottom: 4 }}>
      <Icon name={icon} size={22} style={{ color: 'var(--fg-dim)' }} />
    </div>
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{heading}</p>
      {subtext && <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-muted)', maxWidth: 320 }}>{subtext}</p>}
    </div>
    {action && actionLabel && (
      <Button size="sm" onClick={action} style={{ marginTop: 4 }}>
        <Icon name="plus" size={13} />
        {actionLabel}
      </Button>
    )}
  </div>
);
