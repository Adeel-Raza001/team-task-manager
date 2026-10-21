const express = require('express');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} = require('../validators/task.validator');
const ctrl = require('../controllers/task.controller');

const router = express.Router();

router.use(requireAuth);

router.post('/', validate(createTaskSchema), ctrl.createTask);
router.get('/', validate(listTasksQuerySchema, 'query'), ctrl.listTasks);
router.get('/:id', ctrl.getTask);
router.put('/:id', validate(updateTaskSchema), ctrl.updateTask);
router.delete('/:id', ctrl.deleteTask);

module.exports = router;