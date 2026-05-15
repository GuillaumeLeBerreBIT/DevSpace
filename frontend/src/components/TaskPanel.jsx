import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { TypePill, LabelChip, PointsBadge, CarryoverBadge, Pill } from './Components';
import { Button } from './ui/button';
import { useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { X, Trash2 } from 'lucide-react';

const STATUSES = ['To do', 'In progress', 'Blocked', 'In review', 'Done', 'Backlog'];
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const POINTS = [1, 2, 3, 5, 8, 13, 21];

const STATUS_COLORS = {
  'To do': 'var(--fg-dim)',
  'In progress': 'var(--amber)',
  'Blocked': 'var(--red)',
  'In review': 'var(--blue)',
  'Done': 'var(--green)',
  'Backlog': 'var(--fg-faint)',
};

const PRIORITY_COLORS = {
  Urgent: 'var(--red)',
  High: '#ff8c4d',
  Medium: 'var(--amber)',
  Low: 'var(--fg-dim)',
};

const formatDate = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export const TaskPanel = ({ task, onClose, allTasks, sprints = [] }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [status, setStatus] = useState(task?.status);
  const [priority, setPriority] = useState(task?.priority);
  const [points, setPoints] = useState(task?.points);
  const [sprintId, setSprintId] = useState(task?.sprint ?? '__backlog__');
  const [acceptance, setAcceptance] = useState(task?.acceptance || []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [editingField, setEditingField] = useState(null); // 'title' | 'description' | null

  // Holds the value before editing starts so Escape can revert
  const editSnapshot = React.useRef('');

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Sync local state when a different task is selected
  useEffect(() => {
    setStatus(task?.status);
    setPriority(task?.priority);
    setPoints(task?.points);
    setAcceptance(task?.acceptance || []);
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setSprintId(task?.sprint ?? '__backlog__');
    setEditingField(null);
    setActiveTab('details');
  }, [task?.id]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!task) return null;

  const linkedTasks = (task.linked || []).map(id => allTasks.find(t => t.id === id)).filter(Boolean);

  const handleFieldChange = (field, value) => {
    // Update local state immediately for instant feedback
    if (field === 'status') setStatus(value);
    if (field === 'priority') setPriority(value);
    if (field === 'points') setPoints(Number(value));

    updateTask.mutate({ id: task.id, [field]: field === 'points' ? Number(value) : value });
  };

  const handleAcceptanceToggle = (index) => {
    // Build the new acceptance array immutably so React re-renders.
    // Then send the whole array back — acceptance is a JSONField, so we update it wholesale.
    const next = acceptance.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    );
    setAcceptance(next);
    updateTask.mutate({ id: task.id, acceptance: next });
  };

  const handleSprintChange = (val) => {
    const newSprintId = val === '__backlog__' ? null : val;
    setSprintId(val);
    updateTask.mutate({ id: task.id, sprint: newSprintId });
  };

  const handleDelete = () => {
    deleteTask.mutate(
      { id: task.id, projectId: task.project },
      { onSuccess: onClose }
    );
  };

  const startEditing = (field, currentValue) => {
    editSnapshot.current = currentValue;
    setEditingField(field);
  };

  const commitEdit = (field, value) => {
    const trimmed = value.trim();
    // Only send a PATCH if the value actually changed
    if (trimmed && trimmed !== editSnapshot.current) {
      if (field === 'title') setTitle(trimmed);
      if (field === 'description') setDescription(trimmed);
      updateTask.mutate({ id: task.id, [field]: trimmed });
    }
    setEditingField(null);
  };

  const cancelEdit = (field) => {
    // Revert to snapshot and exit edit mode
    if (field === 'title') setTitle(editSnapshot.current);
    if (field === 'description') setDescription(editSnapshot.current);
    setEditingField(null);
  };

  const isSaving = updateTask.isPending;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 0.15s ease' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 560, maxWidth: '90vw',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideIn 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="task-id">{task.id}</span>
              <TypePill type={task.type} />
              {task.carryover && <CarryoverBadge />}
              {isSaving && (
                <span style={{ fontSize: 10, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)', marginLeft: 4 }}>
                  Saving…
                </span>
              )}
            </div>
            {editingField === 'title' ? (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => commitEdit('title', title)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit('title', title); }
                  if (e.key === 'Escape') { e.preventDefault(); cancelEdit('title'); }
                }}
                style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.4, background: 'var(--bg-input)', border: '1px solid var(--accent)', borderRadius: 4, padding: '2px 6px', width: '100%', outline: 'none' }}
              />
            ) : (
              <h2
                onClick={() => startEditing('title', title)}
                title="Click to edit"
                style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.4, cursor: 'text', borderRadius: 4, padding: '2px 6px', marginLeft: -6 }}
              >
                {title}
              </h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button
              variant="ghost"
              size="icon"
              title="Delete task"
              onClick={() => setConfirmDelete(true)}
              style={confirmDelete ? { color: 'var(--red)' } : {}}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 20px' }}>
          {['details', 'activity'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 14px', fontSize: 13, fontWeight: 500,
                color: activeTab === tab ? 'var(--fg)' : 'var(--fg-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent', marginBottom: -1, textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Editable meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                <MetaField label="Status">
                  <EditableSelect
                    value={status}
                    options={STATUSES}
                    onChange={val => handleFieldChange('status', val)}
                    renderValue={val => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 50, background: STATUS_COLORS[val] || 'var(--fg-dim)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{val}</span>
                      </div>
                    )}
                  />
                </MetaField>

                <MetaField label="Priority">
                  <EditableSelect
                    value={priority}
                    options={PRIORITIES}
                    onChange={val => handleFieldChange('priority', val)}
                    renderValue={val => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 50, background: PRIORITY_COLORS[val] || 'var(--fg-dim)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{val}</span>
                      </div>
                    )}
                  />
                </MetaField>

                <MetaField label="Points">
                  <EditableSelect
                    value={points}
                    options={POINTS}
                    onChange={val => handleFieldChange('points', val)}
                    renderValue={val => (
                      <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 20, height: 20, padding: '0 4px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-surface-3)', color: 'var(--fg-muted)', border: '1px solid var(--border)' }}>{val}</span>
                    )}
                  />
                </MetaField>

                <MetaField label="Sprint">
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                      {sprintId === '__backlog__'
                        ? 'Backlog'
                        : sprints.find(s => s.id === sprintId)?.name || 'Backlog'}
                    </span>
                    <select
                      value={sprintId}
                      onChange={e => handleSprintChange(e.target.value)}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                    >
                      <option value="__backlog__">Backlog</option>
                      {sprints.map(s => (
                        <option key={s.id} value={s.id}>S{s.num} · {s.name}</option>
                      ))}
                    </select>
                    <Icon name="chevronDown" size={11} style={{ color: 'var(--fg-faint)', marginLeft: 4, flexShrink: 0 }} />
                  </div>
                </MetaField>

                {task.due_date && (
                  <MetaField label="Due">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg-muted)' }}>
                      <Icon name="calendar" size={12} />
                      {formatDate(task.due_date)}
                    </div>
                  </MetaField>
                )}

                {task.branch && (
                  <MetaField label="Branch">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--accent-line)' }}>{task.branch}</span>
                  </MetaField>
                )}

                {task.pr_url && (
                  <MetaField label="PR">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)', background: 'var(--blue-soft)', padding: '2px 6px', borderRadius: 4 }}>{task.pr_url}</span>
                  </MetaField>
                )}

                {task.severity && (
                  <MetaField label="Severity">
                    <Pill kind={task.severity}>{task.severity}</Pill>
                  </MetaField>
                )}

                {task.closed_at && (
                  <MetaField label="Closed">
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{formatDate(task.closed_at)}</span>
                  </MetaField>
                )}
              </div>

              {/* Labels */}
              {task.labels && task.labels.length > 0 && (
                <div>
                  <SectionLabel>Labels</SectionLabel>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {task.labels.map(l => <LabelChip key={l} label={l} />)}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <SectionLabel>Description</SectionLabel>
                {editingField === 'description' ? (
                  <textarea
                    autoFocus
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onBlur={() => commitEdit('description', description)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') { e.preventDefault(); cancelEdit('description'); }
                      // Ctrl/Cmd+Enter saves
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitEdit('description', description); }
                    }}
                    placeholder="Add a description…"
                    rows={5}
                    style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6, background: 'var(--bg-input)', padding: 12, borderRadius: 6, border: '1px solid var(--accent)', width: '100%', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                  />
                ) : (
                  <div
                    onClick={() => startEditing('description', description)}
                    title="Click to edit"
                    style={{ fontSize: 13, color: description ? 'var(--fg-muted)' : 'var(--fg-faint)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--bg-surface-2)', padding: 12, borderRadius: 6, border: '1px solid var(--border)', cursor: 'text', minHeight: 44 }}
                  >
                    {description || 'Add a description…'}
                  </div>
                )}
              </div>

              {/* Steps to reproduce (bugs) */}
              {task.steps && (
                <div>
                  <SectionLabel>Steps to reproduce</SectionLabel>
                  <pre style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'var(--font-mono)', background: 'var(--bg-surface-2)', padding: 12, borderRadius: 6, border: '1px solid var(--border)' }}>
                    {task.steps}
                  </pre>
                </div>
              )}

              {/* Acceptance criteria */}
              <AcceptanceCriteria
                acceptance={acceptance}
                onToggle={handleAcceptanceToggle}
                onAdd={(text) => {
                  const next = [...acceptance, { text, done: false }];
                  setAcceptance(next);
                  updateTask.mutate({ id: task.id, acceptance: next });
                }}
              />

              {/* Linked tasks */}
              {linkedTasks.length > 0 && (
                <div>
                  <SectionLabel>Linked tasks</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {linkedTasks.map(lt => (
                      <div key={lt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 5, background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                        <Icon name="link" size={12} style={{ color: 'var(--fg-dim)' }} />
                        <span className="task-id">{lt.id}</span>
                        <span style={{ fontSize: 13, color: 'var(--fg-muted)', flex: 1 }}>{lt.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete confirmation */}
              {confirmDelete && (
                <div style={{ padding: 12, background: 'rgba(229, 72, 77, 0.08)', border: '1px solid var(--red)', borderRadius: 6, fontSize: 12, color: 'var(--fg)' }}>
                  <p style={{ margin: '0 0 8px' }}>
                    Delete <strong>{task.id}</strong>? This cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleteTask.isPending}
                      style={{ background: 'var(--red)', color: 'white' }}
                    >
                      {deleteTask.isPending ? 'Deleting…' : 'Delete forever'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>Created {formatDate(task.created_at)}</span>
                <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>Updated {formatDate(task.updated_at)}</span>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ padding: 20, borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--fg-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Activity timeline coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Renders the current value as a styled display, but wraps it in a select overlay
// so clicking anywhere on the field opens the native dropdown
const EditableSelect = ({ value, options, onChange, renderValue }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
    {renderValue(value)}
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        position: 'absolute', inset: 0, opacity: 0,
        cursor: 'pointer', width: '100%', height: '100%',
      }}
    >
      {options.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
    <Icon name="chevronDown" size={11} style={{ color: 'var(--fg-faint)', marginLeft: 4, flexShrink: 0 }} />
  </div>
);

const AcceptanceCriteria = ({ acceptance, onToggle, onAdd }) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft('');
  };

  return (
    <div>
      <SectionLabel>Acceptance criteria</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {acceptance.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 5, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', width: '100%' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.done ? 'var(--green)' : 'var(--border-strong)'}`, background: item.done ? 'var(--green-soft)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              {item.done && <Icon name="check" size={10} strokeWidth={2.5} style={{ color: 'var(--green)' }} />}
            </div>
            <span style={{ fontSize: 13, color: item.done ? 'var(--fg-muted)' : 'var(--fg)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
          </button>
        ))}

        {/* Add new criterion inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 5, border: '1px dashed var(--border)' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--border)', flexShrink: 0 }} />
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
            placeholder="Add criterion…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--fg)', '::placeholder': { color: 'var(--fg-faint)' } }}
          />
          {draft && (
            <button onClick={commit} style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MetaField = ({ label, children }) => (
  <div>
    <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</div>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{children}</div>
);
