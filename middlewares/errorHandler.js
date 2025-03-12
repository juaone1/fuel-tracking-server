const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File is too large. Maximum size is 5MB." });
    }
  }
  if (err) {
    return res.status(500).json({ message: err.message });
  }
  next();
};

module.exports = errorHandler;
