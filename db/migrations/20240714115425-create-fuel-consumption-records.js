"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fuelConsumptionRecords", {
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
      year: {
        type: Sequelize.INTEGER,
      },
      month: {
        type: Sequelize.STRING,
      },
      startingMileage: {
        type: Sequelize.INTEGER,
      },
      endingMileage: {
        type: Sequelize.INTEGER,
      },
      litersConsumed: {
        type: Sequelize.DECIMAL(10, 2),
      },
      totalCost: {
        type: Sequelize.DECIMAL(10, 2),
      },
      fileId: {
        type: Sequelize.INTEGER,
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("fuelConsumptionRecords");
  },
};
