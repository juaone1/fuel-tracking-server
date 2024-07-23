const Offices = require("../db/models/offices");

const handleCreateOffice = async (req, res) => {
  let { name, abbreviation, color } = req.body;
  // Sanitize and ensure inputs are strings
  name = typeof name === "string" ? name.trim() : "";
  abbreviation = typeof abbreviation === "string" ? abbreviation.trim() : "";
  color = typeof color === "string" ? color.trim() : "";

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  // check if the office already exists
  const officeExists = await Offices.findOne({ where: { name } });
  if (officeExists) {
    return res.status(400).json({ error: "Office already exists" });
  }

  try {
    const newOffice = await Offices.create({
      name,
      abbreviation,
      color,
    });

    if (!newOffice) {
      return res.status(500).json({ error: "Error creating office" });
    }

    return res
      .status(201)
      .json({ message: "Office created successfully", data: newOffice });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleGetAllOffices = async (req, res) => {
  const role = req.role;
  const officeId = req.officeId;

  console.log("role", role);
  console.log("officeId", officeId);
  try {
    const offices = await Offices.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt", "deletedAt"],
      },
      where: role && role !== 2 && officeId ? { id: officeId } : {},
    });

    return res.status(200).json({ data: offices });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleUpdateOffice = async (req, res) => {
  const { officeId } = req.params;
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field is required to update the vehicle" });
  }
  try {
    const office = await Offices.findByPk(officeId);

    if (!office) {
      return res.status(404).json({ error: "Office not found" });
    }

    const updatedOffice = await office.update(updateData);

    return res
      .status(200)
      .json({ message: "Office updated successfully", data: updatedOffice });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleSoftDeleteOffice = async (req, res) => {
  const { officeId } = req.params;

  try {
    const office = await Offices.findByPk(officeId);

    if (!office) {
      return res.status(404).json({ error: "Office not found" });
    }

    await office.destroy();

    return res.status(200).json({ message: "Office deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

module.exports = {
  handleCreateOffice,
  handleGetAllOffices,
  handleUpdateOffice,
  handleSoftDeleteOffice,
};
