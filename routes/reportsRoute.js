import express from "express";
const router = express.Router();

import reportValidationSchema from "../validation/reportValidation.js";
import authenticate from "../middleware/authenticate.js";
import { rateLimitByJWT } from "../middleware/limiter.js";
import Report from "../models/reportModel.js";

router.get("/", rateLimitByJWT(), async (req, res) => {
  console.log("reached");
  try {
    const reports = await Report.find({}).exec();
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", rateLimitByJWT(1, 20000), async (req, res) => {
  try {
    await reportValidationSchema.validateAsync(req.body);
  } catch (validationError) {
    return res.status(400).json({ message: validationError.message });
  }

  try {
    const { songIndex, additionalDetails } = req.body;
    await Report.create({ songIndex, additionalDetails });
    return res.status(200).send("The report got uploaded successfully");
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.delete("/", authenticate, async (req, res) => {
  try {
    const { _id } = req.body;
    await Report.deleteOne({ _id });
    res.status(200).send("The report got deleted successfully");
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
