const Joi = require("joi");

const songSchema = Joi.object({
  songIndex: Joi.number().required(),
  additionalDetails: Joi.string(),
});

module.exports = songSchema;
