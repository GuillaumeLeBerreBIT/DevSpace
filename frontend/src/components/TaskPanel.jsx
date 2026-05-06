import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { TypePill, StatusPill, PriorityDot, LabelChip, PointsBadge, CarryoverBadge, Pill } from './Components';

const STATUSES = ['To do', 'In progress', 'Blocked', 'In review', 'Done', 'Backlog'];
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];

export const TaskPanel = ({ task, onClose, allTasks }) => {
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!task) return null;

  const linkedTasks = (task.linked || []).map(id => allTasks.find(t => t.id === id)).filter(Boolean);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        animation: 'fadeIn 0.15s ease',
      }}
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
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.4 }}>{task.title}</h2>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', padding: '0 20px' }}>
          {['details', 'activity'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 14px', fontSize: 13, fontWeight: 500,
                color: activeTab === tab ? 'var(--fg)' : 'var(--fg-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent', marginBottom: -1,
                textTransform: 'capitalize',
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
              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MetaField label="Status">
                  <StatusPill status={task.status} />
                </MetaField>
                <MetaField label="Priority">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PriorityDot priority={task.priority} />
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{task.priority}</span>
                  </div>
                </MetaField>
                <MetaField label="Points">
                  <PointsBadge points={task.points} />
                </MetaField>
                {task.due && (
                  <MetaField label="Due">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg-muted)' }}>
                      <Icon name="calendar" size={12} />
                      {task.due}
                    </div>
                  </MetaField>
                )}
                {task.branch && (
                  <MetaField label="Branch">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--accent-line)' }}>{task.branch}</span>
                  </MetaField>
                )}
                {task.pr && (
                  <MetaField label="PR">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)', background: 'var(--blue-soft)', padding: '2px 6px', borderRadius: 4 }}>{task.pr}</span>
                  </MetaField>
                )}
                {task.severity && (
                  <MetaField label="Severity">
                    <Pill kind={task.severity}>{task.severity}</Pill>
                  </MetaField>
                )}
                {task.closedAt && (
                  <MetaField label="Closed">
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{task.closedAt}</span>
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
              {task.description && (
                <div>
                  <SectionLabel>Description</SectionLabel>
                  <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0, background: 'var(--bg-surface-2)', padding: 12, borderRadius: 6, border: '1px solid var(--border)' }}>
                    {task.description}
                  </p>
                </div>
              )}

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
              {task.acceptance && task.acceptance.length > 0 && (
                <div>
                  <SectionLabel>Acceptance criteria</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {task.acceptance.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 5, background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.done ? 'var(--green)' : 'var(--border-strong)'}`, background: item.done ? 'var(--green-soft)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          {item.done && <Icon name="check" size={10} strokeWidth={2.5} style={{ color: 'var(--green)' }} />}
                        </div>
                        <span style={{ fontSize: 13, color: item.done ? 'var(--fg-muted)' : 'var(--fg)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                        <StatusPill status={lt.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>Created {task.created}</span>
                <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>Updated {task.updated}</span>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 20, borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--fg-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                Activity timeline coming soon
              </div>
            </div>
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
