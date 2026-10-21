const pool = require('../config/db');

// Returns the user's role in a team, or null if not a member
const getRole = async (teamId, userId) => {
  const { rows } = await pool.query(
    'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  return rows[0]?.role || null;
};

// Checks that the assignee belongs to the team
const isMember = async (teamId, userId) => (await getRole(teamId, userId)) !== null;

// Loads a task only if the current user belongs to its team
const loadTaskForUser = async (taskId, userId) => {
  const { rows } = await pool.query(
    `SELECT t.* FROM tasks t
     JOIN team_members tm ON tm.team_id = t.team_id AND tm.user_id = $2
     WHERE t.id = $1`,
    [taskId, userId]
  );
  return rows[0] || null;
};

const TASK_SELECT = `
  SELECT t.*, u.name AS assignee_name, tm_team.name AS team_name
  FROM tasks t
  LEFT JOIN users u ON u.id = t.assigned_to
  JOIN teams tm_team ON tm_team.id = t.team_id
`;

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, due_date, team_id, assigned_to } = req.body;

    if (!(await isMember(team_id, req.user.id))) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (assigned_to && !(await isMember(team_id, assigned_to))) {
      return res.status(400).json({ message: 'Assignee must be a member of the team' });
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, team_id, assigned_to, created_by)
       VALUES ($1, $2, COALESCE($3, 'todo'), COALESCE($4, 'medium'), $5, $6, $7, $8)
       RETURNING id`,
      [
        title,
        description || null,
        status || null,
        priority || null,
        due_date || null,
        team_id,
        assigned_to || null,
        req.user.id,
      ]
    );

    const { rows: full } = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [rows[0].id]);
    res.status(201).json({ task: full[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks?teamId=&assigneeId=&status=&search=
// Only returns tasks from teams the user belongs to
const listTasks = async (req, res, next) => {
  try {
    const { teamId, assigneeId, status, search } = req.query;

    const conditions = ['t.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)'];
    const params = [req.user.id];

    if (teamId) {
      params.push(teamId);
      conditions.push(`t.team_id = $${params.length}`);
    }
    if (assigneeId) {
      params.push(assigneeId);
      conditions.push(`t.assigned_to = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`
      );
    }

    const { rows } = await pool.query(
      `${TASK_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY t.created_at DESC`,
      params
    );
    res.json({ tasks: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await loadTaskForUser(parseInt(req.params.id, 10), req.user.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { rows } = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [task.id]);
    res.json({ task: rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await loadTaskForUser(parseInt(req.params.id, 10), req.user.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const body = req.body;
    if (body.assigned_to && !(await isMember(task.team_id, body.assigned_to))) {
      return res.status(400).json({ message: 'Assignee must be a member of the team' });
    }

    // Only update the fields that were actually sent
    const fields = [];
    const params = [];
    for (const key of ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to']) {
      if (body[key] !== undefined) {
        params.push(body[key] === '' ? null : body[key]);
        fields.push(`${key} = $${params.length}`);
      }
    }
    fields.push('updated_at = NOW()');
    params.push(task.id);

    await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${params.length}`, params);

    const { rows } = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [task.id]);
    res.json({ task: rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id  (task creator or team owner)
const deleteTask = async (req, res, next) => {
  try {
    const task = await loadTaskForUser(parseInt(req.params.id, 10), req.user.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = await getRole(task.team_id, req.user.id);
    if (task.created_by !== req.user.id && role !== 'owner') {
      return res.status(403).json({ message: 'Only the task creator or team owner can delete this task' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [task.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };