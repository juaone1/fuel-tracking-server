require("dotenv").config({ path: `${process.cwd()}/.env` });
const express = require("express");
const { specs, swaggerUi } = require("./swagger");
const app = express();
const PORT = process.env.PORT || 3500;

// built-in middleware for json
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/", (req, res) => {
  res.send("Hello, Swagger!");
});
// routes
app.use("/register", require("./routes/register"));
app.use("*", (req, res) => {
  res.status(404).send({ message: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
