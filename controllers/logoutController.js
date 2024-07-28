const Users = require("../db/models/users");
const handleLogout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204);

  const refreshToken = cookies.jwt;
  const userExists = await Users.findOne({ where: { refreshToken } });

  if (!userExists) {
    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "none" });
    return res.sendStatus(204);
  }

  userExists.refreshToken = null;
  await userExists.save();

  res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "none" });
  return res.sendStatus(204);
};

module.exports = { handleLogout };
