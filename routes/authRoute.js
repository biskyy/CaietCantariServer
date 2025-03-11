import express from "express";
const router = express.Router();

import Joi from "joi";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { rateLimitByJWT, rateLimitRoute } from "../middleware/limiter.js";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

router.get("/token", rateLimitRoute(5, 60000), async (req, res) => {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY not set up");
    }

    const token = jwt.sign({ uuid: uuidv4() }, privateKey, {
      expiresIn: 60 * 60 * 1,
    }); // 1 hour

    return res.status(200).json({ token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", rateLimitByJWT(3, 30000), async (req, res) => {
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

    if (!PRIVATE_KEY) throw new Error("Auth Route: PRIVATE_KEY not set up");

    if (username !== ADMIN_USERNAME)
      return res.status(401).json({ message: "Incorrect username" });

    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD);

    if (!isPasswordValid)
      return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign({ username: ADMIN_USERNAME }, PRIVATE_KEY);

    return res.status(200).json({ message: "Logged in", token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
});

export default router;
