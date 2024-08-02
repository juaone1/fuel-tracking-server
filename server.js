require("dotenv").config({ path: `${process.cwd()}/.env` });
const express = require("express");
const { specs, swaggerUi } = require("./swagger");
const app = express();
const cors = require("cors");
const verifyJWT = require("./middlewares/verifyJWT");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 3500;
const setupModelAssociations = require("./db/models/modelAssociations");
setupModelAssociations();
// Cross Origin Resource Sharing
const whitelist = [
  "https://www.yoursite.com",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3600",
  "http://localhost:3600",
  "http://54.153.218.24",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// built-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

app.use("/api/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/api/", (req, res) => {
  res.send("Hello, Swagger!");
});
// routes
app.use("/api/register", require("./routes/register"));
app.use("/api/login", require("./routes/auth"));
app.use("/api/refresh", require("./routes/refresh"));
app.use("/api/logout", require("./routes/logout"));

app.use(verifyJWT);
app.use("/api/users", require("./routes/users"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/offices", require("./routes/offices"));
app.use(
  "/api/fuel-consumption-records",
  require("./routes/fuelConsumptionRecords")
);
app.use("/api/dashboard", require("./routes/dashboard"));

app.use("*", (req, res) => {
  res.status(404).send({ message: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
