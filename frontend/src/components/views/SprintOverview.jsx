import React, { useState } from 'react';
import { Icon } from '../Icon';
import { TypePill, StatusPill, PriorityDot, PointsBadge, CarryoverBadge, ProgressRing, ProgressBar, PlaceholderRect } from '../Components';
import { Kanban } from '../Kanban';

export const SprintOverview = ({ sprint, tasks, onTaskClick, onCreateSprint }) => {
  const [view, setView] = useState('board');

  if (!sprint) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Icon name="sprint" size={22} style={{ color: 'var(--fg-dim)' }} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>No active sprint</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--fg-muted)' }}>Create a sprint to start organizing your work into focused cycles.</p>
          <button className="btn btn--primary" onClick={onCreateSprint}>
            <Icon name="plus" size={14} />
            Create sprint
          </button>
        </div>
      </div>
    );
  }

  const sprintTasks = tasks.filter(t => t.sprint === sprint.id);

  const statusOrder = ['To do', 'In progress', 'Blocked', 'In review', 'Done'];
  const tasksByStatus = statusOrder.reduce((acc, s) => ({ ...acc, [s]: sprintTasks.filter(t => t.status === s) }), {});
  const doneTasks = sprintTasks.filter(t => t.status === 'Done');
  const completion = sprintTasks.length > 0 ? doneTasks.length / sprintTasks.length : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sprint header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--accent-line)' }}>Sprint {sprint.num}</span>
              <span style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{sprint.dateRange}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>{sprint.name}</h2>
            {sprint.goal && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--fg-muted)', maxWidth: 560 }}>{sprint.goal}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--sm" onClick={onCreateSprint}>
              <Icon name="plus" size={13} />
              New sprint
            </button>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          <SprintMetricCard label="Capacity" value={`${sprint.capacity}pts`} />
          <SprintMetricCard label="Velocity" value={`${sprint.velocity}pts`} />
          <SprintMetricCard label="Completion" value={`${Math.round(sprint.completion * 100)}%`} accent>
            <ProgressRing value={sprint.completion} size={36} stroke={3} color="var(--accent)" />
          </SprintMetricCard>
          <SprintMetricCard label="Carryover" value={sprint.carryover} warn={sprint.carryover > 0} />
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <ViewToggle view={view} onChange={setView} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost btn--sm">
            <Icon name="filter" size={13} />
            Filter
          </button>
          <button className="btn btn--ghost btn--sm">
            <Icon name="sort" size={13} />
            Sort
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'board' && (
          <Kanban tasks={sprintTasks} onTaskClick={onTaskClick} />
        )}
        {view === 'list' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
            <TaskListView tasks={sprintTasks} onTaskClick={onTaskClick} />
          </div>
        )}
      </div>
    </div>
  );
};

const SprintMetricCard = ({ label, value, accent, warn, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', minWidth: 110 }}>
    {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    <div>
      <div style={{ fontSize: 10, color: 'var(--fg-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', color: accent ? 'var(--accent)' : warn ? 'var(--amber)' : 'var(--fg)' }}>{value}</div>
    </div>
  </div>
);

const ViewToggle = ({ view, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
    {[{ id: 'board', icon: 'board', label: 'Board' }, { id: 'list', icon: 'list', label: 'List' }].map(v => (
      <button
        key={v.id}
        onClick={() => onChange(v.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', fontSize: 12, fontWeight: 500, color: view === v.id ? 'var(--fg)' : 'var(--fg-muted)', background: view === v.id ? 'var(--bg-surface-3)' : 'transparent', borderRight: '1px solid var(--border)', transition: 'all 0.1s ease' }}
      >
        <Icon name={v.icon} size={13} />
        {v.label}
      </button>
    ))}
  </div>
);

const TaskListView = ({ tasks, onTaskClick }) => {
  const groups = [
    { label: 'In progress', tasks: tasks.filter(t => t.status === 'In progress'), color: 'var(--amber)' },
    { label: 'Blocked', tasks: tasks.filter(t => t.status === 'Blocked'), color: 'var(--red)' },
    { label: 'To do', tasks: tasks.filter(t => t.status === 'To do'), color: 'var(--fg-dim)' },
    { label: 'In review', tasks: tasks.filter(t => t.status === 'In review'), color: 'var(--blue)' },
    { label: 'Done', tasks: tasks.filter(t => t.status === 'Done'), color: 'var(--green)' },
  ].filter(g => g.tasks.length > 0);

  return (
    <div style={{ paddingTop: 16, paddingBottom: 24 }}>
      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 50, background: group.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)' }}>{group.tasks.length}</span>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {group.tasks.map((task, i) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: i < group.tasks.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', background: 'var(--bg-surface-2)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
              >
                <PriorityDot priority={task.priority} />
                <TypePill type={task.type} />
                <span className="task-id">{task.id}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--fg)' }}>{task.title}</span>
                {task.carryover && <CarryoverBadge />}
                <PointsBadge points={task.points} />
                {task.branch && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '1px 6px', borderRadius: 4 }}>{task.branch}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
