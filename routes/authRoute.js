import express from "express";
const router = express.Router();

import Joi from "joi";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimitByIp from "../middleware/limiter.js";

const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const privateKey = process.env.PRIVATE_KEY;

router.post("/", rateLimitByIp(3, 10000), async (req, res) => {
  try {
    await Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    }).validateAsync(req.body);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const { username, password } = req.body;

    if (username !== adminUsername)
      res.status(404).json({ message: "Incorrect username" });
    else if (!bcrypt.compareSync(password, adminPassword))
      res.status(404).json({ message: "Incorrect password" });
    else {
      const token = jwt.sign(
        { username: adminUsername, password: adminPassword },
        privateKey,
      );

      res.status(200).json({ message: "Logged in", token });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
