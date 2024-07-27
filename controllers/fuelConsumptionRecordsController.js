const FuelConsumptionRecords = require("../db/models/fuelconsumptionrecords");
const Vehicles = require("../db/models/vehicles");
const sequelize = require("sequelize");

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
    // !startingMileage ||
    // !endingMileage ||
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
    const { vehicleId, year } = req.query;

    const whereClause = {};
    if (vehicleId) {
      whereClause.vehicleId = vehicleId;
    }
    if (year) {
      whereClause.year = year;
    }

    const records = await FuelConsumptionRecords.findAll({
      where: whereClause,
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
  // const { recordId } = req.params;
  const { vehicleId, month } = req.query;
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field is required to update the record" });
  }
  try {
    const record = await FuelConsumptionRecords.findOne({
      where: { vehicleId: vehicleId, month: month },
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

const handleGetTotalConsumedDataByVehicle = async (req, res) => {
  const { vehicleId, year } = req.query;

  if (!vehicleId || !year) {
    return res.status(400).json({ error: "VehicleId and year are required" });
  }

  try {
    // Assuming you have already associated FuelConsumptionRecords with vehicles
    const vehicle = await Vehicles.findOne({
      where: { id: vehicleId },
      attributes: ["plateNumber"], // Only fetch the plateNumber
    });

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    const records = await FuelConsumptionRecords.findAll({
      where: { vehicleId, year },
      attributes: [
        "month",
        [sequelize.fn("SUM", sequelize.col("litersConsumed")), "totalLiters"],
      ],
      group: "month",
      order: [["month", "ASC"]],
      raw: true,
    });
    let totalLitersConsumed = 0;
    const seriesData = new Array(12).fill(0);
    // Function to convert month name to 0-indexed month number
    const monthToIndex = (month) => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return months.indexOf(month);
    };

    records.forEach((record) => {
      const monthIndex = monthToIndex(record.month); // Convert month name to 0-indexed month number
      const liters = parseFloat(record.totalLiters);
      if (monthIndex >= 0) {
        // Ensure the month name was valid and found
        seriesData[monthIndex] = liters;
        totalLitersConsumed += liters;
      }
    });

    const response = {
      totalLitersConsumed,
      series: [
        {
          name: vehicle.plateNumber,
          data: seriesData,
        },
      ],
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching fuel consumption data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleGetTotalCostDataByVehicle = async (req, res) => {
  const { vehicleId, year } = req.query;

  if (!vehicleId || !year) {
    return res.status(400).json({ error: "VehicleId and year are required" });
  }

  try {
    // Assuming you have already associated FuelConsumptionRecords with vehicles
    const vehicle = await Vehicles.findOne({
      where: { id: vehicleId },
      attributes: ["plateNumber"], // Only fetch the plateNumber
    });

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    const records = await FuelConsumptionRecords.findAll({
      where: { vehicleId, year },
      attributes: [
        "month",
        [sequelize.fn("SUM", sequelize.col("totalCost")), "totalCost"],
      ],
      group: "month",
      order: [["month", "ASC"]],
      raw: true,
    });
    let totalOverallCost = 0;
    const seriesData = new Array(12).fill(0);
    // Function to convert month name to 0-indexed month number
    const monthToIndex = (month) => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return months.indexOf(month);
    };

    records.forEach((record) => {
      const monthIndex = monthToIndex(record.month); // Convert month name to 0-indexed month number
      const cost = parseFloat(record.totalCost);
      if (monthIndex >= 0) {
        // Ensure the month name was valid and found
        seriesData[monthIndex] = cost;
        totalOverallCost += cost;
      }
    });

    const response = {
      totalOverallCost,
      series: [
        {
          name: vehicle.plateNumber,
          data: seriesData,
        },
      ],
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching fuel consumption data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  handleCreateFuelConsumptionRecord,
  handleGetAllFuelConsumptionRecords,
  handleSoftDeleteRecord,
  handleUpdateRecord,
  handleGetTotalConsumedDataByVehicle,
  handleGetTotalCostDataByVehicle,
};
