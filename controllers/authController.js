require("dotenv").config({ path: `${process.cwd()}/.env` });
const bcrypt = require("bcrypt");
const Users = require("../db/models/users");
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const user = await Users.findOne({ where: { userName: username } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const accessToken = jwt.sign(
    {
      userInfo: {
        id: user.id,
        userName: user.userName,
        role: user.roleId,
        officeId: user.officeId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
  const refreshToken = jwt.sign(
    { id: user.id, userName: user.userName },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  await user.update({ refreshToken });
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 86400000,
  });

  return res.status(200).json({ accessToken, message: "Login successful" });
};

module.exports = { handleLogin };
