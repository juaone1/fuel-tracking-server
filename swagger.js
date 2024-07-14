const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fuel Tracking APIs",
      version: "1.0.0",
      description: "A fuel tracking app with Swagger documentation",
    },
  },
  apis: ["./routes/*.js"], // Path to your API routes
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
};
