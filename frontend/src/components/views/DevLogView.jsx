import React, { useState } from 'react';
import { Icon } from '../Icon';
import { DEVSPACE_DATA } from '../../data/data';

const { devLog: initialLog } = DEVSPACE_DATA;

export const DevLogView = () => {
  const [entries, setEntries] = useState(initialLog);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '' });

  const handlePost = () => {
    if (!draft.title.trim() && !draft.body.trim()) return;
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timestamp = `${months[now.getMonth()]} ${now.getDate()} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry = {
      id: `log-${Date.now()}`,
      timestamp,
      title: draft.title || 'Untitled',
      body: draft.body,
    };
    setEntries(prev => [newEntry, ...prev]);
    setDraft({ title: '', body: '' });
    setComposing(false);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Compose */}
        {composing ? (
          <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--accent-line)', borderRadius: 10, padding: 20, marginBottom: 28 }}>
            <input
              autoFocus
              value={draft.title}
              onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Entry title…"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)', fontSize: 15, fontWeight: 500, marginBottom: 10 }}
            />
            <textarea
              value={draft.body}
              onChange={e => setDraft(prev => ({ ...prev, body: e.target.value }))}
              placeholder="What happened? What did you learn? What's the decision?"
              rows={6}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.7, resize: 'vertical', fontFamily: 'var(--font-mono)' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border-subtle)', marginTop: 8 }}>
              <button className="btn btn--ghost btn--sm" onClick={() => { setComposing(false); setDraft({ title: '', body: '' }); }}>
                Cancel
              </button>
              <button className="btn btn--primary btn--sm" onClick={handlePost}>
                <Icon name="plus" size={13} />
                Post entry
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setComposing(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'var(--bg-surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 10, marginBottom: 28, cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 13, transition: 'all 0.12s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-line)'; e.currentTarget.style.color = 'var(--fg-muted)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--fg-dim)'; }}
          >
            <Icon name="plus" size={16} />
            Write a dev log entry…
          </button>
        )}

        {/* Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {entries.map((entry, i) => (
            <LogEntry key={entry.id} entry={entry} isLast={i === entries.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
};

const LogEntry = ({ entry, isLast }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: 50, background: 'var(--accent)', border: '2px solid var(--bg-canvas)', marginTop: 18, flexShrink: 0 }} />
        {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 4 }} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)' }}>{entry.timestamp}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ marginLeft: 'auto', color: 'var(--fg-faint)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} />
          </button>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.3 }}>{entry.title}</h3>
        {expanded && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
            {entry.body}
          </p>
        )}
      </div>
    </div>
  );
};
