"use strict";
const { Sequelize } = require("sequelize");
const sequelize = require("../config/dbConnect");
module.exports = sequelize.define("fuelTypes", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
  },
  type: {
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
});