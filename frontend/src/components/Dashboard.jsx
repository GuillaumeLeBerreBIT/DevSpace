import React from 'react';
import { Icon } from './Icon';
import { Button } from './ui/button';
import { Pill, StatusPill, ProgressRing, ProjectInitial } from './Components';
import { useProjects } from '../hooks/useProjects';
import { useDashboard } from '../hooks/useDashboard';

export const Dashboard = ({ onProjectSelect, onTaskClick, onCreateProject }) => {
  const { data: projects = [] } = useProjects();
  const { data: dash } = useDashboard();

  const activeSprints = dash?.active_sprints || [];
  const openBugs = dash?.open_bugs || [];
  const recentLog = dash?.recent_devlog || [];
  const stats = dash?.stats || {};

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total tasks" value={stats.total_tasks ?? '—'} icon="list" />
        <StatCard label="In progress" value={stats.in_progress ?? '—'} icon="sprint" accent />
        <StatCard label="Done this week" value={stats.done_this_week ?? '—'} icon="check" positive />
        <StatCard label="Open bugs" value={stats.open_bugs ?? '—'} icon="bug" warn={stats.open_bugs > 0} />
      </div>

      {/* Active sprints */}
      {activeSprints.length > 0 && (
        <section>
          <SectionHeader title="Active sprints" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeSprints.map(s => (
              <SprintBanner key={s.id} sprint={s} onProjectSelect={onProjectSelect} projects={projects} />
            ))}
          </div>
        </section>
      )}

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
          <SectionHeader
            title="Open bugs"
            sub={openBugs.length > 0 ? `${openBugs.length} open` : null}
          />
          <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {openBugs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-faint)', fontSize: 12 }}>No open bugs</div>
            ) : openBugs.map((bug, i) => (
              <div
                key={bug.id}
                onClick={() => onTaskClick && onTaskClick(bug)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < openBugs.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <SeverityDot severity={bug.severity} />
                <span style={{ fontSize: 12, color: 'var(--fg)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.title}</span>
                <span className="task-id">{bug.id}</span>
                <span style={{ width: 7, height: 7, borderRadius: 50, background: bug.project_color, flexShrink: 0 }} title={bug.project_id} />
              </div>
            ))}
          </div>
        </section>

        {/* Dev log */}
        <section>
          <SectionHeader title="Dev log" sub="Recent entries" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentLog.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-faint)', fontSize: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 10 }}>No log entries yet</div>
            )}
            {recentLog.map(entry => (
              <div key={entry.id} style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 50, background: entry.project_color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{entry.project_name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)', marginLeft: 'auto' }}>{formatRelative(entry.created_at)}</span>
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const SprintBanner = ({ sprint, onProjectSelect, projects }) => {
  const daysLeft = sprint.days_remaining;
  const urgent = daysLeft !== null && daysLeft <= 2;
  const overdue = daysLeft !== null && daysLeft < 0;

  const project = projects.find(p => p.id === sprint.project_id);

  return (
    <div
      onClick={() => project && onProjectSelect(project)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
        background: 'var(--bg-surface-2)', border: `1px solid ${urgent ? 'var(--amber)' : 'var(--border)'}`,
        transition: 'border-color 0.12s',
      }}
      onMouseEnter={e => !urgent && (e.currentTarget.style.borderColor = 'var(--border-strong)')}
      onMouseLeave={e => !urgent && (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <ProgressRing value={sprint.completion / 100} size={40} stroke={3} color="var(--accent)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 50, background: sprint.project_color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{sprint.project_name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>Sprint {sprint.num}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sprint.name}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 2 }}>
          {sprint.open_tasks} task{sprint.open_tasks !== 1 ? 's' : ''} left
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: overdue ? 'var(--red)' : urgent ? 'var(--amber)' : 'var(--fg-dim)' }}>
          {overdue
            ? `${Math.abs(daysLeft)}d overdue`
            : daysLeft === null
              ? 'No end date'
              : daysLeft === 0
                ? 'Ends today'
                : `${daysLeft}d left`}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, accent, warn, positive }) => (
  <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface-3)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon name={icon} size={15} style={{ color: accent ? 'var(--accent)' : warn ? 'var(--red)' : positive ? 'var(--green)' : 'var(--fg-dim)' }} />
    </div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: accent ? 'var(--accent)' : warn ? 'var(--red)' : positive ? 'var(--green)' : 'var(--fg)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 3 }}>{label}</div>
    </div>
  </div>
);

const SeverityDot = ({ severity }) => {
  const color = severity === 'Critical' ? 'var(--red)' : severity === 'Major' ? '#ff8c4d' : 'var(--amber)';
  return <div style={{ width: 6, height: 6, borderRadius: 50, background: color, flexShrink: 0 }} />;
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{project.name}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.tagline || project.key}</div>
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
