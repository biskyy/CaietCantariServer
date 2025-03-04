import Joi from "joi";

const routeSchema = Joi.object({
  route: Joi.string().required(),
  count: Joi.number().required(),
  expiresAt: Joi.date().required(),
});

export default routeSchema;
