// Validates req.body (or req.query) against a Joi schema.
// Strips unknown fields and replaces the input with the sanitized value.
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }

  req[source] = value;
  next();
};

module.exports = validate;