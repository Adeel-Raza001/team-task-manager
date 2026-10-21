const Joi = require('joi');

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(2000).allow('', null),
  status: Joi.string().valid(...STATUSES),
  priority: Joi.string().valid(...PRIORITIES),
  due_date: Joi.date().iso().allow(null, ''),
  team_id: Joi.number().integer().positive().required(),
  assigned_to: Joi.number().integer().positive().allow(null),
});

// team_id cannot be changed after creation
const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().max(2000).allow('', null),
  status: Joi.string().valid(...STATUSES),
  priority: Joi.string().valid(...PRIORITIES),
  due_date: Joi.date().iso().allow(null, ''),
  assigned_to: Joi.number().integer().positive().allow(null),
}).min(1);

const listTasksQuerySchema = Joi.object({
  teamId: Joi.number().integer().positive(),
  assigneeId: Joi.number().integer().positive(),
  status: Joi.string().valid(...STATUSES),
  search: Joi.string().trim().max(100).allow(''),
});

module.exports = { createTaskSchema, updateTaskSchema, listTasksQuerySchema };