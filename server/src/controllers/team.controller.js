const pool = require('../config/db');

// POST /api/teams
const createTeam = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { name, description } = req.body;
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO teams (name, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, req.user.id]
    );
    const team = rows[0];

    // Creator automatically becomes the owner
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [team.id, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ team: { ...team, role: 'owner' } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/teams  (only teams I belong to)
const listTeams = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, tm.role,
              (SELECT COUNT(*)::int FROM team_members WHERE team_id = t.id) AS member_count
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json({ teams: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/teams/:id  (team + members)
const getTeam = async (req, res, next) => {
  try {
    const { rows: teamRows } = await pool.query('SELECT * FROM teams WHERE id = $1', [
      req.teamId,
    ]);
    const { rows: members } = await pool.query(
      `SELECT u.id, u.name, u.email, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [req.teamId]
    );
    res.json({ team: { ...teamRows[0], role: req.membership.role }, members });
  } catch (err) {
    next(err);
  }
};

// PUT /api/teams/:id  (owner only)
const updateTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { rows } = await pool.query(
      `UPDATE teams
       SET name = COALESCE($1, name),
           description = CASE WHEN $2::boolean THEN $3 ELSE description END
       WHERE id = $4 RETURNING *`,
      [name ?? null, description !== undefined, description ?? null, req.teamId]
    );
    res.json({ team: rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/teams/:id  (owner only)
const deleteTeam = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [req.teamId]);
    res.json({ message: 'Team deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/teams/:id/members  (owner only, add by email)
const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows: users } = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    // Stubbed invite flow (bonus): no SMTP, we just log what would be sent
    if (users.length === 0) {
      console.log(`[invite stub] Would send invite email to ${email} for team ${req.teamId}`);
      return res.status(404).json({
        message: 'No user with that email. An invite would be sent (stubbed, no email service).',
      });
    }

    const user = users[0];
    const existing = await pool.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [req.teamId, user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User is already a member' });
    }

    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')`,
      [req.teamId, user.id]
    );
    res.status(201).json({ member: { ...user, role: 'member' } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/teams/:id/members/:userId  (owner removes anyone, member removes self)
const removeMember = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const isOwner = req.membership.role === 'owner';
    if (!isOwner && userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only remove yourself' });
    }

    const { rows } = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [req.teamId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }
    if (rows[0].role === 'owner') {
      return res.status(400).json({ message: 'The owner cannot be removed; delete the team instead' });
    }

    await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [
      req.teamId,
      userId,
    ]);
    // Their tasks in this team become unassigned
    await pool.query(
      'UPDATE tasks SET assigned_to = NULL WHERE team_id = $1 AND assigned_to = $2',
      [req.teamId, userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTeam, listTeams, getTeam, updateTeam, deleteTeam, addMember, removeMember };