const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const { 
    createProgram,
    getUserPrograms,
    getProgramById,
    updateProgram,
    deleteProgram,
    getGroupPrograms,
    acceptProgram,
    declineProgram,
    getPendingPrograms,
 } = require("../controllers/programController");


router.post('/createProgram', auth, createProgram);
router.get('/getUserPrograms', auth, getUserPrograms);
router.get('/getPendingPrograms', auth, getPendingPrograms);
router.get('/getGroupPrograms/:groupId', auth, getGroupPrograms);
router.get('/getProgramById/:id', auth, getProgramById);
router.put('/updateProgram/:id', auth, updateProgram);
router.put('/acceptProgram/:programId', auth, acceptProgram);
router.put('/declineProgram/:programId', auth, declineProgram);
router.delete('/deleteProgram/:id', auth, deleteProgram);

module.exports = router;
