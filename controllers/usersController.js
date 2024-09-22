const bcrypt = require("bcrypt");
const Users = require("../db/models/users");
const Offices = require("../db/models/offices");

const getAllUsers = async (req, res) => {
  const users = await Users.findAll({
    attributes: {
      exclude: ["refreshToken", "deletedAt"],
    },
    include: [
      {
        model: Offices,
        as: "office",
        attributes: ["name"],
      },
    ],
  });
  if (!users) {
    return res.status(404).json({ error: "Users not found" });
  }
  console.log("users", users);
  const transformedUsers = users.map((user) => {
    const userJSON = user.toJSON();
    const createdAt = new Date(userJSON.createdAt)
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/(\d+)\/(\d+)\/(\d+),/, "$1/$2/$3");

    const updatedAt = new Date(userJSON.updatedAt)
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/(\d+)\/(\d+)\/(\d+),/, "$1/$2/$3");
    return {
      ...userJSON,
      role: userJSON.roleId === 2 ? "Admin" : "User",
      office: user.office.name,
      createdAt,
      updatedAt,
    };
  });
  return res.status(200).json(transformedUsers);
};

const handleUpdateUser = async (req, res) => {
  const userId = req.id;
  const { email, firstName, lastName, userName } = req.body;
  try {
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await user.update({ email, firstName, lastName, userName });
    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "server error", message: error.message });
  }
};

const handleChangePassword = async (req, res) => {
  console.log("change password");
  console.log("req id", req.id);
  const userId = req.id;
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "server error", message: error.message });
  }
};

module.exports = { getAllUsers, handleUpdateUser, handleChangePassword };
