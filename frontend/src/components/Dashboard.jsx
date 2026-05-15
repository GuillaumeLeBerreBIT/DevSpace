import React, { useState } from 'react';
import { Icon } from './Icon';
import { Button } from './ui/button';
import { Pill, TypePill, StatusPill, PriorityDot, ProgressBar, ProgressRing, ProjectInitial, LabelChip } from './Components';
import { useProjects } from '../hooks/useProjects';

export const Dashboard = ({ onProjectSelect, onTaskClick, onCreateProject }) => {
  const { data: projects = [] } = useProjects();

  // Cross-project bug and devlog widgets need a global API endpoint not yet built.
  // Showing empty states until that endpoint exists.
  const openBugs = [];
  const recentLog = [];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Projects grid */}
      <section>
        <SectionHeader title="Projects" action={{ label: 'New project', icon: 'plus', onClick: onCreateProject }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onClick={() => onProjectSelect(p)} />
          ))}
          {projects.length === 0 && (
            <div
              onClick={onCreateProject}
              style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 10, color: 'var(--fg-faint)', cursor: 'pointer' }}
            >
              <Icon name="plus" size={20} style={{ display: 'block', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13 }}>Create your first project</div>
            </div>
          )}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Open bugs */}
        <section>
          <SectionHeader title="Open bugs" action={openBugs.length > 0 ? { label: `${openBugs.length} open` } : null} />
          <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {openBugs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-faint)', fontSize: 12 }}>No open bugs</div>
            ) : openBugs.slice(0, 5).map((bug, i) => (
              <div
                key={bug.id}
                onClick={() => onTaskClick(bug)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < openBugs.length - 1 && i < 4 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 6, height: 6, borderRadius: 50, background: bug.severity === 'Critical' ? 'var(--red)' : bug.severity === 'Major' ? '#ff8c4d' : 'var(--amber)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--fg)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.title}</span>
                <span className="task-id">{bug.id}</span>
                <StatusPill status={bug.status} />
              </div>
            ))}
          </div>
        </section>

        {/* Dev log */}
        <section>
          <SectionHeader title="Dev log" sub="Recent entries" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentLog.map(entry => (
              <div key={entry.id} style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)' }}>{entry.timestamp}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginBottom: 4 }}>{entry.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{entry.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const formatRelative = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const ProjectCard = ({ project, onClick }) => (
  <div
    onClick={onClick}
    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'border-color 0.12s ease', display: 'flex', flexDirection: 'column', gap: 12 }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <ProjectInitial project={project} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{project.name}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{project.tagline || project.key}</div>
      </div>
      <Pill kind={project.status}>{project.status}</Pill>
    </div>
    {(project.stack || []).length > 0 && (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {project.stack.slice(0, 4).map(s => (
          <span key={s} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--bg-surface-3)', border: '1px solid var(--border)', color: 'var(--fg-faint)' }}>{s}</span>
        ))}
      </div>
    )}
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-dim)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-faint)' }}>{project.key}</span>
      <span>Updated {formatRelative(project.updated_at)}</span>
    </div>
  </div>
);

const FocusItem = ({ item, done, onToggle, onTaskClick, isLast }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)' }}>
    <button
      onClick={onToggle}
      style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${done ? 'var(--accent)' : 'var(--border-strong)'}`, background: done ? 'var(--accent-soft)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer' }}
    >
      {done && <Icon name="check" size={10} strokeWidth={2.5} />}
    </button>
    <div
      style={{ flex: 1, cursor: item.task ? 'pointer' : 'default' }}
      onClick={() => item.task && onTaskClick && onTaskClick(item.task)}
    >
      <span style={{ fontSize: 13, color: done ? 'var(--fg-muted)' : 'var(--fg)', textDecoration: done ? 'line-through' : 'none' }}>{item.task?.title}</span>
    </div>
    <span className="task-id">{item.taskId}</span>
    {item.project && (
      <span style={{ width: 6, height: 6, borderRadius: 50, background: item.project.color, flexShrink: 0 }} />
    )}
  </div>
);

const MetricCard = ({ label, value, accent, warn }) => (
  <div style={{ padding: '10px 12px', borderRadius: 6, background: 'var(--bg-surface-3)', border: '1px solid var(--border)' }}>
    <div style={{ fontSize: 10, color: 'var(--fg-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', color: accent ? 'var(--accent)' : warn ? 'var(--amber)' : 'var(--fg)' }}>{value}</div>
  </div>
);

const SectionHeader = ({ title, sub, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{title}</h3>
      {sub && <span style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{sub}</span>}
    </div>
    {action && (
      <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={action.onClick}>
        {action.icon && <Icon name={action.icon} size={12} />}
        {action.label}
      </Button>
    )}
  </div>
);
