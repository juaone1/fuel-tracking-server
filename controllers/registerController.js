const bcrypt = require("bcrypt");
const Users = require("../db/models/users");

const handleNewUser = async (req, res) => {
  const body = req.body;
  const { username, password } = body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  //Check if the username already exists
  const userExists = await Users.findOne({ where: { userName: username } });
  if (userExists) {
    return res.status(400).json({ error: "Username already exists" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Users.create({
      firstName: body.firstName,
      lastName: body.lastName,
      userName: username,
      password: hashedPassword,
      email: body.email,
      officeId: body.officeId,
      roleId: body.roleId,
    });

    if (!newUser) {
      return res.status(500).json({ error: "Error creating user" });
    }
    return res
      .status(201)
      .json({ message: "User created successfully", data: newUser });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

module.exports = { handleNewUser };
