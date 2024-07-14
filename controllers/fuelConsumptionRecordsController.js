const FuelConsumptionRecords = require("../db/models/fuelconsumptionrecords");

const handleCreateFuelConsumptionRecord = async (req, res) => {
  const {
    vehicleId,
    officeId,
    year,
    month,
    startingMileage,
    endingMileage,
    litersConsumed,
    totalCost,
    fileId,
  } = req.body;

  if (
    !vehicleId ||
    !officeId ||
    !year ||
    !month ||
    !startingMileage ||
    !endingMileage ||
    !litersConsumed ||
    !totalCost
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // check if the record already exists
  const recordExists = await FuelConsumptionRecords.findOne({
    where: { vehicleId, year, month },
  });
  if (recordExists) {
    return res.status(400).json({ error: "Record already exists" });
  }

  try {
    const newRecord = await FuelConsumptionRecords.create({
      vehicleId,
      officeId,
      year,
      month,
      startingMileage,
      endingMileage,
      litersConsumed,
      totalCost,
      fileId,
    });

    if (!newRecord) {
      return res.status(500).json({ error: "Error creating record" });
    }

    return res
      .status(201)
      .json({ message: "Record created successfully", data: newRecord });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleGetAllFuelConsumptionRecords = async (req, res) => {
  try {
    const records = await FuelConsumptionRecords.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt", "deletedAt"],
      },
    });
    if (!records || records.length === 0) {
      return res.status(404).json({ error: "No records found" });
    }

    const recordsWithComputations = records.map((record) => {
      const costPerLiter = +(record.totalCost / record.litersConsumed).toFixed(
        2
      );
      const distanceTravelled = +(
        record.endingMileage - record.startingMileage
      ).toFixed(2);
      const fuelEfficiency = +(
        distanceTravelled / record.litersConsumed
      ).toFixed(2);
      return {
        ...record.dataValues,
        costPerLiter,
        distanceTravelled,
        fuelEfficiency,
      };
    });

    return res.status(200).json({ data: recordsWithComputations });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleUpdateRecord = async (req, res) => {
  const { vehicleId } = req.params;
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field is required to update the record" });
  }
  try {
    const record = await FuelConsumptionRecords.findOne({
      where: { id: vehicleId },
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const updatedRecord = await record.update(updateData);
    res
      .status(200)
      .json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleSoftDeleteRecord = async (req, res) => {
  const { recordId } = req.params;
  try {
    const result = await FuelConsumptionRecords.destroy({
      where: { id: recordId },
    });

    if (result === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.send({ message: "Record deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

module.exports = {
  handleCreateFuelConsumptionRecord,
  handleGetAllFuelConsumptionRecords,
  handleSoftDeleteRecord,
};
