import jwt from "jsonwebtoken";
const privateKey = process.env.PRIVATE_KEY;

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "Unathorized" });

  jwt.verify(token, privateKey, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    req.user = decoded;
    next();
  });
};

export default authenticate;
