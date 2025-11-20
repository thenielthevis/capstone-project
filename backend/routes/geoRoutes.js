const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/admin");

const { createGeoActivity,
        getAllGeoActivities,
        getGeoActivityById,
        updateGeoActivity,
        deleteGeoActivity,
 } = require("../controllers/geoActivityController");

router.post("/createGeoActivity", adminMiddleware, createGeoActivity);
router.get("/getAllGeoActivities", getAllGeoActivities);
router.get("/getGeoActivityById/:id", getGeoActivityById);
router.patch("/updateGeoActivity/:id", adminMiddleware, updateGeoActivity);
router.delete("/deleteGeoActivity/:id", adminMiddleware, deleteGeoActivity);

module.exports = router;