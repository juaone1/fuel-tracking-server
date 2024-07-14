require("dotenv").config({ path: `${process.cwd()}/.env` });
const jwt = require("jsonwebtoken");
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user.username;
    next();
  });
};

module.exports = verifyJWT;
