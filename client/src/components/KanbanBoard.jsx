import { useState } from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'todo', label: 'To do', dot: 'bg-gray-400' },
  { key: 'in_progress', label: 'In progress', dot: 'bg-blue-500' },
  { key: 'done', label: 'Done', dot: 'bg-emerald-500' },
];

// Three columns; drag a card onto another column to change its status
export default function KanbanBoard({ tasks, onEdit, onDelete, onStatusChange }) {
  const [overColumn, setOverColumn] = useState(null);

  const handleDrop = (e, status) => {
    e.preventDefault();
    setOverColumn(null);
    const id = Number(e.dataTransfer.getData('text/plain'));
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) onStatusChange(task, status);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(col.key);
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(e) => handleDrop(e, col.key)}
            className={`rounded-2xl border p-3 transition ${
              overColumn === col.key ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-100/60'
            }`}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
              <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500">
                {items.length}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              ))}
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-gray-300 py-6 text-center text-xs text-gray-400">
                  Drop tasks here
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}