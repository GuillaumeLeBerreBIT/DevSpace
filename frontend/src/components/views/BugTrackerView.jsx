import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { Input } from '../ui/input';
import { TypePill, StatusPill, PriorityDot, PointsBadge, LabelChip, Pill } from '../Components';

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const SEVERITY_COLORS = { Critical: 'var(--red)', Major: '#ff8c4d', Minor: 'var(--amber)', Trivial: 'var(--fg-dim)' };

export const BugTrackerView = ({ tasks, onTaskClick }) => {
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');

  const bugs = useMemo(() => {
    return tasks.filter(t => t.type === 'Bug').filter(t => {
      if (filter === 'open') return t.status !== 'Done';
      if (filter === 'closed') return t.status === 'Done';
      return true;
    }).filter(t => {
      if (!search) return true;
      return t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    });
  }, [tasks, filter, search]);

  const grouped = useMemo(() => {
    const map = {};
    SEVERITIES.forEach(s => { map[s] = []; });
    map['Unknown'] = [];
    bugs.forEach(b => {
      const sev = b.severity || 'Unknown';
      if (map[sev]) map[sev].push(b);
      else map['Unknown'].push(b);
    });
    return [...SEVERITIES, 'Unknown'].map(s => ({ severity: s, bugs: map[s] })).filter(g => g.bugs.length > 0);
  }, [bugs]);

  const openCount = tasks.filter(t => t.type === 'Bug' && t.status !== 'Done').length;
  const closedCount = tasks.filter(t => t.type === 'Bug' && t.status === 'Done').length;
  const criticalCount = tasks.filter(t => t.type === 'Bug' && t.severity === 'Critical' && t.status !== 'Done').length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <StatChip label="Open" value={openCount} color="var(--red)" />
        <StatChip label="Closed" value={closedCount} color="var(--green)" />
        <StatChip label="Critical" value={criticalCount} color="var(--red)" highlight />
      </div>

      {/* Toolbar */}
      <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          {[{ id: 'open', label: 'Open' }, { id: 'closed', label: 'Closed' }, { id: 'all', label: 'All' }].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, color: filter === f.id ? 'var(--fg)' : 'var(--fg-muted)', background: filter === f.id ? 'var(--bg-surface-3)' : 'transparent', borderRight: '1px solid var(--border)' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-65">
          <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bugs…"
            className="pl-8 h-8 text-xs"
          />
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>{bugs.length} bugs</span>
      </div>

      {/* Bug list grouped by severity */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 24px' }}>
        {grouped.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--fg-faint)', fontSize: 13 }}>
            {filter === 'closed' ? 'No closed bugs' : 'No bugs found'}
          </div>
        ) : (
          grouped.map(group => (
            <SeverityGroup
              key={group.severity}
              severity={group.severity}
              bugs={group.bugs}
              onBugClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

const StatChip = ({ label, value, color, highlight }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 6, background: highlight && value > 0 ? 'var(--red-soft)' : 'var(--bg-surface-2)', border: `1px solid ${highlight && value > 0 ? 'var(--red)' : 'var(--border)'}` }}>
    <span style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', color: highlight && value > 0 ? color : 'var(--fg)' }}>{value}</span>
    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{label}</span>
  </div>
);

const SeverityGroup = ({ severity, bugs, onBugClick }) => {
  const [collapsed, setCollapsed] = useState(false);
  const color = SEVERITY_COLORS[severity] || 'var(--fg-dim)';

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginBottom: 4, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)' }}
      >
        <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} size={14} />
        <span style={{ width: 8, height: 8, borderRadius: 50, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>{severity}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)', background: 'var(--bg-surface-2)', padding: '1px 6px', borderRadius: 100 }}>{bugs.length}</span>
      </button>

      {!collapsed && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {bugs.map((bug, i) => (
            <BugRow
              key={bug.id}
              bug={bug}
              onClick={() => onBugClick(bug)}
              isLast={i === bugs.length - 1}
              color={color}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BugRow = ({ bug, onClick, isLast, color }) => (
  <div
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)', cursor: 'pointer', background: 'var(--bg-surface-2)', transition: 'background 0.1s ease' }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
  >
    <span style={{ width: 6, height: 6, borderRadius: 50, background: color, flexShrink: 0 }} />
    <PriorityDot priority={bug.priority} />
    <span className="task-id" style={{ minWidth: 56 }}>{bug.id}</span>
    <span style={{ flex: 1, fontSize: 13, color: bug.status === 'Done' ? 'var(--fg-muted)' : 'var(--fg)', textDecoration: bug.status === 'Done' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.title}</span>
    {bug.branch && (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '1px 6px', borderRadius: 4 }}>{bug.branch}</span>
    )}
    {bug.pr && (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--blue)', background: 'var(--blue-soft)', padding: '1px 6px', borderRadius: 4 }}>{bug.pr}</span>
    )}
    <StatusPill status={bug.status} />
    <PointsBadge points={bug.points} />
  </div>
);
