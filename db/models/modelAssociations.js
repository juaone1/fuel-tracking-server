const Vehicles = require("./vehicles");
const VehicleCategory = require("./vehiclecategories");
const FuelType = require("./fueltypes");
const VehicleStatus = require("./vehiclestatus");
const Office = require("./offices");
const Users = require("./users");
const FuelConsumptionRecords = require("./fuelconsumptionrecords");
const SubsidyRecords = require("./subsidyrecords");

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

  SubsidyRecords.belongsTo(Vehicles, {
    foreignKey: "vehicleId",
    as: "vehicle",
  });
  Vehicles.hasMany(SubsidyRecords, { foreignKey: "vehicleId" });

  SubsidyRecords.belongsTo(Office, { foreignKey: "officeId", as: "office" });
  Office.hasMany(SubsidyRecords, { foreignKey: "officeId" });

  SubsidyRecords.belongsTo(Office, {
    foreignKey: "requestingOfficeId",
    as: "requestingOffice",
  });
  Office.hasMany(SubsidyRecords, { foreignKey: "requestingOfficeId" });

  Users.belongsTo(Office, { foreignKey: "officeId", as: "office" });
  Office.hasMany(Users, { foreignKey: "officeId" });
};

module.exports = setupModelAssociations;
