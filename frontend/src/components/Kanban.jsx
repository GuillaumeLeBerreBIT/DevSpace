import { Icon } from './Icon';
import { TypePill, PriorityDot, LabelChip, PointsBadge, CarryoverBadge } from './Components';

const COLUMNS = [
  { id: 'To do', label: 'To do', color: 'var(--fg-dim)' },
  { id: 'In progress', label: 'In progress', color: 'var(--amber)' },
  { id: 'Blocked', label: 'Blocked', color: 'var(--red)' },
  { id: 'In review', label: 'In review', color: 'var(--blue)' },
  { id: 'Done', label: 'Done', color: 'var(--green)' },
];

const KanbanCard = ({ task, onClick }) => (
  <div
    onClick={() => onClick(task)}
    style={{
      background: 'var(--bg-surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 12px',
      cursor: 'pointer',
      transition: 'border-color 0.12s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.4, flex: 1 }}>{task.title}</span>
      {task.carryover && <CarryoverBadge />}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <TypePill type={task.type} />
      <PriorityDot priority={task.priority} />
      <span className="task-id">{task.id}</span>
      <span style={{ marginLeft: 'auto' }}>
        <PointsBadge points={task.points} />
      </span>
    </div>
    {task.labels && task.labels.length > 0 && (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {task.labels.map(l => <LabelChip key={l} label={l} />)}
      </div>
    )}
    {task.due && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--fg-dim)' }}>
        <Icon name="calendar" size={11} />
        <span>{task.due}</span>
      </div>
    )}
  </div>
);

const KanbanColumn = ({ column, tasks, onTaskClick, onAddTask }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 260, maxWidth: 300, flex: '0 0 280px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 12px', borderBottom: `2px solid ${column.color}22` }}>
      <span style={{ width: 8, height: 8, borderRadius: 50, background: column.color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', flex: 1 }}>{column.label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)', background: 'var(--bg-surface-2)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{tasks.length}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, flex: 1, minHeight: 80 }}>
      {tasks.map(task => (
        <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
      ))}
      <button
        onClick={() => onAddTask(column.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, color: 'var(--fg-faint)', fontSize: 12, border: '1px dashed transparent', background: 'transparent', cursor: 'pointer', transition: 'all 0.12s ease', width: '100%' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-faint)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon name="plus" size={13} />
        Add task
      </button>
    </div>
  </div>
);

export const Kanban = ({ tasks, onTaskClick }) => {
  const grouped = {};
  COLUMNS.forEach(c => { grouped[c.id] = []; });
  tasks.forEach(t => {
    if (grouped[t.status]) grouped[t.status].push(t);
  });

  const handleAddTask = () => {
    // placeholder — would open a quick-add dialog
  };

  return (
    <div style={{ display: 'flex', gap: 20, overflowX: 'auto', padding: '24px 28px', flex: 1, alignItems: 'flex-start' }}>
      {COLUMNS.map(col => (
        <KanbanColumn
          key={col.id}
          column={col}
          tasks={grouped[col.id] || []}
          onTaskClick={onTaskClick}
          onAddTask={handleAddTask}
        />
      ))}
    </div>
  );
};
