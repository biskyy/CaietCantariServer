import crypto from "crypto";
import Client from "../models/clientModel.js";

const getIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];

  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  if (realIp) return realIp.trim();
  return null;
};

const hashIp = (ip, secret) => {
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
};

const rateLimitByIp = (limit = 1, window = 10000) => {
  return async (req, res, next) => {
    try {
      // Skip rate-limiting in development
      if (process.env.NODE_ENV === "DEV") return next();

      const ip = getIp(req);
      const method = req.method;
      const route = req.baseUrl;

      if (!ip) return res.status(400).json({ message: "IP Address not found" });

      const secret = process.env.RATE_LIMIT_SECRET;
      if (!secret) {
        console.error("RATE_LIMIT_SECRET is not set.");
        return res.status(500).json({ message: "Server misconfiguration" });
      }

      const hashedIp = hashIp(ip, secret);

      let client = (await Client.findOne({ ip: hashedIp }).exec()) || {
        ip: hashedIp,
        trackers: {},
      };

      let tracker = client.trackers[method + route] || {
        count: 0,
        expiresAt: 0,
      };

      // Reset the tracker if the window has expired
      if (tracker.expiresAt < Date.now()) {
        tracker.count = 0;
        tracker.expiresAt = Date.now() + window;
      }

      tracker.count++;

      client.trackers[method + route] = tracker;

      if (tracker.count > limit) {
        return res.status(429).json({
          message: "You have to wait a little bit between requests.",
        });
      }

      await Client.findOneAndUpdate({ ip: hashedIp }, client, { upsert: true });

      return next();
    } catch (err) {
      console.error("Rate limit middleware error: ", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

export default rateLimitByIp;
