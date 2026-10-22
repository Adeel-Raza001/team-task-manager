import { isOverdue } from '../utils/dates';

export default function StatsCards({ tasks }) {
  const stats = [
    { label: 'Total tasks', value: tasks.length, style: 'text-gray-900', bar: 'bg-indigo-500' },
    {
      label: 'In progress',
      value: tasks.filter((t) => t.status === 'in_progress').length,
      style: 'text-blue-600',
      bar: 'bg-blue-500',
    },
    {
      label: 'Completed',
      value: tasks.filter((t) => t.status === 'done').length,
      style: 'text-emerald-600',
      bar: 'bg-emerald-500',
    },
    {
      label: 'Overdue',
      value: tasks.filter(isOverdue).length,
      style: 'text-red-600',
      bar: 'bg-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className={`h-1 ${s.bar}`} />
          <div className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.style}`}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}