const express = require("express");
const router = express.Router();
const userMiddleware = require("../middleware/user");

const { createGeoSession,
        getAllGeoSessions,
        getGeoSessionById,
} = require("../controllers/geoSessionController");

router.post("/createGeoSession", userMiddleware, createGeoSession);
router.get("/getAllGeoSessions", userMiddleware, getAllGeoSessions);
router.get("/getGeoSessionById/:id", userMiddleware, getGeoSessionById);

module.exports = router;