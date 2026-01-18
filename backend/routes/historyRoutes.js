const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");
const authMiddleware = require("../middleware/auth");

// GET /api/history
router.get("/", authMiddleware, historyController.getHistory);

module.exports = router;
