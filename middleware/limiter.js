import crypto from "crypto";
import jwt from "jsonwebtoken";
import Client from "../models/clientModel.js";
import Route from "../models/routeModel.js";

const SECRET = process.env.RATE_LIMIT_SECRET;

const getIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];

  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  if (realIp) return realIp.trim();
  return null;
};

const hashIdentifier = (identifier, secret) => {
  return crypto.createHmac("sha256", secret).update(identifier).digest("hex");
};

export const rateLimitRoute = (limit = 5, window = 30000) => {
  return async (req, res, next) => {
    try {
      if (process.env.NODE_DEV === "DEV") return next();

      const method = req.method;
      const routePath = req.baseUrl;
      const route = method + routePath;

      const routeTracker = (await Route.findOne({
        route: route,
      }).exec()) || {
        route: method + routePath,
        count: 0,
        expiresAt: 0,
      };

      // tracker has expired reset counter
      if (routeTracker.expiresAt < Date.now()) {
        routeTracker.count = 0;
        routeTracker.expiresAt = Date.now() + window;
      }

      routeTracker.count++;

      if (routeTracker.count > limit) {
        throw new Error("Rate limit exceeded");
      }

      await Route.findOneAndUpdate({ route: route }, routeTracker, {
        upsert: true,
      });

      return next();
    } catch (err) {
      if (err.message === "Rate limit exceeded") {
        return res.status(429).json({
          message: "You have to wait a little bit between requests.",
        });
      }

      console.error("Rate limit middleware error: ", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

const rateLimitByIdentifier = async (
  identifier,
  method,
  route,
  limit,
  window,
) => {
  if (!identifier) {
    throw new Error("Identifier not provided");
  }

  if (!SECRET) {
    throw new Error("Rate limit secret not configured");
  }

  let client = (await Client.findOne({ identifier }).exec()) || {
    identifier,
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
    throw new Error("Rate limit exceeded");
  }

  await Client.findOneAndUpdate({ identifier }, client, {
    upsert: true,
  });
};

// console.log(req.apiGateway.event.requestContext.identity.sourceIp);
// this is one way to get the api of the client through api gateway.
// x-real-ip or x-forwarded-for wont work with api gateway/lambda
const rateLimitByIp = (limit = 1, window = 10000) => {
  return async (req, res, next) => {
    try {
      if (process.env.NODE_ENV === "DEV") return next();

      const ip = getIp(req);
      const method = req.method;
      const route = req.baseUrl;

      const hashedIp = hashIdentifier(ip, SECRET);

      await rateLimitByIdentifier(hashedIp, method, route, limit, window);

      return next();
    } catch (err) {
      if (err.message === "Rate limit exceeded") {
        return res.status(429).json({
          message: "You have to wait a little bit between requests.",
        });
      }

      console.error("Rate limit middleware error: ", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

export const rateLimitByJWT = (limit, window) => {
  return async (req, res, next) => {
    // default arguments dont work because this is a function that returns a middleware and express doesnt like that?
    limit = limit ?? 2;
    window = window ?? 10000;

    try {
      if (process.env.NODE_ENV === "DEV") return next();

      const token = req.headers.authorization?.split(" ")[1];
      const method = req.method;
      const route = req.baseUrl;

      if (!token) {
        return res.status(400).json({ message: "JWT token not provided" });
      }

      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("PRIVATE_KEY not set up");
      }

      let decoded;
      try {
        let payload = jwt.verify(token, privateKey);
        decoded = payload;
      } catch (err) {
        return res.status(400).json({ message: "Invalid JWT token" });
      }
      //jwt.verify(token, privateKey, (err, payload) => {
      //  console.log("reached");
      //  // if the jwt is either expired or forged(bad signature) discard it
      //  decoded = payload;
      //});
      //console.log(decoded);

      await rateLimitByIdentifier(decoded.uuid, method, route, limit, window);

      return next();
    } catch (err) {
      if (err.message === "Rate limit exceeded") {
        return res.status(429).json({
          message: "You have to wait a little bit between requests.",
        });
      }

      console.error("Rate limit middleware error: ", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
