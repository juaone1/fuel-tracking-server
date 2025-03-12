const { Op } = require("sequelize");
const Offices = require("../db/models/offices");
const Vehicles = require("../db/models/vehicles");
const FuelConsumptionRecords = require("../db/models/fuelconsumptionrecords");

const getMonitoringData = async (req, res) => {
  const { year, search } = req.query;

  if (!year) {
    return res.status(400).json({ error: "year is required" });
  }

  try {
    const officeWhereClause = search
      ? { name: { [Op.iLike]: `%${search}%` } }
      : {};

    // Fetch offices and their vehicles
    const offices = await Offices.findAll({
      where: officeWhereClause,
      attributes: ["name"],
      include: [
        {
          model: Vehicles,
          as: "vehicles",
          attributes: ["plateNumber", "id"],
        },
      ],
    });

    // Fetch fuel consumption records for the specified year
    const fuelConsumptionRecords = await FuelConsumptionRecords.findAll({
      where: { year },
      attributes: ["vehicleId", "month"],
    });

    // Transform data
    const result = offices.map((office) => {
      const vehicles = office.vehicles.map((vehicle) => vehicle.plateNumber);
      const vehicleData = {};

      office.vehicles.forEach((vehicle) => {
        const monthlyData = Array(12).fill(0);
        fuelConsumptionRecords
          .filter((record) => record.vehicleId === vehicle.id)
          .forEach((record) => {
            const monthIndex = new Date(record.month + " 1, 2022").getMonth();
            monthlyData[monthIndex] = 1;
          });
        vehicleData[vehicle.plateNumber] = monthlyData;
      });

      return {
        name: office.name,
        vehicles,
        vehicleData,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "server error", message: error.message });
  }
};

module.exports = {
  getMonitoringData,
};
