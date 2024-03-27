const Joi = require("joi");

const songSchema = Joi.object({
  id: Joi.number().required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  book_id: Joi.string().valid("CC", "BER", "J", "CT", "Cor").required(),
  searchable_title: Joi.string(),
  searchable_content: Joi.string(),
  index: Joi.number().required(),
  tags: Joi.array().items(Joi.string()).required(),
  author: Joi.string(),
  composer: Joi.string(),
  original_title: Joi.string(),
  references: Joi.string(),
});

module.exports = songSchema;
