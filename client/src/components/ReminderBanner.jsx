import { useState } from 'react';
import { isDueSoon, isOverdue } from '../utils/dates';

// Shown after login: my unfinished tasks that are overdue or due within 3 days
export default function ReminderBanner({ tasks, userId }) {
  const [dismissed, setDismissed] = useState(false);

  const mine = tasks.filter((t) => t.assigned_to === userId);
  const overdue = mine.filter(isOverdue);
  const soon = mine.filter((t) => isDueSoon(t, 3));

  if (dismissed || (overdue.length === 0 && soon.length === 0)) return null;

  const hasOverdue = overdue.length > 0;
  const preview = [...overdue, ...soon].slice(0, 3);

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        hasOverdue ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      <div>
        <p className="font-semibold">
          {hasOverdue && `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`}
          {hasOverdue && soon.length > 0 && ' and '}
          {soon.length > 0 && `${soon.length} due soon`}
        </p>
        <p className="mt-0.5 text-xs opacity-90">
          {preview.map((t) => t.title).join(', ')}
          {overdue.length + soon.length > 3 && ' ...'}
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-lg leading-none opacity-60 hover:opacity-100" aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}