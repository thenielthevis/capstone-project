const express = require("express");
const router = express.Router();
const userMiddleware = require("../middleware/user");

const {
  createWorkoutSession,
  getAllWorkoutSessions,
  getWorkoutSessionById,
} = require("../controllers/workoutSessionController");

router.post("/createWorkoutSession", userMiddleware, createWorkoutSession);
router.get("/getAllWorkoutSessions", userMiddleware, getAllWorkoutSessions);
router.get("/getWorkoutSessionById/:id", userMiddleware, getWorkoutSessionById);

module.exports = router;