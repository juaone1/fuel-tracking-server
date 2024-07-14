require("dotenv").config({ path: `${process.cwd()}/.env` });
const Users = require("../db/models/users");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  const userExists = await Users.findOne({ where: { refreshToken } });
  if (!userExists) {
    return res.sendStatus(403);
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err || userExists.userName !== user.userName)
      return res.sendStatus(403);
    const accessToken = jwt.sign(
      { username: userExists.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30s" }
    );
    res.json({ accessToken });
  });
};

module.exports = { handleRefreshToken };
