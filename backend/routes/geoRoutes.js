const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/admin");
const upload = require("../middleware/multer");

const { createGeoActivity,
        getAllGeoActivities,
        getGeoActivityById,
        updateGeoActivity,
        deleteGeoActivity,
 } = require("../controllers/geoActivityController");

const geoActivityUpload = upload.fields([
  { name: "icon", maxCount: 1 },
  { name: "animation", maxCount: 1 },
]);

router.post("/createGeoActivity", adminMiddleware, geoActivityUpload, createGeoActivity);
router.get("/getAllGeoActivities", getAllGeoActivities);
router.get("/getGeoActivityById/:id", getGeoActivityById);
router.patch("/updateGeoActivity/:id", adminMiddleware, geoActivityUpload, updateGeoActivity);
router.delete("/deleteGeoActivity/:id", adminMiddleware, deleteGeoActivity);

module.exports = router;