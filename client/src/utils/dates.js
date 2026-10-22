// Parses 'YYYY-MM-DD' as a local date (no timezone shift)
export const parseDue = (value) => (value ? new Date(`${value.slice(0, 10)}T00:00:00`) : null);

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isOverdue = (task) => {
  const due = parseDue(task.due_date);
  return Boolean(due) && task.status !== 'done' && due < startOfToday();
};

// Due today or within the next `days` days
export const isDueSoon = (task, days = 3) => {
  const due = parseDue(task.due_date);
  if (!due || task.status === 'done') return false;
  const today = startOfToday();
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);
  return due >= today && due <= limit;
};