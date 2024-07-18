"use strict";
const { Sequelize } = require("sequelize");
const sequelize = require("../../config/dbConnect");
module.exports = sequelize.define(
  "vehicles",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    officeId: {
      type: Sequelize.INTEGER,
    },
    plateNumber: {
      type: Sequelize.STRING,
    },
    model: {
      type: Sequelize.STRING,
    },
    fuelTypeId: {
      type: Sequelize.INTEGER,
    },
    categoryId: {
      type: Sequelize.INTEGER,
    },
    yearModel: {
      type: Sequelize.INTEGER,
    },
    yearAcquired: {
      type: Sequelize.INTEGER,
    },
    isOwned: {
      type: Sequelize.BOOLEAN,
    },
    vehicleStatus: {
      type: Sequelize.INTEGER,
    },
    transmission: {
      type: Sequelize.STRING,
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
