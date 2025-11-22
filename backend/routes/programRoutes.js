const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const { 
    createProgram,
    getUserPrograms,
    getProgramById,
    updateProgram,
    deleteProgram,
 } = require("../controllers/programController");


router.post('/createProgram', auth, createProgram);
router.get('/getUserPrograms', auth, getUserPrograms);
router.get('/getProgramById/:id', auth, getProgramById);
router.put('/updateProgram/:id', auth, updateProgram);
router.delete('/deleteProgram/:id', auth, deleteProgram);

module.exports = router;
