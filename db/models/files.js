"use strict";
const { Sequelize } = require("sequelize");
const sequelize = require("../../config/dbConnect");
module.exports = sequelize.define(
  "files",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    fileName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fileUrl: {
      type: Sequelize.STRING,
      allowNull: false,
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
