const FuelConsumptionRecords = require("../db/models/fuelconsumptionrecords");
const Vehicles = require("../db/models/vehicles");
const Files = require("../db/models/files");
const Office = require("../db/models/offices");
const FuelType = require("../db/models/fueltypes");
const VehicleCategory = require("../db/models/vehiclecategories");
const VehicleStatus = require("../db/models/vehiclestatus");
const sequelize = require("sequelize");
const { Op } = require("sequelize");

const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

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
      include: [
        { model: Files, as: "file", attributes: ["fileName", "fileUrl"] },
      ],
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
  const { vehicleId, month, year } = req.query;
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field is required to update the record" });
  }
  try {
    const record = await FuelConsumptionRecords.findOne({
      where: { vehicleId: vehicleId, month: month, year: year },
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

    totalLitersConsumed = parseFloat(totalLitersConsumed.toFixed(2));

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

    totalOverallCost = parseFloat(totalOverallCost.toFixed(2));

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

const handleFileUpload = async (req, res) => {
  const { vehicleId, month, year } = req.body;
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Save file information to the database
    const newFile = await Files.create({
      fileName: file.originalname,
      fileUrl: file.location,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let record = await FuelConsumptionRecords.findOne({
      where: { vehicleId: vehicleId, month: month, year: year },
    });

    if (!record) {
      record = await FuelConsumptionRecords.create({
        vehicleId: vehicleId,
        month: month,
        year: year,
        fileId: newFile.id,
      });
      return res.status(201).json({
        message: "Record created successfully",
        data: record,
        file: file,
      });
    }

    const updatedRecord = await record.update({ fileId: newFile.id });
    res.status(200).json({
      message: "Record updated successfully",
      data: updatedRecord,
      file: file,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handleGetVehicleListWithStatus = async (req, res) => {
  // const role = req.role;
  // const officeId = req.officeId;
  const { officeId, page = 1, limit = 10, search = "" } = req.query;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  try {
    const offset = (page - 1) * limit;
    const whereConditions = officeId ? { officeId } : {};

    if (search) {
      whereConditions[Op.or] = [
        { plateNumber: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: vehicles } = await Vehicles.findAndCountAll({
      attributes: {
        // exclude: ["createdAt", "updatedAt", "deletedAt"],
        exclude: [
          "deletedAt",
          "yearModel",
          "yearAcquired",
          "createdAt",
          "updatedAt",
          "transmission",
        ],
      },
      where: whereConditions,
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
        {
          model: Office,
          as: "office",
          attributes: ["name"],
        },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    if (!vehicles) {
      return res.status(404).json({ error: "Vehicles not found" });
    }

    const transformedVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        const vehicleJSON = vehicle.toJSON();

        // Fetch fuel consumption records for the current year
        const records = await FuelConsumptionRecords.findAll({
          where: {
            vehicleId: vehicle.id,
            year: currentYear,
          },
          attributes: ["month", "fileId"],
        });
        // Filter records to include only those with a fileId
        const validRecords = records.filter((record) => record.fileId);
        // const monthsWithRecords = records.map((record) => record.month);
        const monthsWithRecords = validRecords.map((record) => record.month);
        const submissions = monthsWithRecords.length;

        const allMonths = [
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

        const missedSubmissions = allMonths
          .slice(0, currentMonth + 1)
          .filter((month) => !monthsWithRecords.includes(month));

        return {
          ...vehicleJSON,
          category: vehicleJSON.category ? vehicleJSON.category.name : null,
          fuelType: vehicleJSON.fuelType ? vehicleJSON.fuelType.type : null,
          status: vehicleJSON.status ? vehicleJSON.status.status : null,
          office: vehicleJSON.office ? vehicleJSON.office.name : null,
          submissions: `${submissions} out of 12`,
          missedSubmissions,
        };
      })
    );
    // return res.status(200).json(transformedVehicles);
    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      vehicles: transformedVehicles,
    });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

const handleDownloadSampleFormat = async (req, res) => {
  const role = req.role;
  const officeId = req.officeId;
  const filePath = path.join(__dirname, "FuelRecordTemplate.xlsx");

  const offices =
    role !== 2
      ? await Office.findOne({ where: { id: officeId } })
      : await Office.findAll({ attributes: ["name"] });

  const plateNumbers =
    role !== 2
      ? await Vehicles.findAll({
          where: { officeId: officeId },
          attributes: ["plateNumber", "id"],
        })
      : await Vehicles.findAll({ attributes: ["plateNumber", "id"] });

  let officeNames;
  if (Array.isArray(offices)) {
    officeNames = offices.map((o) => o.name);
  } else {
    officeNames = [offices.name];
  }
  const vehiclePlateNumbers = plateNumbers.map((p) => p.plateNumber);

  // Create a new workbook and add a worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Fuel_Records");

  // Define columns in your template
  worksheet.columns = [
    { header: "Office", key: "office", width: 20 },
    { header: "Plate Number", key: "plateNumber", width: 20 },
    { header: "Vehicle Id", key: "vehicleId", width: 20 },
    { header: "Year", key: "year", width: 20 },
    { header: "Month", key: "month", width: 20 },
    { header: "Liters Consumed", key: "litersConsumed", width: 20 },
    { header: "Total Cost", key: "totalCost", width: 20 },
    { header: "Starting Mileage", key: "startingMileage", width: 20 },
    { header: "Ending Mileage", key: "endingMileage", width: 20 },
    // { header: "Vehicle Id", key: "vehicleId", width: 20, hidden: true },
  ];

  // Add a sample row
  worksheet.addRow({
    office: officeNames[0],
    plateNumber: plateNumbers[0].plateNumber,
    vehicleId: plateNumbers[0].id,
    year: "2024",
    month: "January",
    litersConsumed: "10",
    totalCost: "600",
    startingMileage: "2000",
    endingMileage: "3000",
  });
  if (role !== 2) {
    vehiclePlateNumbers.slice(1).forEach((plateNumber) => {
      worksheet.addRow({
        office: officeNames[0],
        plateNumber,
        vehicleId: plateNumbers.find((p) => p.plateNumber === plateNumber).id,
      });
    });
  }

  // Create a hidden sheet for the lists
  const hiddenSheet = workbook.addWorksheet("Lists", { state: "hidden" });
  // Add the list of offices to the hidden sheet
  officeNames.forEach((office, index) => {
    hiddenSheet.getCell(`A${index + 1}`).value = office;
  });

  // Add the list of plate numbers to the hidden sheet
  plateNumbers.forEach((plateNumber, index) => {
    hiddenSheet.getCell(`B${index + 1}`).value = plateNumber.plateNumber;
    hiddenSheet.getCell(`C${index + 1}`).value = plateNumber.id;
  });

  // Create a named range for the list of offices
  workbook.definedNames.add(
    `Lists!$A$1:$A${officeNames.length}`,
    "OfficesList"
  );
  // Create a named range for the list of plate numbers
  workbook.definedNames.add(
    `Lists!$B$1:$B$${vehiclePlateNumbers.length}`,
    "PlateNumbersList"
  );

  // Apply data validation for the 'Office' column for all cells using the named range
  worksheet.dataValidations.add("A2:A9999", {
    type: "list",
    allowBlank: false,
    formulae: ["OfficesList"],
    showDropDown: true,
    showErrorMessage: true,
    errorStyle: "error",
    errorTitle: "Invalid Entry",
    error: "Please select a value from the list.",
  });

  // Apply data validation for the 'Plate Number' column for all cells using the named range
  worksheet.dataValidations.add("B2:B9999", {
    type: "list",
    allowBlank: false,
    formulae: ["PlateNumbersList"],
    showDropDown: true,
    showErrorMessage: true,
    errorStyle: "error",
    errorTitle: "Invalid Entry",
    error: "Please select a value from the list.",
  });

  const totalRows = 9999;

  // Use VLOOKUP to automatically populate the vehicleId based on the selected plateNumber
  for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
    const cell = worksheet.getCell(`C${rowNumber}`);
    cell.value = {
      formula: `=IFERROR(VLOOKUP(B${rowNumber}, Lists!B$1:C$${plateNumbers.length}, 2, FALSE), "")`,
    };
    cell.protection = { locked: false };
  }

  // Protect the worksheet
  worksheet.protect(null, {
    selectLockedCells: true,
    selectUnlockedCells: true,
    allowFormatCells: true,
  });

  // Lock the cells in the "Vehicle Id" column
  worksheet.getColumn("vehicleId").eachCell((cell) => {
    cell.protection = { locked: true };
  });
  // Unlock all relevant cells except for the Vehicle Id column
  worksheet.columns.forEach((col) => {
    if (col.key !== "vehicleId") {
      for (let i = 2; i <= totalRows; i++) {
        const cell = worksheet.getCell(`${col.letter}${i}`);
        cell.protection = { locked: false }; // Unlock cells in relevant rows
      }
    }
  });

  // Save the workbook to a file
  await workbook.xlsx.writeFile(filePath);
  // res.download(filePath);
  res.download(filePath, (err) => {
    if (err) {
      console.error("Error downloading the file:", err);
    } else {
      // Delete the file after download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting the file:", unlinkErr);
        }
      });
    }
  });
};

const handleImportFuelRecord = async (req, res) => {
  const filePath = req.file.path;
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(1);

    // Fetch reference data from DB
    const offices = await Office.findAll();
    // Convert reference data to maps for quick lookup
    const officeMap = new Map(offices.map((o) => [o.name, o.id]));

    const successData = [];
    const failureData = [];

    // Function to check if the record exists
    const recordExists = async (officeId, vehicleId, year, month) => {
      const existingRecord = await FuelConsumptionRecords.findOne({
        where: { officeId, vehicleId, year, month },
      });
      return existingRecord !== null;
    };

    const validMonths = [
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

    const normalizeMonthName = (month) => {
      if (!month) return null;
      return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    };

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const errors = [];
      const officeId = officeMap.get(row.getCell(1).value) ?? null;
      const vehicleId = row.getCell(3).result ?? row.getCell(3).value;
      const year = row.getCell(4).value;
      const month = normalizeMonthName(row.getCell(5).value);
      const litersConsumed = row.getCell(6).value;
      const totalCost = row.getCell(7).value;
      const startingMileage = row.getCell(8).value;
      const endingMileage = row.getCell(9).value;

      const record = {
        officeId,
        vehicleId,
        year,
        month,
        litersConsumed,
        totalCost,
        startingMileage,
        endingMileage,
      };

      if (officeId || year || month) {
        // Check if the record already exists
        if (officeId && vehicleId && year && month) {
          if (await recordExists(officeId, vehicleId, year, month)) {
            errors.push({
              column: "All",
              input: [officeId, vehicleId, year, month],
              message: "Record already exists",
            });
          }
        } else {
          // Validate each field and accumulate errors
          if (!officeId) {
            errors.push({
              column: "Office",
              input: officeId,
              message: "Office not found",
            });
          }
          if (!vehicleId || isNaN(vehicleId)) {
            errors.push({
              column: "Vehicle Id",
              input: vehicleId,
              message: "Vehicle ID must be a number",
            });
          }
          if (!year || isNaN(year) || year.toString().length !== 4) {
            errors.push({
              column: "Year",
              input: year,
              message: "Year must be a four-digit number",
            });
          }
          if (!month || !validMonths.includes(month)) {
            errors.push({
              column: "Month",
              input: month,
              message: "Month must be a valid month name",
            });
          }
          if (!litersConsumed || isNaN(litersConsumed) || litersConsumed <= 0) {
            errors.push({
              column: "Liters Consumed",
              input: litersConsumed,
              message: "Liters consumed must be a positive number",
            });
          }
          if (!totalCost || isNaN(totalCost) || totalCost <= 0) {
            errors.push({
              column: "Total Cost",
              input: totalCost,
              message: "Total cost must be a positive number",
            });
          }
          if (
            startingMileage !== null &&
            (isNaN(startingMileage) || startingMileage < 0)
          ) {
            errors.push({
              column: "Starting Mileage",
              input: startingMileage,
              message: "Starting mileage must be a non-negative number",
            });
          }
          if (
            endingMileage !== null &&
            (isNaN(endingMileage) ||
              endingMileage < 0 ||
              endingMileage < startingMileage)
          ) {
            errors.push({
              column: "Ending Mileage",
              input: endingMileage,
              message:
                "Ending mileage must be a non-negative number and greater than or equal to starting mileage",
            });
          }
        }
        if (errors.length > 0) {
          failureData.push({ rowNumber, ...record, errors });
        } else {
          successData.push({ rowNumber, ...record });
        }
      }
    }
    // Insert successData into the database using bulkCreate
    if (successData.length > 0) {
      await FuelConsumptionRecords.bulkCreate(successData);
      res.status(201).send({
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
    res.status(500).send(`Error importing data: ${error.message}`);
  } finally {
    // Cleanup: delete the uploaded file
    fs.unlinkSync(filePath);
  }
};

const handleExportFuelRecord = async (req, res) => {
  const { year, month, officeId } = req.query;

  try {
    const office = await Office.findOne({
      where: { id: officeId },
      attributes: ["name"],
    });

    if (!office) {
      return res.status(404).json({ error: "Office not found" });
    }

    const records = await FuelConsumptionRecords.findAll({
      where: { year, month, officeId },
      attributes: {
        exclude: ["createdAt", "updatedAt", "deletedAt"],
      },
      include: [
        {
          model: Vehicles,
          as: "vehicle",
          attributes: ["model", "plateNumber", "fuelTypeId"],
        },
      ],
    });

    const invalidRecords = records.filter(
      (record) => !record.fileId || !record.litersConsumed || !record.totalCost
    );

    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error:
          "Some records have missing required fields. Please update the records and try again.",
      });
    }

    if (!records || records.length === 0) {
      return res.status(404).json({ error: "No records found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fuel_Consumption_Report");

    // Set the date
    worksheet.mergeCells("A2:I2");
    worksheet.getCell("A2").value = `${month}, ${year}`;
    worksheet.getCell("A2").alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("A2").font = { size: 12, bold: true };

    // Set the office name
    worksheet.mergeCells("A3:I3");
    worksheet.getCell("A3").value = office.name;
    worksheet.getCell("A3").alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("A3").font = { size: 14, bold: true };

    // Add empty rows to shift the starting point to row 6
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Merge cells for the header across two rows
    worksheet.mergeCells("A6:A7");
    worksheet.mergeCells("B6:B7");
    worksheet.mergeCells("C6:C7");
    worksheet.mergeCells("D6:E6");
    worksheet.mergeCells("F6:F7");
    worksheet.mergeCells("G6:G7");
    worksheet.mergeCells("H6:H7");
    worksheet.mergeCells("I6:I7");

    // Set the headers starting from row 6
    worksheet.getCell("A6").value = "Vehicle/ Equipment";
    worksheet.getCell("A6").font = { bold: true };
    worksheet.getCell("B6").value = "Plate No./ Property No.";
    worksheet.getCell("B6").font = { bold: true };
    worksheet.getCell("C6").value = "Type of Fuel (Diesel/ Gasoline)";
    worksheet.getCell("C6").font = { bold: true };
    worksheet.getCell("D6").value = "Odometer Reading";
    worksheet.getCell("D6").font = { bold: true };
    worksheet.getCell("F6").value = "Total Distance Travelled (KM)";
    worksheet.getCell("F6").font = { bold: true };
    worksheet.getCell("G6").value = "Total Fuel Used (Ltrs)";
    worksheet.getCell("G6").font = { bold: true };
    worksheet.getCell("H6").value = "Distance Travelled per liter (F/G)";
    worksheet.getCell("H6").font = { bold: true };
    worksheet.getCell("I6").value = "Total Amount Consumed (Php)";
    worksheet.getCell("I6").font = { bold: true };

    // Set the sub-headers for the merged cells
    worksheet.getCell("D7").value = "Beginning";
    worksheet.getCell("D7").font = { bold: true };
    worksheet.getCell("E7").value = "Ending";
    worksheet.getCell("E7").font = { bold: true };

    // Set alignment for the headers
    worksheet.getRow(6).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    worksheet.getRow(7).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    // Add borders to the headers
    const headerCells = [
      "A6",
      "B6",
      "C6",
      "D6",
      "E6",
      "F6",
      "G6",
      "H6",
      "I6",
      "D7",
      "E7",
    ];
    headerCells.forEach((cell) => {
      worksheet.getCell(cell).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Define the columns for the data rows
    worksheet.columns = [
      { header: "Vehicle/ Equipment", key: "vehicleId", width: 20 },
      { header: "Plate No./ Property No.", key: "plateNumber", width: 20 },
      { header: "Type of Fuel (Diesel/ Gasoline)", key: "fuelType", width: 20 },
      { header: "Beginning", key: "startingMileage", width: 20 },
      { header: "Ending", key: "endingMileage", width: 20 },
      {
        header: "Total Distance Travelled (KM)",
        key: "totalDistanceTravelled",
        width: 20,
      },
      { header: "Total Fuel Used (Ltrs)", key: "litersConsumed", width: 20 },
      {
        header: "Distance Travelled per liter (F/G)",
        key: "distancePerLiter",
        width: 20,
      },
      {
        header: "Total Amount Consumed (Php)",
        key: "totalCost",
        width: 20,
      },
    ];

    worksheet.getCell("A8").value = "(A)";
    worksheet.getCell("B8").value = "(B)";
    worksheet.getCell("C8").value = "(C)";
    worksheet.getCell("D8").value = "(D)";
    worksheet.getCell("E8").value = "(E)";
    worksheet.getCell("F8").value = "(F)";
    worksheet.getCell("G8").value = "(G)";
    worksheet.getCell("H8").value = "(H)";
    worksheet.getCell("I8").value = "(I)";

    // Add borders to the cells in row 8
    const row8Cells = ["A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8", "I8"];
    row8Cells.forEach((cell) => {
      worksheet.getCell(cell).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.getRow(8).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    records.forEach((record) => {
      console.log("record", record);
      const totalDistanceTravelled =
        record.endingMileage - record.startingMileage;
      const distancePerLiter = totalDistanceTravelled / record.litersConsumed;

      const row = worksheet.addRow({
        vehicleId: record.vehicle.model,
        plateNumber: record.vehicle.plateNumber,
        fuelType: record.vehicle.fuelTypeId === 1 ? "Gasoline" : "Diesel",
        vehicleId: record.vehicle.model,
        plateNumber: record.vehicle.plateNumber,
        fuelType: record.vehicle.fuelTypeId === 1 ? "Gasoline" : "Diesel",
        startingMileage: Number(record.startingMileage).toLocaleString(
          "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        ),
        endingMileage: Number(record.endingMileage).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        totalDistanceTravelled: Number(totalDistanceTravelled).toLocaleString(
          "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        ),
        litersConsumed: Number(record.litersConsumed).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        distancePerLiter: Number(distancePerLiter).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        totalCost: Number(record.totalCost).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      });

      // Ensure numbers are right-aligned
      const numberColumns = ["D", "E", "F", "G", "H", "I"];
      numberColumns.forEach((col) => {
        row.getCell(col).alignment = { horizontal: "right" };
      });

      // Add borders to the data rows
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Add Total
    const totalLitersConsumed = records.reduce(
      (acc, record) => acc + Number(record.litersConsumed),
      0
    );
    const totalCost = records.reduce(
      (acc, record) => acc + Number(record.totalCost),
      0
    );
    // Format the totals with commas and two decimal places
    const formattedTotalLitersConsumed = totalLitersConsumed.toLocaleString(
      "en-US",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );
    const formattedTotalCost = totalCost.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    worksheet.getCell(`A${records.length + 9}`).value = "Total";
    worksheet.getCell(`A${records.length + 9}`).font = { bold: true };
    worksheet.getCell(`G${records.length + 9}`).value =
      formattedTotalLitersConsumed;
    worksheet.getCell(`G${records.length + 9}`).alignment = {
      horizontal: "right",
    };
    worksheet.getCell(`G${records.length + 9}`).font = { bold: true };
    worksheet.getCell(`I${records.length + 9}`).value = formattedTotalCost;
    worksheet.getCell(`I${records.length + 9}`).font = { bold: true };
    worksheet.getCell(`I${records.length + 9}`).alignment = {
      horizontal: "right",
    };
    const rowTotalCells = [
      `A${records.length + 9}`,
      `B${records.length + 9}`,
      `C${records.length + 9}`,
      `D${records.length + 9}`,
      `E${records.length + 9}`,
      `F${records.length + 9}`,
      `G${records.length + 9}`,
      `H${records.length + 9}`,
      `I${records.length + 9}`,
    ];

    rowTotalCells.forEach((cell) => {
      worksheet.getCell(cell).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add Prepared by
    worksheet.getCell(`A${records.length + 12}`).value = "Prepared by:";
    worksheet.mergeCells(`B${records.length + 14}:C${records.length + 14}`);
    worksheet.mergeCells(`B${records.length + 15}:C${records.length + 15}`);
    worksheet.getCell(`B${records.length + 14}`).value = "NAME";
    worksheet.getCell(`B${records.length + 14}`).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell(`B${records.length + 15}`).value = "Designation";
    worksheet.getCell(`B${records.length + 15}`).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    /// Add Noted by
    worksheet.getCell(`F${records.length + 12}`).value = "Noted by:";
    worksheet.mergeCells(`G${records.length + 14}:H${records.length + 14}`);
    worksheet.mergeCells(`G${records.length + 15}:H${records.length + 15}`);
    worksheet.getCell(`G${records.length + 14}`).value = "NAME";
    worksheet.getCell(`G${records.length + 14}`).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell(`G${records.length + 15}`).value = "Designation";
    worksheet.getCell(`G${records.length + 15}`).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    // Unlock all cells first
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.protection = { locked: false };
      });
    });
    // Add Generated by
    const generatedByCell = `A${records.length + 20}`;
    worksheet.getCell(generatedByCell).value =
      "*This report was generated using the CPDO Online Fuel Reporting System.";
    worksheet.getCell(generatedByCell).font = { italic: true };
    worksheet.mergeCells(`${generatedByCell}:I${records.length + 20}`);
    worksheet.getCell(generatedByCell).protection = { locked: true };

    // Add Date Generated
    const date = new Date();
    const dateString = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila", // Set to Manila time
    }).format(date);
    const timeString = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Manila", // Set to Manila time
    }).format(date);
    const dateGeneratedCell = `A${records.length + 21}`;
    worksheet.getCell(
      dateGeneratedCell
    ).value = `*Date Generated: ${dateString} ${timeString}`;
    worksheet.getCell(dateGeneratedCell).font = { italic: true };
    worksheet.mergeCells(`${dateGeneratedCell}:I${records.length + 21}`);
    worksheet.getCell(dateGeneratedCell).protection = { locked: true };

    worksheet.mergeCells("A1:I1");
    worksheet.getCell("A1").value = "FUEL CONSUMPTION REPORT";
    worksheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("A1").font = { size: 18, bold: true };

    // Protect the worksheet
    worksheet.protect("!fu3lch3q", {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: true,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false,
      objects: false,
      scenarios: false,
    });

    const filePath = path.join(__dirname, "FuelConsumptionReport.xlsx");
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error downloading the file:", err);
      } else {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting the file:", unlinkErr);
          }
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "server error", message: error.message });
  }
};

module.exports = {
  handleCreateFuelConsumptionRecord,
  handleGetAllFuelConsumptionRecords,
  handleSoftDeleteRecord,
  handleUpdateRecord,
  handleGetTotalConsumedDataByVehicle,
  handleGetTotalCostDataByVehicle,
  handleFileUpload,
  handleGetVehicleListWithStatus,
  handleDownloadSampleFormat,
  handleImportFuelRecord,
  handleExportFuelRecord,
};
