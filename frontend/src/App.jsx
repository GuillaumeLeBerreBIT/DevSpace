import react, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useProjects } from './hooks/useProjects';
import { useSprints, useCreateSprint } from './hooks/useSprints';
import { useTasks, useBacklog } from './hooks/useTasks';
import { LoginScreen } from './components/LoginScreen';
import { Icon } from './components/Icon';
import { Button } from './components/ui/button';
import { Pill, ProgressBar } from './components/Components';
import { Dashboard } from './components/Dashboard';
import { TaskPanel } from './components/TaskPanel';
import { CreateSprintModal } from './components/CreateSprintModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { SprintOverview } from './components/views/SprintOverview';
import { BacklogView } from './components/views/BacklogView';
import { BugTrackerView } from './components/views/BugTrackerView';
import { DocsView } from './components/views/DocsView';
import { DevLogView } from './components/views/DevLogView';
import { StackView } from './components/views/StackView';
import { SnippetVaultView } from './components/views/SnippetVaultView';

const formatNow = () => {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

// ─── Rail ────────────────────────────────────────────────────────────────────

const Rail = ({ projects, activeProjectId, onProjectSelect, onAddProject }) => (
  <div className="rail">
    <div className="rail__logo">DS</div>
    <div className="rail__divider" />
    {projects.map(p => (
      <button
        key={p.id}
        title={p.name}
        onClick={() => onProjectSelect(p)}
        className={`rail__project${activeProjectId === p.id ? ' rail__project--active' : ''}`}
        style={activeProjectId === p.id ? { borderColor: p.color + '88', background: p.color + '22', color: p.color } : {}}
      >
        {p.key}
      </button>
    ))}
    <button className="rail__add" title="New project" onClick={onAddProject}>
      <Icon name="plus" size={14} />
    </button>
    <div className="rail__bottom">
      <Button variant="ghost" size="icon" title="Settings">
        <Icon name="settings" size={16} />
      </Button>
    </div>
  </div>
);

// ─── NavItem ──────────────────────────────────────────────────────────────────

const NavItem = ({ icon, label, active, count, onClick }) => (
  <button className={`nav-item${active ? ' nav-item--active' : ''}`} onClick={onClick}>
    <Icon name={icon} size={15} className="nav-item__icon" />
    <span>{label}</span>
    {count != null && <span className="nav-item__count">{count}</span>}
  </button>
);

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const Sidebar = ({ project, sprints, tasks = [], activeView, activeSprint, onViewChange, onSprintSelect, onCreateSprint, onProjectSettings }) => {
  const sprintStatusDot = { active: 'var(--green)', completed: 'var(--fg-dim)', planned: 'var(--blue)' };
  const bugCount = tasks.filter(t => t.type === 'Bug' && t.status !== 'Done').length;
  const backlogCount = tasks.filter(t => !t.sprint || t.status === 'Backlog').length;

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__project">
          <span className="sidebar__project-dot" style={{ background: project.color }} />
          <span>{project.name}</span>
          <Button variant="ghost" size="icon" style={{ marginLeft: 'auto', width: 24, height: 24 }} onClick={onProjectSettings}>
            <Icon name="settings" size={13} />
          </Button>
        </div>
        <div className="sidebar__project-meta">
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-faint)' }}>{project.key}</span>
          <span>·</span>
          <Pill kind={project.status}>{project.status}</Pill>
        </div>
      </div>

      <nav className="sidebar__nav">
        <NavItem icon="home" label="Overview" active={activeView === 'overview'} onClick={() => onViewChange('overview')} />
        <NavItem icon="board" label="Kanban" active={activeView === 'sprint'} onClick={() => onViewChange('sprint')} />
        <NavItem icon="list" label="Backlog" active={activeView === 'backlog'} count={backlogCount} onClick={() => onViewChange('backlog')} />
        <NavItem icon="bug" label="Bug tracker" active={activeView === 'bugs'} count={bugCount > 0 ? bugCount : null} onClick={() => onViewChange('bugs')} />

        <div className="sidebar__section-label">
          <span>Sprints</span>
          <button style={{ color: 'var(--fg-faint)', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }} onClick={onCreateSprint}>
            <Icon name="plus" size={12} />
          </button>
        </div>
        {sprints.map(s => (
          <button
            key={s.id}
            className={`sprint-item${activeSprint?.id === s.id ? ' sprint-item--active' : ''}`}
            onClick={() => { onSprintSelect(s); onViewChange('sprint'); }}
          >
            <span className="sprint-item__num">S{s.num}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{s.name}</span>
            <span className="sprint-item__status" style={{ background: sprintStatusDot[s.status] || 'var(--fg-dim)' }} />
          </button>
        ))}

        <div className="sidebar__section-label">Tools</div>
        <NavItem icon="docs" label="Docs" active={activeView === 'docs'} onClick={() => onViewChange('docs')} />
        <NavItem icon="log" label="Dev log" active={activeView === 'devlog'} onClick={() => onViewChange('devlog')} />
        <NavItem icon="layers" label="Stack" active={activeView === 'stack'} onClick={() => onViewChange('stack')} />
        <NavItem icon="snippet" label="Snippet vault" active={activeView === 'snippets'} onClick={() => onViewChange('snippets')} />
      </nav>

      <div className="sidebar__footer">
        <div className="avatar">G</div>
        <div>
          <div className="sidebar__footer-name">Guillaume</div>
          <div className="sidebar__footer-sub">Solo dev</div>
        </div>
      </div>
    </div>
  );
};

// ─── DashboardSidebar ─────────────────────────────────────────────────────────

const DashboardSidebar = ({ projects, onProjectSelect }) => (
  <div className="sidebar">
    <div className="sidebar__header">
      <div className="sidebar__project" style={{ gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>DS</span>
        <span>DevSpace</span>
      </div>
      <div className="sidebar__project-meta">
        <span>All projects</span>
      </div>
    </div>
    <nav className="sidebar__nav">
      <NavItem icon="home" label="Dashboard" active={true} onClick={() => {}} />
      <div className="sidebar__section-label">Projects</div>
      {projects.map(p => (
        <button
          key={p.id}
          className="nav-item"
          onClick={() => onProjectSelect(p)}
        >
          <span style={{ width: 8, height: 8, borderRadius: 50, background: p.color, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{p.name}</span>
          <Pill kind={p.status} className="">{p.status}</Pill>
        </button>
      ))}
    </nav>
    <div className="sidebar__footer">
      <div className="avatar">G</div>
      <div>
        <div className="sidebar__footer-name">Guillaume</div>
        <div className="sidebar__footer-sub">Solo dev</div>
      </div>
    </div>
  </div>
);

// ─── TopBar ───────────────────────────────────────────────────────────────────

const TopBar = ({ project, view, sprint, onNewTask }) => {
  const viewLabels = {
    overview: 'Overview',
    sprint: sprint ? `Sprint ${sprint.num} · ${sprint.name}` : 'Sprint',
    backlog: 'Backlog',
    bugs: 'Bug tracker',
    docs: 'Docs',
    devlog: 'Dev log',
    stack: 'Stack & env',
    snippets: 'Snippet vault',
    dashboard: 'Dashboard',
  };

  return (
    <div className="topbar">
      <div className="topbar__left">
        <div className="topbar__breadcrumb">
          {project && (
            <>
              <span style={{ color: 'var(--fg-muted)' }}>{project.name}</span>
              <span className="topbar__breadcrumb-sep">/</span>
            </>
          )}
          <span className="topbar__title">{viewLabels[view] || view}</span>
        </div>
      </div>
      <div className="topbar__right">
        <span className="topbar__date">{formatNow()}</span>
        {view !== 'dashboard' && (
          <Button size="sm" onClick={onNewTask}>
            <Icon name="plus" size={13} />
            New task
          </Button>
        )}
      </div>
    </div>
  );
};

// ─── ProjectView ──────────────────────────────────────────────────────────────

const ProjectView = ({ project }) => {
  const [view, setView] = useState('sprint');
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: sprints = [] } = useSprints(project.id);
  const [activeSprint, setActiveSprint] = useState(null);

  // Once sprints load, default to active sprint (or first); user can override by clicking a sprint
  const resolvedSprint = activeSprint ?? sprints.find(s => s.status === 'active') ?? sprints[0] ?? null;

  const { data: sprintTasks = [] } = useTasks(project.id, resolvedSprint?.id);
  const { data: backlogTasks = [] } = useBacklog(project.id);

  const createSprint = useCreateSprint();

  const handleCreateSprint = (data) => {
    createSprint.mutate(
      { ...data, project: project.id },
      {
        onSuccess: (newSprint) => {
          setActiveSprint(newSprint);
          setView('sprint');
          setShowCreateSprint(false);
        },
      }
    );
  };

  const nextSprintNum = sprints.length > 0 ? Math.max(...sprints.map(s => s.num)) + 1 : 1;

  // All tasks combined — used by bug tracker and sidebar counts
  const allTasks = [...sprintTasks, ...backlogTasks];

  // Which sprint should a new task be assigned to? Only on the sprint board.
  const newTaskSprintId = view === 'sprint' ? resolvedSprint?.id ?? null : null;
  const newTaskSprintName = view === 'sprint' && resolvedSprint
    ? `Sprint ${resolvedSprint.num} · ${resolvedSprint.name}`
    : null;

  return (
    <>
      <Sidebar
        project={project}
        sprints={sprints}
        tasks={allTasks}
        activeView={view}
        activeSprint={resolvedSprint}
        onViewChange={setView}
        onSprintSelect={setActiveSprint}
        onCreateSprint={() => setShowCreateSprint(true)}
        onProjectSettings={() => setShowSettings(true)}
      />
      <div className="main">
        <TopBar project={project} view={view} sprint={resolvedSprint} onNewTask={() => setShowCreateTask(true)} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {view === 'overview' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
              <div style={{ maxWidth: 680 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: 'var(--fg)' }}>{project.name}</h2>
                <p style={{ margin: '0 0 20px', color: 'var(--fg-muted)' }}>{project.tagline}</p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  {(project.stack || []).map(s => (
                    <span key={s} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--fg-muted)' }}>{s}</span>
                  ))}
                </div>
                <ProgressBar value={project.progress} color={project.color} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--fg-dim)' }}>
                  <span>{project.openTasks} open tasks</span>
                  <span>{Math.round(project.progress * 100)}% complete</span>
                </div>
              </div>
            </div>
          )}
          {view === 'sprint' && (
            <SprintOverview
              sprint={resolvedSprint}
              tasks={sprintTasks}
              onTaskClick={setSelectedTask}
              onCreateSprint={() => setShowCreateSprint(true)}
            />
          )}
          {view === 'backlog' && (
            <BacklogView tasks={backlogTasks} sprints={sprints} onTaskClick={setSelectedTask} />
          )}
          {view === 'bugs' && (
            <BugTrackerView tasks={allTasks} onTaskClick={setSelectedTask} />
          )}
          {view === 'docs' && <DocsView project={project} />}
          {view === 'devlog' && <DevLogView project={project} />}
          {view === 'stack' && <StackView />}
          {view === 'snippets' && <SnippetVaultView project={project} />}
        </div>
      </div>

      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          allTasks={allTasks}
        />
      )}
      {showCreateTask && (
        <CreateTaskModal
          projectId={project.id}
          sprintId={newTaskSprintId}
          sprintName={newTaskSprintName}
          onClose={() => setShowCreateTask(false)}
        />
      )}
      {showCreateSprint && (
        <CreateSprintModal
          nextNum={nextSprintNum}
          onClose={() => setShowCreateSprint(false)}
          onCreate={handleCreateSprint}
        />
      )}
      {showSettings && (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowSettings(false)}
          onSave={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { isLoggedIn } = useAuth();

  // Auth gate — show login screen until the user has a valid token in memory
  if (!isLoggedIn) return <LoginScreen />;

  const { data: projects = [] } = useProjects();
  const [activeProject, setActiveProject] = useState(null); // null = dashboard

  return (
    <div className="app">
      <Rail
        projects={projects}
        activeProjectId={activeProject?.id}
        onProjectSelect={setActiveProject}
        onAddProject={() => {}}
      />

      {activeProject ? (
        <ProjectView
          key={activeProject.id}
          project={activeProject}
        />
      ) : (
        <>
          <DashboardSidebar projects={projects} onProjectSelect={setActiveProject} />
          <div className="main">
            <TopBar project={null} view="dashboard" sprint={null} onNewTask={() => {}} />
            <Dashboard onProjectSelect={setActiveProject} onTaskClick={() => {}} />
          </div>
        </>
      )}
    </div>
  );
}
