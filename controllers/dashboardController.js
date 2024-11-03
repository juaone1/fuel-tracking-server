const FuelConsumptionRecords = require("../db/models/fuelconsumptionrecords");
const SubsidyRecords = require("../db/models/subsidyrecords");
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

    const totalSpentSubsidy = await SubsidyRecords.findAll({
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
        let totalSpent = parseFloat(record.dataValues.totalSpentFuel);
        if (!isNaN(totalSpent)) {
          monthData[monthIndex] += totalSpent;
        }
      }
    });

    totalSpentSubsidy.forEach((record) => {
      const monthIndex = months.indexOf(record.dataValues.month);
      if (monthIndex !== -1) {
        let totalSpent = parseFloat(record.dataValues.totalSpentFuel);
        if (!isNaN(totalSpent)) {
          monthData[monthIndex] += totalSpent;
        }
      }
    });

    // Round each value in monthData to 2 decimal places
    const roundedMonthData = monthData.map((value) => {
      const roundedValue = parseFloat(value.toFixed(2));
      return isNaN(roundedValue) ? 0 : roundedValue;
    });

    const lastMonthIndex = roundedMonthData.reduce(
      (lastIndex, value, index) => {
        return value !== 0 ? index : lastIndex;
      },
      0
    );

    const responseMonths = months.slice(0, lastMonthIndex + 1);
    const responseSeries = {
      data: roundedMonthData.slice(0, lastMonthIndex + 1),
    };

    const totalSpentFuelRounded = parseFloat(
      monthData.reduce((acc, val) => acc + val, 0).toFixed(2)
    );
    const totalSpentFuelFormatted = parseFloat(
      totalSpentFuelRounded
    ).toLocaleString("en-US");
    return res.status(200).json({
      totalSpentFuel: totalSpentFuelFormatted,
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

        const totalLitersSubsidy = await SubsidyRecords.findAll({
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
            if (!isNaN(liters)) {
              liters = parseFloat(liters.toFixed(2));
              monthData[monthIndex] += liters;
              monthData[monthIndex] = parseFloat(
                monthData[monthIndex].toFixed(2)
              );
              totalLitersConsumed += liters;
            }
          }
        });

        totalLitersSubsidy.forEach((record) => {
          const monthIndex = months.indexOf(record.dataValues.month);
          if (monthIndex !== -1) {
            let liters = parseFloat(record.dataValues.litersConsumed);
            if (!isNaN(liters)) {
              liters = parseFloat(liters.toFixed(2));
              monthData[monthIndex] += liters;
              monthData[monthIndex] = parseFloat(
                monthData[monthIndex].toFixed(2)
              );
              totalLitersConsumed += liters;
            }
          }
        });

        totalLitersConsumed = parseFloat(
          totalLitersConsumed.toFixed(2)
        ).toLocaleString("en-US");

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
