const Users = require("../db/models/users");
const Offices = require("../db/models/offices");

const getAllUsers = async (req, res) => {
  const users = await Users.findAll({
    attributes: {
      exclude: ["password", "refreshToken", "deletedAt"],
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

module.exports = { getAllUsers };
