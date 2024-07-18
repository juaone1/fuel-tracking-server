const Vehicles = require("./vehicles");
const VehicleCategory = require("./vehiclecategories");
const FuelType = require("./fueltypes");
const VehicleStatus = require("./vehiclestatus");

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
};

module.exports = setupModelAssociations;
