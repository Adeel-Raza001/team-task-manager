import { useEffect, useState } from 'react';
import Modal from './Modal';
import api from '../api/axios';

// Pass `task` to edit, omit it to create. `teams` fills the team dropdown.
export default function TaskModal({ task, teams, defaultTeamId, onClose, onSaved }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
    team_id: task?.team_id || defaultTeamId || teams[0]?.id || '',
    assigned_to: task?.assigned_to || '',
  });
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reload assignee options whenever the selected team changes
  useEffect(() => {
    if (!form.team_id) return;
    api
      .get(`/teams/${form.team_id}`)
      .then((res) => setMembers(res.data.members))
      .catch(() => setMembers([]));
  }, [form.team_id]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      };
      if (isEdit) {
        await api.put(`/tasks/${task.id}`, payload);
      } else {
        await api.post('/tasks', { ...payload, team_id: Number(form.team_id) });
      }
      onSaved(isEdit);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.errors?.join(', ') || data?.message || 'Could not save task');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'mb-1 block text-xs font-medium text-gray-600';

  return (
    <Modal title={isEdit ? 'Edit task' : 'Create task'} onClose={onClose}>
      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input value={form.title} onChange={set('title')} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea rows={3} value={form.description} onChange={set('description')} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Team</label>
            <select
              value={form.team_id}
              onChange={(e) => setForm({ ...form, team_id: e.target.value, assigned_to: '' })}
              disabled={isEdit}
              className={inputClass}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Assignee</label>
            <select value={form.assigned_to} onChange={set('assigned_to')} className={inputClass}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={set('status')} className={inputClass}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select value={form.priority} onChange={set('priority')} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Due date</label>
          <input type="date" value={form.due_date} onChange={set('due_date')} className={inputClass} />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}