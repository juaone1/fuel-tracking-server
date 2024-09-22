require("dotenv").config({ path: `${process.cwd()}/.env` });
const jwt = require("jsonwebtoken");
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user.userInfo.userName;
    req.role = user.userInfo.role;
    req.officeId = user.userInfo.officeId;
    req.id = user.userInfo.id;
    next();
  });
};

module.exports = verifyJWT;
