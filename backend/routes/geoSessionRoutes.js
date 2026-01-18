const express = require("express");
const router = express.Router();
const userMiddleware = require("../middleware/user");

const { createGeoSession,
    getAllGeoSessions,
    getGeoSessionById,
} = require("../controllers/geoSessionController");

const upload = require("../middleware/multer");

// Use same config as posts (max 10 images, though we only need 1)
const geoUpload = upload.single("preview_image");

router.post("/createGeoSession", userMiddleware, geoUpload, createGeoSession);
router.get("/getAllGeoSessions", userMiddleware, getAllGeoSessions);
router.get("/getGeoSessionById/:id", userMiddleware, getGeoSessionById);

module.exports = router;