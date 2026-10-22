import Avatar from './Avatar';
import { isOverdue, parseDue } from '../utils/dates';

const PRIORITY = {
  low: { border: 'border-l-gray-300', text: 'text-gray-500' },
  medium: { border: 'border-l-amber-400', text: 'text-amber-600' },
  high: { border: 'border-l-red-500', text: 'text-red-600' },
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const due = parseDue(task.due_date);
  const overdue = isOverdue(task);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(task.id))}
      className={`cursor-grab rounded-xl border border-l-4 border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${PRIORITY[task.priority].border}`}
    >
      <h3 className="font-medium text-gray-900">{task.title}</h3>
      <p className="text-xs text-gray-500">{task.team_name}</p>

      {task.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{task.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={`font-semibold capitalize ${PRIORITY[task.priority].text}`}>{task.priority}</span>
        {due && (
          <span className={overdue ? 'font-semibold text-red-600' : 'text-gray-500'}>
            {overdue ? 'Overdue: ' : 'Due '}
            {due.toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {task.assignee_name ? (
            <>
              <Avatar name={task.assignee_name} size="sm" />
              <span>{task.assignee_name}</span>
            </>
          ) : (
            <span className="italic">Unassigned</span>
          )}
        </div>
        <div className="flex gap-3 text-xs font-medium">
          <button onClick={() => onEdit(task)} className="text-indigo-600 hover:underline">
            Edit
          </button>
          <button onClick={() => onDelete(task)} className="text-red-600 hover:underline">
            Delete
          </button>
        </div>
      </div>

      <select
        value={task.status}
        onChange={(e) => onStatusChange(task, e.target.value)}
        className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 md:hidden"
        aria-label="Move task to"
      >
        <option value="todo">Move to: To do</option>
        <option value="in_progress">Move to: In progress</option>
        <option value="done">Move to: Done</option>
      </select>
    </div>
  );
}