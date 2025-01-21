import Client from "../models/clientModel.js";
import bcrypt from "bcryptjs";

const getIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];

  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  if (realIp) return realIp.trim();

  return null;
};

const rateLimitByIp = (limit = 1, window = 10000) => {
  return async (req, res, next) => {
    try {
      // skip rate-limiting if we are in dev environment
      if (process.env.NODE_ENV === "DEV") return next();

      const ip = getIp(req);
      const method = req.method;
      const route = req.baseUrl;
      //console.log(method, route);

      if (!ip) return res.status(400).json({ message: "IP Adress not found" });

      const hashedIp = await bcrypt.hash(ip, process.env.SALT);

      let client = (await Client.findOne({ ip: hashedIp }).exec()) || {
        ip: hashedIp,
        trackers: {},
      };

      let tracker = client.trackers[method + route] || {
        count: 0,
        expiresAt: 0,
      };

      // reset the count if the tracker expired
      if (tracker.expiresAt < Date.now()) {
        tracker.count = 0;
        tracker.expiresAt = Date.now() + window;
      }

      tracker.count++;

      client.trackers[method + route] = tracker;

      if (tracker.count > limit) {
        return res.status(429).json({
          message: "You have to wait a little bit inbetween requests.",
        });
      }

      //console.log(hashedIp);
      //console.log(client);

      await Client.findOneAndUpdate({ ip: hashedIp }, client, { upsert: true });

      return next();
    } catch (err) {
      console.error("rate limit middleware error: ", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

export default rateLimitByIp;
