import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '../Icon';
import { Button } from '../ui/button';
import { TypePill, StatusPill, PriorityDot, PointsBadge, CarryoverBadge, ProgressRing, ProgressBar, PlaceholderRect } from '../Components';
import { Kanban } from '../Kanban';

const TYPE_FILTERS = ['All', 'Feature', 'Bug', 'Fix', 'Chore', 'Idea', 'Docs'];
const PRIORITY_FILTERS = ['All', 'Urgent', 'High', 'Medium', 'Low'];
const SORT_OPTIONS = [
  { value: 'created', label: 'Created (newest)' },
  { value: 'priority', label: 'Priority' },
  { value: 'points-desc', label: 'Points (high → low)' },
  { value: 'points-asc', label: 'Points (low → high)' },
  { value: 'title', label: 'Title (A→Z)' },
];

const PRIORITY_RANK = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

export const SprintOverview = ({ sprint, tasks, onTaskClick, onCreateSprint, onCompleteSprint, onStartSprint, onEditSprint }) => {
  const [view, setView] = useState('board');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  // All hooks must run before any conditional return — Rules of Hooks.
  const sprintTasks = useMemo(
    () => sprint ? tasks.filter(t => t.sprint === sprint.id) : [],
    [tasks, sprint]
  );

  const visibleTasks = useMemo(() => {
    let result = sprintTasks;
    if (typeFilter !== 'All') result = result.filter(t => t.type === typeFilter);
    if (priorityFilter !== 'All') result = result.filter(t => t.priority === priorityFilter);

    const sorted = [...result];
    if (sortBy === 'priority') {
      sorted.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99));
    } else if (sortBy === 'points-desc') {
      sorted.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    } else if (sortBy === 'points-asc') {
      sorted.sort((a, b) => (a.points ?? 0) - (b.points ?? 0));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return sorted;
  }, [sprintTasks, typeFilter, priorityFilter, sortBy]);

  const activeFilterCount = (typeFilter !== 'All' ? 1 : 0) + (priorityFilter !== 'All' ? 1 : 0);

  if (!sprint) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Icon name="sprint" size={22} style={{ color: 'var(--fg-dim)' }} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>No active sprint</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--fg-muted)' }}>Create a sprint to start organizing your work into focused cycles.</p>
          <Button onClick={onCreateSprint}>
            <Icon name="plus" size={14} />
            Create sprint
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sprint header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--accent-line)' }}>Sprint {sprint.num}</span>
              <span style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{sprint.date_range || sprint.dateRange}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>{sprint.name}</h2>
            {sprint.goal && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--fg-muted)', maxWidth: 560 }}>{sprint.goal}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Button size="sm" variant="ghost" onClick={onEditSprint} title="Edit sprint">
              <Icon name="settings" size={13} />
            </Button>
            {sprint.status === 'planned' && (
              <Button size="sm" variant="secondary" onClick={() => onStartSprint(sprint.id)}
                style={{ background: 'var(--blue)', color: 'white', borderColor: 'transparent' }}>
                <Icon name="arrowRight" size={13} />
                Start sprint
              </Button>
            )}
            {sprint.status !== 'completed' && sprint.status !== 'planned' && (
              <Button
                size="sm"
                variant={confirmComplete ? 'default' : 'secondary'}
                onClick={() => setConfirmComplete(c => !c)}
                style={confirmComplete ? { background: 'var(--green)', color: 'white' } : {}}
              >
                <Icon name="check" size={13} />
                Complete sprint
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onCreateSprint}>
              <Icon name="plus" size={13} />
              New sprint
            </Button>
          </div>
        </div>

        {/* Complete sprint confirmation */}
        {confirmComplete && sprint.status !== 'completed' && (() => {
          const openCount = sprintTasks.filter(t => t.status !== 'Done').length;
          return (
            <div style={{ margin: '0 0 16px', padding: 12, background: 'rgba(70, 167, 88, 0.08)', border: '1px solid var(--green)', borderRadius: 6, fontSize: 12, color: 'var(--fg)' }}>
              <p style={{ margin: '0 0 8px' }}>
                Mark <strong>Sprint {sprint.num}</strong> as completed?
                {openCount > 0 && (
                  <span style={{ color: 'var(--amber)', marginLeft: 6 }}>
                    {openCount} task{openCount !== 1 ? 's' : ''} not done — {openCount !== 1 ? 'they' : 'it'} will carry over to the next sprint.
                  </span>
                )}
              </p>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmComplete(false)}>Cancel</Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => { onCompleteSprint(sprint.id); setConfirmComplete(false); }}
                  style={{ background: 'var(--green)', color: 'white' }}
                >
                  Complete sprint
                </Button>
              </div>
            </div>
          );
        })()}

        {/* Completed badge */}
        {sprint.status === 'completed' && (
          <div style={{ marginBottom: 12, padding: '6px 12px', background: 'rgba(70, 167, 88, 0.08)', border: '1px solid var(--green)', borderRadius: 6, fontSize: 12, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={12} />
            Sprint completed
          </div>
        )}

        {/* Metric cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          <SprintMetricCard label="Capacity" value={`${sprint.capacity}pts`} />
          <SprintMetricCard label="Velocity" value={`${sprint.velocity}pts`} />
          <SprintMetricCard label="Completion" value={`${sprint.completion ?? 0}%`} accent>
            <ProgressRing value={(sprint.completion ?? 0) / 100} size={36} stroke={3} color="var(--accent)" />
          </SprintMetricCard>
          <SprintMetricCard label="Carryover" value={sprint.carryover} warn={sprint.carryover > 0} />
        </div>
      </div>

      {/* View toggle + filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, position: 'relative' }}>
        <ViewToggle view={view} onChange={setView} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, position: 'relative' }}>
          <FilterPopover
            open={filterOpen}
            onOpenChange={setFilterOpen}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            activeCount={activeFilterCount}
          />
          <SortPopover open={sortOpen} onOpenChange={setSortOpen} sortBy={sortBy} setSortBy={setSortBy} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'board' && (
          <Kanban tasks={visibleTasks} onTaskClick={onTaskClick} />
        )}
        {view === 'list' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
            <TaskListView tasks={visibleTasks} onTaskClick={onTaskClick} />
          </div>
        )}
      </div>
    </div>
  );
};

// Simple popover used for filter + sort. Anchored to its trigger button.
// Closes when you click outside.
const Popover = ({ open, onOpenChange, trigger, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOpenChange(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onOpenChange]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {trigger}
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', padding: 10, minWidth: 200 }}>
          {children}
        </div>
      )}
    </div>
  );
};

const FilterPopover = ({ open, onOpenChange, typeFilter, setTypeFilter, priorityFilter, setPriorityFilter, activeCount }) => (
  <Popover
    open={open}
    onOpenChange={onOpenChange}
    trigger={
      <Button variant="ghost" size="sm" onClick={() => onOpenChange(!open)}>
        <Icon name="filter" size={13} />
        Filter
        {activeCount > 0 && (
          <span style={{ marginLeft: 4, padding: '0 6px', borderRadius: 100, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{activeCount}</span>
        )}
      </Button>
    }
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FilterGroup label="Type" value={typeFilter} options={TYPE_FILTERS} onChange={setTypeFilter} />
      <FilterGroup label="Priority" value={priorityFilter} options={PRIORITY_FILTERS} onChange={setPriorityFilter} />
      {activeCount > 0 && (
        <button
          onClick={() => { setTypeFilter('All'); setPriorityFilter('All'); }}
          style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '4px 0' }}
        >
          Clear filters
        </button>
      )}
    </div>
  </Popover>
);

const FilterGroup = ({ label, value, options, onChange }) => (
  <div>
    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-faint)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: '3px 8px',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 500,
            background: value === opt ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
            color: value === opt ? 'var(--accent)' : 'var(--fg-muted)',
            border: `1px solid ${value === opt ? 'var(--accent-line)' : 'var(--border)'}`,
            cursor: 'pointer',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const SortPopover = ({ open, onOpenChange, sortBy, setSortBy }) => (
  <Popover
    open={open}
    onOpenChange={onOpenChange}
    trigger={
      <Button variant="ghost" size="sm" onClick={() => onOpenChange(!open)}>
        <Icon name="sort" size={13} />
        Sort
      </Button>
    }
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => { setSortBy(opt.value); onOpenChange(false); }}
          style={{
            padding: '6px 8px',
            fontSize: 12,
            textAlign: 'left',
            background: sortBy === opt.value ? 'var(--accent-soft)' : 'transparent',
            color: sortBy === opt.value ? 'var(--accent)' : 'var(--fg)',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
          onMouseEnter={e => { if (sortBy !== opt.value) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { if (sortBy !== opt.value) e.currentTarget.style.background = 'transparent'; }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </Popover>
);

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

  if (tasks.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-faint)', fontSize: 13 }}>
        No tasks match the current filters
      </div>
    );
  }

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
