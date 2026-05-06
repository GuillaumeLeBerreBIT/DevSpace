import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { TypePill, StatusPill, PriorityDot, PointsBadge, LabelChip, Pill, Select } from '../Components';

const TYPE_FILTERS = ['All', 'Feature', 'Bug', 'Fix', 'Chore', 'Idea', 'Docs'];
const STATUS_FILTERS = ['All', 'Backlog', 'To do', 'In progress', 'Blocked', 'In review', 'Done'];
const PRIORITY_FILTERS = ['All', 'Urgent', 'High', 'Medium', 'Low'];

export const BacklogView = ({ tasks, sprints, onTaskClick }) => {
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('status');

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, typeFilter, statusFilter, priorityFilter, search]);

  const groups = useMemo(() => {
    if (groupBy === 'status') {
      const order = ['Backlog', 'To do', 'In progress', 'Blocked', 'In review', 'Done'];
      const map = {};
      order.forEach(s => { map[s] = []; });
      filtered.forEach(t => { if (map[t.status]) map[t.status].push(t); else map['Backlog'].push(t); });
      return order.map(s => ({ key: s, label: s, tasks: map[s] })).filter(g => g.tasks.length > 0);
    }
    if (groupBy === 'type') {
      const types = ['Feature', 'Bug', 'Fix', 'Chore', 'Idea', 'Docs'];
      const map = {};
      types.forEach(s => { map[s] = []; });
      filtered.forEach(t => { if (map[t.type]) map[t.type].push(t); else map['Feature'].push(t); });
      return types.map(s => ({ key: s, label: s, tasks: map[s] })).filter(g => g.tasks.length > 0);
    }
    if (groupBy === 'sprint') {
      const sprintMap = {};
      filtered.forEach(t => {
        const key = t.sprint || 'backlog';
        if (!sprintMap[key]) sprintMap[key] = [];
        sprintMap[key].push(t);
      });
      return Object.entries(sprintMap).map(([key, taskList]) => {
        const sprint = sprints.find(s => s.id === key);
        return { key, label: sprint ? `Sprint ${sprint.num} · ${sprint.name}` : 'Backlog', tasks: taskList };
      });
    }
    return [{ key: 'all', label: 'All tasks', tasks: filtered }];
  }, [filtered, groupBy, sprints]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-dim)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            style={{ width: '100%', padding: '6px 10px 6px 32px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg)', fontSize: 12, outline: 'none' }}
          />
        </div>

        <Select value={typeFilter} onChange={setTypeFilter} options={TYPE_FILTERS} ariaLabel="Filter by type" />
        <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} ariaLabel="Filter by status" />
        <Select value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_FILTERS} ariaLabel="Filter by priority" />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--fg-dim)', alignSelf: 'center' }}>Group by</span>
          <Select value={groupBy} onChange={setGroupBy} options={[
            { value: 'status', label: 'Status' },
            { value: 'type', label: 'Type' },
            { value: 'sprint', label: 'Sprint' },
            { value: 'none', label: 'None' },
          ]} ariaLabel="Group by" />
        </div>

        <span style={{ fontSize: 11, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>{filtered.length} tasks</span>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 24px' }}>
        {groups.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-faint)', fontSize: 13 }}>No tasks match the current filters</div>
        ) : (
          groups.map(group => (
            <TaskGroup key={group.key} group={group} onTaskClick={onTaskClick} sprints={sprints} />
          ))
        )}
      </div>
    </div>
  );
};

const TaskGroup = ({ group, onTaskClick, sprints }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginBottom: 4, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)' }}
      >
        <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} size={14} />
        <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group.label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)', background: 'var(--bg-surface-2)', padding: '1px 6px', borderRadius: 100 }}>{group.tasks.length}</span>
      </button>

      {!collapsed && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {group.tasks.map((task, i) => (
            <BacklogTaskRow
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              isLast={i === group.tasks.length - 1}
              sprint={sprints.find(s => s.id === task.sprint)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BacklogTaskRow = ({ task, onClick, isLast, sprint }) => (
  <div
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)', cursor: 'pointer', background: 'var(--bg-surface-2)', transition: 'background 0.1s ease' }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
  >
    <PriorityDot priority={task.priority} />
    <TypePill type={task.type} />
    <span className="task-id" style={{ minWidth: 56 }}>{task.id}</span>
    <span style={{ flex: 1, fontSize: 13, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {(task.labels || []).slice(0, 2).map(l => <LabelChip key={l} label={l} />)}
    </div>
    {sprint && (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)', background: 'var(--bg-surface-3)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>S{sprint.num}</span>
    )}
    <StatusPill status={task.status} />
    <PointsBadge points={task.points} />
  </div>
);
