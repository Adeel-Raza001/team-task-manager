import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TeamModal from '../components/TeamModal';
import TaskModal from '../components/TaskModal';
import MembersPanel from '../components/MembersPanel';
import KanbanBoard from '../components/KanbanBoard';
import StatsCards from '../components/StatsCards';
import ReminderBanner from '../components/ReminderBanner';
import Avatar from '../components/Avatar';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]); // filtered, shown on the board
  const [allTasks, setAllTasks] = useState([]); // unfiltered, used for stats + reminders
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterMembers, setFilterMembers] = useState([]);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [taskModal, setTaskModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedTeam = teams.find((t) => String(t.id) === String(selectedTeamId));

  const loadTeams = useCallback(async () => {
    const res = await api.get('/teams');
    setTeams(res.data.teams);
  }, []);

  const loadTasks = useCallback(async () => {
    setError('');
    try {
      const params = {};
      if (selectedTeamId) params.teamId = selectedTeamId;
      if (assigneeFilter) params.assigneeId = assigneeFilter === 'me' ? user.id : assigneeFilter;
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const [filtered, all] = await Promise.all([api.get('/tasks', { params }), api.get('/tasks')]);
      setTasks(filtered.data.tasks);
      setAllTasks(all.data.tasks);
    } catch {
      setError('Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, assigneeFilter, statusFilter, debouncedSearch, user.id]);

  useEffect(() => {
    loadTeams().catch(() => setError('Could not load teams'));
  }, [loadTeams]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    setAssigneeFilter('');
    if (!selectedTeamId) {
      setFilterMembers([]);
      return;
    }
    api
      .get(`/teams/${selectedTeamId}`)
      .then((res) => setFilterMembers(res.data.members))
      .catch(() => setFilterMembers([]));
  }, [selectedTeamId]);

  const handleTeamCreated = async (team) => {
    setShowTeamModal(false);
    await loadTeams();
    setSelectedTeamId(String(team.id));
    toast('Team created');
  };

  const handleTeamDeleted = async () => {
    setSelectedTeamId('');
    await loadTeams();
    loadTasks();
    toast('Team deleted');
  };

  const handleTaskSaved = (wasEdit) => {
    setTaskModal(null);
    loadTasks();
    toast(wasEdit ? 'Task updated' : 'Task created');
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      loadTasks();
      toast('Task deleted');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not delete task', 'error');
    }
  };

  // Used by drag-and-drop and the mobile "Move to" dropdown
  const handleStatusChange = async (task, status) => {
    // Optimistic update so the card moves instantly
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await api.put(`/tasks/${task.id}`, { status });
      loadTasks();
      toast('Task moved');
    } catch (err) {
      loadTasks();
      toast(err.response?.data?.message || 'Could not move task', 'error');
    }
  };

  const selectTeam = (id) => {
    setSelectedTeamId(id);
    setSidebarOpen(false);
  };

  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle teams"
          >
            &#9776;
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            T
          </span>
          <h1 className="text-lg font-bold text-gray-900">Team Task Manager</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Avatar name={user.name} />
            <span className="hidden text-gray-700 sm:inline">{user.name}</span>
          </div>
          <button onClick={logout} className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100">
            Logout
          </button>
        </div>
      </header>

      <div className="relative flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } absolute inset-y-0 left-0 z-20 w-64 border-r border-gray-200 bg-white p-4 shadow-lg md:static md:block md:shadow-none`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Teams</h2>
            <button
              onClick={() => setShowTeamModal(true)}
              className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              + New
            </button>
          </div>

          <button
            onClick={() => selectTeam('')}
            className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
              selectedTeamId === '' ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All teams
          </button>
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTeam(String(t.id))}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                String(t.id) === String(selectedTeamId)
                  ? 'bg-indigo-50 font-medium text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="truncate">{t.name}</span>
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{t.member_count}</span>
            </button>
          ))}
          {teams.length === 0 && <p className="mt-2 text-sm text-gray-500">No teams yet. Create one to get started.</p>}
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
          <ReminderBanner tasks={allTasks} userId={user.id} />
          <StatsCards tasks={allTasks} />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${selectClass} min-w-0 flex-1 sm:max-w-xs`}
            />
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={selectClass}>
              <option value="">Any assignee</option>
              <option value="me">Assigned to me</option>
              {filterMembers
                .filter((m) => m.id !== user.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
              <option value="">Any status</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <button
              onClick={() => setTaskModal({})}
              disabled={teams.length === 0}
              title={teams.length === 0 ? 'Create a team first' : ''}
              className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + New task
            </button>
          </div>

          {selectedTeam && (
            <MembersPanel
              key={selectedTeam.id}
              team={selectedTeam}
              onTeamDeleted={handleTeamDeleted}
              onMembersChanged={() => {
                loadTeams();
                api
                  .get(`/teams/${selectedTeam.id}`)
                  .then((res) => setFilterMembers(res.data.members))
                  .catch(() => {});
              }}
            />
          )}

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <KanbanBoard
              tasks={tasks}
              onEdit={(t) => setTaskModal({ task: t })}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          )}
        </main>
      </div>

      {showTeamModal && <TeamModal onClose={() => setShowTeamModal(false)} onCreated={handleTeamCreated} />}
      {taskModal && (
        <TaskModal
          task={taskModal.task}
          teams={teams}
          defaultTeamId={selectedTeamId ? Number(selectedTeamId) : undefined}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
        />
      )}
    </div>
  );
}