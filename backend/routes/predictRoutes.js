const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

const auth = require('../middleware/auth');

// Protected route - requires authentication
router.post('/user', auth, predictController.predictUser);
// Authenticated: predict for currently logged-in user
router.post('/me', auth, predictController.predictUser);
// GET route to fetch existing predictions without regenerating
router.get('/me', auth, predictController.getCachedPrediction);
// GET cached predictions (alias)
router.get('/cached', auth, predictController.getCachedPrediction);
// Dev: predict for a user by email (no auth, dev-only)
router.post('/by-email', predictController.predictUserByEmail);
router.get('/sample', predictController.samplePrediction);
router.get('/health', predictController.health);
router.get('/dataset', predictController.datasetPredictions);
router.get('/test', predictController.testPrediction);
router.post('/save-dataset', predictController.savePredictionsToDB);
router.get('/dataset-db', predictController.getDatasetFromDB);
router.post('/reload', predictController.reload);

module.exports = router;
