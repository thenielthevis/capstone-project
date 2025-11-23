const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/admin");
const { createWorkout,
        getAllWorkouts,
        getWorkoutById,
        updateWorkout,
        deleteWorkout,
 } = require("../controllers/workoutController");
const upload = require("../middleware/multer");

router.post("/createWorkout", adminMiddleware, upload.single("animation"), createWorkout);
router.get("/getAllWorkouts", getAllWorkouts);
router.get("/getWorkoutById/:id", getWorkoutById);
router.patch("/updateWorkout/:id", adminMiddleware, updateWorkout);
router.delete("/deleteWorkout/:id", adminMiddleware, deleteWorkout);

module.exports = router;