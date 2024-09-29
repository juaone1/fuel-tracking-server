const express = require("express");
const router = express.Router();
require("dotenv").config({ path: `${process.cwd()}/.env` });
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fuelConsumptionRecordsController = require("../controllers/fuelConsumptionRecordsController");
const verifyRoles = require("../middlewares/verifyRoles");

const importFuelRecord = multer({ dest: "uploads/" });

const ROLE_IDS = {
  User: 1,
  Admin: 2,
};

// Configure AWS SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up multer S3 storage configuration
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    // acl: "public-read",
    key: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg, .jpeg, and .pdf files are allowed!"));
    }
  },
  limits: { fileSize: 1024 * 1024 * 2 }, // Limit file size to 2MB
});

router.post(
  "/",
  // verifyRoles(ROLE_IDS.Admin),
  fuelConsumptionRecordsController.handleCreateFuelConsumptionRecord
);
router.post(
  "/upload",
  upload.single("file"),
  fuelConsumptionRecordsController.handleFileUpload
);
// New download endpoint
router.get("/download/:filename", async (req, res) => {
  const { filename } = req.params;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: filename,
  };

  try {
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // URL expires in 60 seconds
    res.json({ url });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error generating pre-signed URL", message: error });
  }
});
router.get(
  "/",
  fuelConsumptionRecordsController.handleGetAllFuelConsumptionRecords
);
router.delete(
  "/:recordId",
  fuelConsumptionRecordsController.handleSoftDeleteRecord
);

router.put("/", fuelConsumptionRecordsController.handleUpdateRecord);

router.get(
  "/fuel-consumption-chart",
  fuelConsumptionRecordsController.handleGetTotalConsumedDataByVehicle
);

router.get(
  "/total-cost-chart",
  fuelConsumptionRecordsController.handleGetTotalCostDataByVehicle
);

router.get(
  "/vehicles-with-status",
  fuelConsumptionRecordsController.handleGetVehicleListWithStatus
);

router.get(
  "/download-sample",
  fuelConsumptionRecordsController.handleDownloadSampleFormat
);

router.post(
  "/import",
  importFuelRecord.single("file"),
  fuelConsumptionRecordsController.handleImportFuelRecord
);

router.get("/export", fuelConsumptionRecordsController.handleExportFuelRecord);
module.exports = router;
