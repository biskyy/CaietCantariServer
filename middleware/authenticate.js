import jwt from "jsonwebtoken";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const authenticate = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unathorized" });

  jwt.verify(token, PRIVATE_KEY, (err, decoded) => {
    // an admin should have the username field set in their jwt. this logic should probably be refactored
    if (err || !decoded.username)
      return res.status(401).json({ message: "Invalid JWT token" });

    console.log(decoded);

    req.user = decoded;
    next();
  });
};

export default authenticate;
