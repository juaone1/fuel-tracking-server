const { Sequelize, Op } = require("sequelize");
const bcrypt = require("bcrypt");
const Users = require("../db/models/users");
const Offices = require("../db/models/offices");

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { userName: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { "$office.name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await Users.findAndCountAll({
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
      where: whereClause,
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Users not found" });
    }

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

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      data: transformedUsers,
    });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
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
  const userId = req.id;
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid old password" });
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

const handleUpdateUserAdmin = async (req, res) => {
  const {
    id,
    email,
    firstName,
    lastName,
    username,
    password,
    adminPassword,
    officeId,
    roleId,
  } = req.body;
  try {
    const user = await Users.findByPk(id);
    console.log("user found", user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (password) {
      // check if admin password is correct
      const admin = await Users.findByPk(req.id);
      const validPassword = await bcrypt.compare(adminPassword, admin.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid admin password" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({
        email,
        firstName,
        lastName,
        userName: username,
        password: hashedPassword,
        officeId,
        roleId,
      });
    } else {
      await user.update({
        email,
        firstName,
        lastName,
        userName: username,
        officeId,
        roleId,
      });
    }
    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "server error", message: error.message });
  }
};

const handleSoftDeleteUser = async (req, res) => {
  const userId = req.id;
  const { id } = req.params;
  try {
    const user = await Users.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.id === userId) {
      return res.status(403).json({ error: "You cannot delete yourself" });
    }
    await user.destroy();
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "server error", message: error.message });
  }
};

module.exports = {
  getAllUsers,
  handleUpdateUser,
  handleChangePassword,
  handleUpdateUserAdmin,
  handleSoftDeleteUser,
};
