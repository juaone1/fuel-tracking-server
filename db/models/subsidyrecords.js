"use strict";
const { Sequelize } = require("sequelize");
const sequelize = require("../../config/dbConnect");
const Files = require("./files");

const SubsidyRecords = sequelize.define(
  "subsidyRecords",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    vehicleId: {
      type: Sequelize.INTEGER,
    },
    officeId: {
      type: Sequelize.INTEGER,
    },
    requestingOfficeId: {
      type: Sequelize.INTEGER,
    },
    year: {
      type: Sequelize.INTEGER,
    },
    month: {
      type: Sequelize.STRING,
    },
    startingMileage: {
      type: Sequelize.DECIMAL(10, 2),
    },
    endingMileage: {
      type: Sequelize.DECIMAL(10, 2),
    },
    litersConsumed: {
      type: Sequelize.DECIMAL(10, 2),
    },
    totalCost: {
      type: Sequelize.DECIMAL(10, 2),
    },
    fileId: {
      type: Sequelize.INTEGER,
      references: {
        model: Files,
        key: "id",
      },
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    deletedAt: {
      type: Sequelize.DATE,
    },
  },
  {
    paranoid: true,
  }
);
// Establish the association
SubsidyRecords.belongsTo(Files, { foreignKey: "fileId" });
Files.hasOne(SubsidyRecords, { foreignKey: "fileId" });

module.exports = SubsidyRecords;
