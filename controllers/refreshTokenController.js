require("dotenv").config({ path: `${process.cwd()}/.env` });
const Users = require("../db/models/users");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  console.log("refreshToken", refreshToken);
  const userExists = await Users.findOne({ where: { refreshToken } });
  console.log("userExists", userExists);
  if (!userExists) {
    console.log("no user exists");
    return res.sendStatus(403);
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    console.log("userExists.userName", userExists.userName);
    console.log("user", user);
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
