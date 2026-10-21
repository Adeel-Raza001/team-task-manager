const pool = require('../config/db');

// Loads the user's membership for :id and attaches it to req.membership.
// Returns 404 (not 403) for non-members so team IDs can't be probed.
const requireTeamMember = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team id' });
    }

    const { rows } = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    req.teamId = teamId;
    req.membership = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

// Use after requireTeamMember: only the team owner may continue
const requireTeamOwner = (req, res, next) => {
  if (req.membership.role !== 'owner') {
    return res.status(403).json({ message: 'Only the team owner can do this' });
  }
  next();
};

module.exports = { requireTeamMember, requireTeamOwner };