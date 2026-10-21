const STATUS_STYLES = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};
const STATUS_LABELS = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const PRIORITY_STYLES = {
  low: 'text-gray-500',
  medium: 'text-amber-600',
  high: 'text-red-600',
};

export default function TaskCard({ task, onEdit, onDelete }) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const overdue = due && task.status !== 'done' && due < new Date(new Date().toDateString());

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-gray-900">{task.title}</h3>
          <p className="text-xs text-gray-500">{task.team_name}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {task.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{task.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className={`font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}>{task.priority} priority</span>
        <span>{task.assignee_name ? `Assigned to ${task.assignee_name}` : 'Unassigned'}</span>
        {due && (
          <span className={overdue ? 'font-medium text-red-600' : ''}>
            Due {due.toLocaleDateString()}
            {overdue && ' (overdue)'}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-3 text-sm">
        <button onClick={() => onEdit(task)} className="font-medium text-indigo-600 hover:underline">
          Edit
        </button>
        <button onClick={() => onDelete(task)} className="font-medium text-red-600 hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}