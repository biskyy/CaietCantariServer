import Joi from "joi";

const clientSchema = Joi.object({
  ip: Joi.string().required(),
  //count: Joi.number().required(),
  //expiresAt: Joi.date().required(),
  trackers: Joi.object(),
});

export default clientSchema;
