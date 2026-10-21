const express = require('express');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireTeamMember, requireTeamOwner } = require('../middleware/teamAccess');
const {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
} = require('../validators/team.validator');
const ctrl = require('../controllers/team.controller');

const router = express.Router();

// Every team route requires a logged-in user
router.use(requireAuth);

router.post('/', validate(createTeamSchema), ctrl.createTeam);
router.get('/', ctrl.listTeams);

router.get('/:id', requireTeamMember, ctrl.getTeam);
router.put('/:id', requireTeamMember, requireTeamOwner, validate(updateTeamSchema), ctrl.updateTeam);
router.delete('/:id', requireTeamMember, requireTeamOwner, ctrl.deleteTeam);

router.post(
  '/:id/members',
  requireTeamMember,
  requireTeamOwner,
  validate(addMemberSchema),
  ctrl.addMember
);
router.delete('/:id/members/:userId', requireTeamMember, ctrl.removeMember);

module.exports = router;