const Vehicles = require("./vehicles");
const VehicleCategory = require("./vehiclecategories");
const FuelType = require("./fueltypes");
const VehicleStatus = require("./vehiclestatus");
const Office = require("./offices");
const Users = require("./users");
const FuelConsumptionRecords = require("./fuelConsumptionRecords");

const setupModelAssociations = () => {
  // Define associations
  Vehicles.belongsTo(VehicleCategory, {
    foreignKey: "categoryId",
    as: "category",
  });
  VehicleCategory.hasMany(Vehicles, { foreignKey: "categoryId" });

  Vehicles.belongsTo(FuelType, { foreignKey: "fuelTypeId", as: "fuelType" });
  FuelType.hasMany(Vehicles, { foreignKey: "fuelTypeId" });

  Vehicles.belongsTo(VehicleStatus, {
    foreignKey: "vehicleStatus",
    as: "status",
  });
  VehicleStatus.hasMany(Vehicles, { foreignKey: "vehicleStatus" });

  Vehicles.belongsTo(Office, { foreignKey: "officeId", as: "office" });
  Office.hasMany(Vehicles, { foreignKey: "officeId" });

  FuelConsumptionRecords.belongsTo(Vehicles, {
    foreignKey: "vehicleId",
    as: "vehicle",
  });
  Vehicles.hasMany(FuelConsumptionRecords, { foreignKey: "vehicleId" });

  Users.belongsTo(Office, { foreignKey: "officeId", as: "office" });
  Office.hasMany(Users, { foreignKey: "officeId" });
};

module.exports = setupModelAssociations;
