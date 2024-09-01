const FuelConsumptionRecords = require("../db/models/fuelconsumptionrecords");
const Vehicles = require("../db/models/vehicles");
const sequelize = require("sequelize");
const handleGetTotalSpentFuel = async (req, res) => {
  const { fuelType } = req.query;
  const role = req.role;
  const officeId = req.officeId;
  const currentYear = new Date().getFullYear();

  try {
    const whereConditions = {
      year: currentYear,
    };
    if (role && role !== 2 && officeId) {
      whereConditions.officeId = officeId;
    }

    if (fuelType) {
      whereConditions["$vehicle.fuelTypeId$"] = fuelType;
    }

    const totalSpentFuel = await FuelConsumptionRecords.findAll({
      attributes: [
        [sequelize.fn("sum", sequelize.col("totalCost")), "totalSpentFuel"],
        "month",
      ],
      include: [
        {
          model: Vehicles,
          as: "vehicle",
          attributes: [],
        },
      ],
      where: whereConditions,
      group: ["month", "vehicle.id"],
      order: [[sequelize.col("month"), "ASC"]],
    });

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

    const monthData = Array(12).fill(0);
    totalSpentFuel.forEach((record) => {
      const monthIndex = months.indexOf(record.dataValues.month);
      if (monthIndex !== -1) {
        monthData[monthIndex] += parseFloat(record.dataValues.totalSpentFuel);
      }
    });

    const lastMonthIndex = monthData.reduce((lastIndex, value, index) => {
      return value !== 0 ? index : lastIndex;
    }, 0);

    const responseMonths = months.slice(0, lastMonthIndex + 1);
    const responseSeries = { data: monthData.slice(0, lastMonthIndex + 1) };

    const totalSpentFuelRounded = parseFloat(
      monthData.reduce((acc, val) => acc + val, 0).toFixed(2)
    );

    return res.status(200).json({
      totalSpentFuel: totalSpentFuelRounded,
      months: responseMonths,
      series: [responseSeries],
    });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleGetTotalLitersConsumed = async (req, res) => {
  const role = req.role;
  const officeId = req.officeId;
  const currentYear = new Date().getFullYear();

  try {
    const whereConditions = {
      year: currentYear,
    };
    if (role && role !== 2 && officeId) {
      whereConditions.officeId = officeId;
    }

    const fuelTypes = [
      { id: 1, name: "Gasoline" },
      { id: 2, name: "Diesel" },
    ];

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

    const results = await Promise.all(
      fuelTypes.map(async (fuelType) => {
        const fuelWhereConditions = {
          ...whereConditions,
          "$vehicle.fuelTypeId$": fuelType.id,
        };

        const totalLiters = await FuelConsumptionRecords.findAll({
          attributes: [
            [
              sequelize.fn("sum", sequelize.col("litersConsumed")),
              "litersConsumed",
            ],
            "month",
          ],
          include: [
            {
              model: Vehicles,
              as: "vehicle",
              attributes: [],
            },
          ],
          where: fuelWhereConditions,
          group: ["month", "vehicle.id"],
          order: [[sequelize.col("month"), "ASC"]],
        });

        const monthData = Array(12).fill(0);
        let totalLitersConsumed = 0;
        totalLiters.forEach((record) => {
          const monthIndex = months.indexOf(record.dataValues.month);
          if (monthIndex !== -1) {
            let liters = parseFloat(record.dataValues.litersConsumed);
            liters = parseFloat(liters.toFixed(2));
            monthData[monthIndex] += liters;
            monthData[monthIndex] = parseFloat(
              monthData[monthIndex].toFixed(2)
            );
            totalLitersConsumed += liters;
          }
        });

        totalLitersConsumed = parseFloat(totalLitersConsumed.toFixed(2));

        return {
          name: fuelType.name,
          data: monthData,
          totalLitersConsumed,
        };
      })
    );

    return res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

module.exports = {
  handleGetTotalSpentFuel,
  handleGetTotalLitersConsumed,
};
