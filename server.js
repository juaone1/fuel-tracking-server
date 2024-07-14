require("dotenv").config({ path: `${process.cwd()}/.env` });
const express = require("express");
const { specs, swaggerUi } = require("./swagger");
const app = express();
const cors = require("cors");
const verifyJWT = require("./middlewares/verifyJWT");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 3500;

// Cross Origin Resource Sharing
const whitelist = [
  "https://www.yoursite.com",
  "http://127.0.0.1:5500",
  "http://localhost:3500",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// built-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/", (req, res) => {
  res.send("Hello, Swagger!");
});
// routes
app.use("/register", require("./routes/register"));
app.use("/login", require("./routes/auth"));
app.use("/refresh", require("./routes/refresh"));

app.use(verifyJWT);
app.use("/users", require("./routes/users"));

app.use("*", (req, res) => {
  res.status(404).send({ message: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});