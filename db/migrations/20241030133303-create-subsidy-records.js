"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("subsidyRecords", {
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
          model: "files",
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
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("subsidyRecords");
  },
};
