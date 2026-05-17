import { useState } from 'react';
import { Icon } from '../Icon';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../EmptyState';
import { useDevLog, useCreateDevLogEntry, useDeleteDevLogEntry } from '../../hooks/useDevLog';

export const DevLogView = ({ project }) => {
  const { data: entries = [], isLoading } = useDevLog(project.id);
  const createEntry = useCreateDevLogEntry();
  const deleteEntry = useDeleteDevLogEntry();
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '' });

  const handlePost = () => {
    if (!draft.title.trim() && !draft.body.trim()) return;
    createEntry.mutate(
      { title: draft.title || 'Untitled', body: draft.body, project: project.id },
      {
        onSuccess: () => {
          setDraft({ title: '', body: '' });
          setComposing(false);
        },
      }
    );
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Compose */}
        {composing ? (
          <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--accent-line)', borderRadius: 10, padding: 20, marginBottom: 28 }}>
            <Input
              autoFocus
              value={draft.title}
              onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Entry title…"
              className="border-0 bg-transparent px-0 text-[15px] font-medium focus-visible:ring-0 mb-2"
            />
            <Textarea
              value={draft.body}
              onChange={e => setDraft(prev => ({ ...prev, body: e.target.value }))}
              placeholder="What happened? What did you learn? What's the decision?"
              rows={6}
              className="border-0 bg-transparent px-0 text-muted-foreground font-mono focus-visible:ring-0 resize-vertical"
            />
            <div className="flex gap-2 justify-end pt-3 mt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => { setComposing(false); setDraft({ title: '', body: '' }); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePost} disabled={createEntry.isPending}>
                <Icon name="plus" size={13} />
                {createEntry.isPending ? 'Posting…' : 'Post entry'}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-2.5 w-full px-4 py-3 bg-card border border-dashed border-border rounded-xl mb-7 text-muted-foreground text-sm cursor-pointer transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Icon name="plus" size={16} />
            Write a dev log entry…
          </button>
        )}

        {/* Entries */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon="log"
            heading="No entries yet"
            subtext="Write a dev log entry to capture decisions, progress, and lessons learned."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {entries.map((entry, i) => (
              <LogEntry
                key={entry.id}
                entry={entry}
                isLast={i === entries.length - 1}
                onDelete={() => deleteEntry.mutate({ id: entry.id, projectId: project.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const formatTimestamp = (isoString) => {
  const d = new Date(isoString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const LogEntry = ({ entry, isLast, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 16 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: 50, background: 'var(--accent)', border: '2px solid var(--bg-canvas)', marginTop: 18, flexShrink: 0 }} />
        {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 4 }} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)' }}>
            {formatTimestamp(entry.created_at)}
          </span>
          {hovered && (
            <button
              onClick={onDelete}
              title="Delete entry"
              style={{ color: 'var(--fg-faint)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', lineHeight: 1 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-faint)'}
            >
              <Icon name="x" size={13} />
            </button>
          )}
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
