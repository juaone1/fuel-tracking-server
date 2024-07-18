const Sequelize = require("sequelize");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const Vehicles = require("../db/models/vehicles");
const VehicleCategory = require("../db/models/vehiclecategories");
const Office = require("../db/models/offices");
const FuelType = require("../db/models/fueltypes");
const VehicleStatus = require("../db/models/vehiclestatus");

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
    transmission,
  } = req.body;

  if (!officeId || !model || !plateNumber) {
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
      transmission,
    });

    console.log("newVehicle", newVehicle);

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
        // exclude: ["createdAt", "updatedAt", "deletedAt"],
        exclude: ["deletedAt"],
      },
      include: [
        {
          model: VehicleCategory,
          as: "category",
          attributes: ["name"],
        },
        {
          model: FuelType,
          as: "fuelType",
          attributes: ["type"],
        },
        {
          model: VehicleStatus,
          as: "status",
          attributes: ["status"],
        },
      ],
    });

    if (!vehicles) {
      return res.status(404).json({ error: "Vehicles not found" });
    }
    // Transform the response
    const transformedVehicles = vehicles.map((vehicle) => {
      const vehicleJSON = vehicle.toJSON();
      console.log("vehicleJSON", vehicleJSON);
      return {
        ...vehicleJSON,
        category: vehicleJSON.category ? vehicleJSON.category.name : null,
        fuelType: vehicleJSON.fuelType ? vehicleJSON.fuelType.type : null,
        status: vehicleJSON.status ? vehicleJSON.status.status : null,
      };
    });
    return res.status(200).json(transformedVehicles);
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

const fetchVehicleCategories = async () => {
  return VehicleCategory.findAll({
    attributes: ["name"],
  });
};

const handleDownloadSampleExcel = async (req, res) => {
  const filePath = path.join(__dirname, "VehicleTemplate.xlsx");

  try {
    // Check if the file exists
    await fs.promises.access(filePath, fs.constants.F_OK);
    // If the file exists, send it
    res.download(filePath);
  } catch {
    // Fetch categories from the database
    const categories = await fetchVehicleCategories();
    const categoryNames = categories.map((c) => c.name);

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Vehicles");

    // Define columns in your template
    worksheet.columns = [
      { header: "Office", key: "office", width: 30 },
      { header: "Vehicle Name", key: "name", width: 30 },
      { header: "Model", key: "model", width: 30 },
      { header: "Plate Number", key: "plateNumber", width: 30 },
      { header: "Fuel Type", key: "fuelType", width: 30 },
      { header: "Transmission", key: "transmission", width: 30 },
      { header: "Vehicle Category", key: "category", width: 30 },
      { header: "Year Model", key: "yearModel", width: 30 },
      { header: "Year Acquired", key: "yearAcquired", width: 30 },
      { header: "Ownership", key: "ownership", width: 30 },
      { header: "Vehicle Status", key: "vehicleStatus", width: 30 },
    ];

    // Add a sample row
    worksheet.addRow({
      office: "Sample Office",
      name: "Sample Vehicle",
      model: "Sample Model",
      plateNumber: "ABC123",
      fuelType: "Gasoline",
      transmission: "Automatic",
      category: categoryNames[0], // Assuming the first category as sample
      yearModel: "2020",
      yearAcquired: "2021",
      ownership: "Owned",
      vehicleStatus: "Operational",
    });

    // Correctly format the formula for the dropdown list
    const categoriesList = `"${categoryNames.join(",")}"`;
    // Apply data validation for the 'Vehicle Category' column for all cells
    worksheet.dataValidations.add("G2:G9999", {
      type: "list",
      allowBlank: false,
      formulae: [categoriesList],
      showDropDown: true,
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "Invalid Entry",
      error: "Please select a value from the list.",
    });
    // Save the workbook to a file
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath);
  }
};

const handleImportData = async (req, res) => {
  const filePath = req.file.path;
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(1);

    // Fetch reference data from DB
    const offices = await Office.findAll();
    const fuelTypes = await FuelType.findAll();
    const categories = await VehicleCategory.findAll();
    const vehicleStatuses = await VehicleStatus.findAll();
    const vehicles = await Vehicles.findAll();

    // Convert reference data to maps for quick lookup
    const officeMap = new Map(offices.map((o) => [o.name, o.id]));
    const fuelTypeMap = new Map(fuelTypes.map((f) => [f.type, f.id]));
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
    const vehicleMap = new Map(vehicles.map((v) => [v.plateNumber, v.id]));
    const vehicleStatusMap = new Map(
      vehicleStatuses.map((v) => [v.status, v.id])
    );

    const successData = [];
    const failureData = [];

    // Process each row in the sheet
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const vehicle = {
          officeId: officeMap.get(row.getCell(1).text) ?? null,
          name: row.getCell(2).text,
          model: row.getCell(3).text,
          plateNumber: row.getCell(4).text,
          fuelTypeId: fuelTypeMap.get(row.getCell(5).text) ?? null,
          transmission: row.getCell(6).text,
          categoryId: categoryMap.get(row.getCell(7).text) ?? null,
          yearModel: row.getCell(8).text,
          yearAcquired: row.getCell(9).text,
          isOwned: row.getCell(10).text === "Owned",
          vehicleStatus: vehicleStatusMap.get(row.getCell(11).text) ?? null,
        };
        const errors = [];
        // Check if the vehicle already exists
        const existingVehicle = vehicleMap.get(vehicle.plateNumber);

        if (existingVehicle) {
          errors.push({
            column: "Plate Number",
            input: vehicle.plateNumber,
            message: "Vehicle already exists",
          });
        } else {
          // Validate each field and accumulate errors
          if (!vehicle.officeId) {
            errors.push({
              column: "Office",
              input: row.getCell(1).text,
              message: "Invalid Office",
            });
          }
          if (!vehicle.fuelTypeId) {
            errors.push({
              column: "Fuel Type",
              input: row.getCell(5).text,
              message: "Invalid Fuel Type",
            });
          }
          if (!vehicle.categoryId) {
            errors.push({
              column: "Category",
              input: row.getCell(7).text,
              message: "Invalid Category",
            });
          }
          if (!vehicle.vehicleStatus) {
            errors.push({
              column: "Vehicle Status",
              input: row.getCell(11).text,
              message: "Invalid Vehicle Status",
            });
          }
        }

        if (errors.length > 0) {
          failureData.push({ rowNumber, ...vehicle, errors });
        } else {
          successData.push({ rowNumber, ...vehicle });
        }
      }
    });
    // Insert successData into the database using bulkCreate
    if (successData.length > 0) {
      await Vehicles.bulkCreate(successData);
      res.send({
        message: `${successData.length} rows successfully inserted,  ${failureData.length} rows not inserted `,
        successData,
        failureData,
      });
    } else {
      res.status(400).send({
        message: `${successData.length} rows successfully inserted,  ${failureData.length} rows not inserted `,
        successData,
        failureData,
      });
    }
  } catch (error) {
    res.status(500).send("Error importing data");
  } finally {
    // Cleanup: delete the uploaded file
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  handleCreateVehicle,
  handleGetAllVehicles,
  handleGetVehiclesByOfficeId,
  handleUpdateVehicle,
  handleSoftDeleteVehicle,
  handleDownloadSampleExcel,
  handleImportData,
};
