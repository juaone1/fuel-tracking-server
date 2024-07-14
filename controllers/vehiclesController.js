const Vehicles = require("../db/models/vehicles");

const handleCreateVehicle = async (req, res) => {
  const {
    officeId,
    name,
    plateNumber,
    model,
    fuelTypeId,
    categoryId,
    yearModel,
    yearAcquired,
    isOwned,
    vehicleStatus,
  } = req.body;

  if (!officeId || !name || !plateNumber) {
    return res
      .status(400)
      .json({ error: "Office ID, name, and plate number are required" });
  }

  // check if the vehicle already exists
  const vehicleExists = await Vehicles.findOne({ where: { plateNumber } });
  if (vehicleExists) {
    return res.status(400).json({ error: "Vehicle already exists" });
  }

  try {
    const newVehicle = await Vehicles.create({
      officeId,
      name,
      plateNumber,
      model,
      fuelTypeId,
      categoryId,
      yearModel,
      yearAcquired,
      isOwned,
      vehicleStatus,
    });

    if (!newVehicle) {
      return res.status(500).json({ error: "Error creating vehicle" });
    }

    return res
      .status(201)
      .json({ message: "Vehicle created successfully", data: newVehicle });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleGetAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicles.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt", "deletedAt"],
      },
    });
    if (!vehicles) {
      return res.status(404).json({ error: "Vehicles not found" });
    }
    return res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleGetVehiclesByOfficeId = async (req, res) => {
  try {
    const officeId = req.params.officeId; // Assuming officeId is passed as a URL parameter
    const vehicles = await Vehicles.findAll({
      where: {
        officeId: officeId,
        deletedAt: null, // If you're using soft deletes, exclude deleted records
      },
    });
    if (vehicles.length === 0) {
      return res
        .status(404)
        .send({ message: "No vehicles found for this office." });
    }
    res.send(vehicles);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error retrieving vehicles.", error: error.message });
  }
};

const handleUpdateVehicle = async (req, res) => {
  const { vehicleId } = req.params;
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field is required to update the vehicle" });
  }
  try {
    const vehicle = await Vehicles.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const updatedVehicle = await vehicle.update(updateData);

    return res
      .status(200)
      .json({ message: "Vehicle updated successfully", data: updatedVehicle });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleSoftDeleteVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    // Soft delete the vehicle
    const result = await Vehicles.destroy({
      where: { id: vehicleId },
    });

    if (result === 0) {
      return res.status(404).send({ message: "Vehicle not found." });
    }

    res.send({ message: "Vehicle deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error deleting vehicle.", error: error.message });
  }
};

module.exports = {
  handleCreateVehicle,
  handleGetAllVehicles,
  handleGetVehiclesByOfficeId,
  handleUpdateVehicle,
  handleSoftDeleteVehicle,
};
