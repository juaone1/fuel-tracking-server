const Users = require("../db/models/users");

const getAllUsers = async (req, res) => {
  const users = await Users.findAll({
    attributes: {
      exclude: [
        "password",
        "refreshToken",
        // "createdAt",
        // "updatedAt",
        "deletedAt",
      ],
    },
  });
  if (!users) {
    return res.status(404).json({ error: "Users not found" });
  }
  delete users.password;
  return res.status(200).json(users);
};

module.exports = { getAllUsers };
