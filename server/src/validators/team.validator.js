const Joi = require('joi');

const createTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow('', null),
});

const updateTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow('', null),
}).min(1);

const addMemberSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
});

module.exports = { createTeamSchema, updateTeamSchema, addMemberSchema };