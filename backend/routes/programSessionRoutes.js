const express = require("express");
const router = express.Router();
const userMiddleware = require("../middleware/user");
const authMiddleware = require("../middleware/auth");

const {
  createProgramSession,
  getAllProgramSessions,
  getProgramSessionById,
  updateProgramSession,
  deleteProgramSession,
  getProgramSessionsByDateRange,
  getGroupProgramSessions,
  getProgramSessionsByProgramId,
} = require("../controllers/programSessionController");

router.use(authMiddleware);
router.post("/createProgramSession", createProgramSession);
router.get("/getAllProgramSessions", getAllProgramSessions);
router.get("/getProgramSessionById/:id", getProgramSessionById);
router.get("/getGroupProgramSessions/:groupId", getGroupProgramSessions);
router.get("/getProgramSessionsByProgramId/:programId", getProgramSessionsByProgramId);
router.put("/updateProgramSession/:id", updateProgramSession);
router.delete("/deleteProgramSession/:id", deleteProgramSession);
router.get("/getProgramSessionsByDateRange", getProgramSessionsByDateRange);

module.exports = router;