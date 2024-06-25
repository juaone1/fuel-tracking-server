const express = require("express");
const { specs, swaggerUi } = require("./swagger");
const app = express();
const PORT = process.env.PORT || 3500;

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (req, res) => {
  res.send("Hello, Swagger!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
