import Joi from "joi";

const reportSchema = Joi.object({
  songIndex: Joi.number().required(),
  additionalDetails: Joi.string().allow(""),
});

export default reportSchema;
