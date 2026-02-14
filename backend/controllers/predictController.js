const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const { generateDiseaseDescriptions } = require('../utils/geminiJudge');

// Test prediction with static data
exports.testPrediction = async (req, res) => {
  try {
    // Read test cases from CSV
    const csvPath = path.join(__dirname, '..', 'ml_models', 'data', 'test_prediction.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: 'test data CSV not found' });
    }

    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const header = lines.shift().split(',');
    const testCases = lines.map(line => {
      const values = line.split(',');
      const row = {};
      header.forEach((col, i) => row[col] = values[i]);
      return row;
    });

    const results = [];
    for (const testCase of testCases) {
      // Prepare health data for prediction
      const healthData = {
        age: parseInt(testCase.age),
        gender: testCase.gender,
        height_cm: parseFloat(testCase.height_cm),
        weight_kg: parseFloat(testCase.weight_kg),
        bmi: parseFloat(testCase.bmi),
        activityLevel: testCase.activityLevel,
        sleepHours: parseFloat(testCase.sleepHours)
      };

      // Run Python script for prediction
      const pythonPath = process.env.PYTHON_PATH || 'python';
      const pythonProcess = spawnSync(pythonPath, [
        path.join(__dirname, '..', 'ml_models', 'utils', 'test_prediction.py')
      ], {
        encoding: 'utf-8'
      });

      if (pythonProcess.error) {
        console.error('Python process error:', pythonProcess.error);
        continue;
      }

      // Parse prediction results from the output
      const output = pythonProcess.stdout;
      const predictions = [];
      const lines = output.split('\n');
      let foundResults = false;

      for (const line of lines) {
        if (line.includes('Prediction Results:')) {
          foundResults = true;
          continue;
        }
        if (foundResults && line.trim()) {
          const [disease, probabilityStr] = line.split(':');
          if (disease && probabilityStr) {
            const probability = parseFloat(probabilityStr.replace('%', '')) / 100;
            predictions.push({
              name: disease.trim(),
              probability: probability
            });
          }
        }
      }

      // Sort predictions by probability
      predictions.sort((a, b) => b.probability - a.probability);

      results.push({
        profile: {
          age: healthData.age,
          gender: healthData.gender,
          bmi: healthData.bmi,
          activityLevel: healthData.activityLevel,
          sleepHours: healthData.sleepHours
        },
        predictions: predictions
      });
    }

    return res.json({
      testCases: results.length,
      results: results
    });
  } catch (err) {
    console.error('testPrediction error', err);
    return res.status(500).json({ error: 'prediction test failed', details: err.message });
  }
};

// simple health check
exports.health = (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
};

// getCachedPrediction: fetch existing predictions without regenerating
exports.getCachedPrediction = async (req, res) => {
  try {
    const authUserId = req.user && req.user.id;
    if (!authUserId) return res.status(400).json({ error: 'authentication required' });

    console.log('[getCachedPrediction] fetching cached prediction for userId=', authUserId);

    // Find user and get their last prediction
    const user = await User.findById(authUserId)
      .select('_id username email age gender profilePicture birthdate physicalMetrics lifestyle dietaryProfile healthProfile environmentalFactors riskFactors lastPrediction')
      .exec();

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    // Check if user has existing predictions
    const hasExistingPrediction = user.lastPrediction &&
      Array.isArray(user.lastPrediction.predictions) &&
      user.lastPrediction.predictions.length > 0;

    if (!hasExistingPrediction) {
      return res.status(404).json({
        error: 'No predictions available',
        message: 'Please complete a health assessment first to generate predictions'
      });
    }

    // Build profile object
    const profile = {
      age: user.age || null,
      gender: user.gender || null,
      physicalMetrics: user.physicalMetrics || { height: { value: null }, weight: { value: null }, bmi: null, waistCircumference: null },
      lifestyle: user.lifestyle || { activityLevel: null, sleepHours: null },
      riskFactors: user.riskFactors || { addictions: [], stressLevel: null },
      dietaryProfile: user.dietaryProfile || { preferences: [], allergies: [], dailyWaterIntake: null, mealFrequency: null },
      healthProfile: user.healthProfile || { currentConditions: [], familyHistory: [], medications: [], bloodType: null },
      environmentalFactors: user.environmentalFactors || { pollutionExposure: null, occupationType: null },
      profilePicture: user.profilePicture || null,
      birthdate: user.birthdate || null,
    };

    // Map predictions
    const sortedDiseases = (user.lastPrediction.predictions || []).map((p) => ({
      name: p.name || 'Unknown',
      probability: Number(p.probability) || 0,
      source: p.source || 'model',
      percentage: p.percentage || (Number(p.probability) * 100)
    }));

    return res.json({
      id: String(user._id),
      username: user.username,
      email: user.email,
      profile,
      predictions: sortedDiseases,
      lastPrediction: user.lastPrediction,
      cached: true
    });
  } catch (err) {
    console.error('[getCachedPrediction] error:', err);
    return res.status(500).json({ error: 'failed to fetch predictions', details: err.message });
  }
};

// Return users with lastPrediction (flexible shape)
exports.getDatasetFromDB = async (req, res) => {
  try {
    const users = await User.find({}).select('_id username email lastPrediction').lean().exec();
    const rows = users.map((u) => ({ id: String(u._id), username: u.username, email: u.email || '', prediction: u.lastPrediction || null }));
    console.log(`[predict] getDatasetFromDB returning ${rows.length} rows`);
    return res.json({ count: rows.length, rows });
  } catch (err) {
    console.error('getDatasetFromDB error', err);
    return res.status(500).json({ error: 'could not read predictions from db', details: err && err.message ? err.message : String(err) });
  }
};

// Sample prediction: return first available lastPrediction
exports.samplePrediction = async (req, res) => {
  try {
    const u = await User.findOne({ lastPrediction: { $exists: true } }).select('_id username email lastPrediction').lean().exec();
    if (!u) return res.status(404).json({ error: 'no sample prediction available' });
    return res.json({ id: String(u._id), username: u.username, email: u.email, prediction: u.lastPrediction });
  } catch (err) {
    console.error('samplePrediction error', err);
    return res.status(500).json({ error: 'could not load sample prediction', details: err && err.message });
  }
};

// usersSample: return a list of users and their predictions (for the UI)
// NOTE: usersSample removed — seeded-users flow deprecated. Use /api/users/list or /predict/dataset-db instead.

// datasetPredictions: try to return a local CSV preview; do NOT run heavy Python here in the dev flow
exports.datasetPredictions = async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '..', 'ml_models', 'data', 'health_prediction_dataset_5diseases.csv');
    if (!fs.existsSync(csvPath)) return res.status(404).json({ error: 'dataset CSV not found' });
    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const header = lines.shift().split(',');
    const rows = lines.slice(0, 100).map((l) => l.split(','));
    return res.json({ header, rows });
  } catch (err) {
    console.error('datasetPredictions error', err);
    return res.status(500).json({ error: 'could not read dataset CSV', details: err && err.message });
  }
};

// savePredictionsToDB: not implemented here (keeps things safe)
exports.savePredictionsToDB = async (req, res) => {
  return res.status(501).json({ error: 'not implemented: savePredictionsToDB' });
};

// reload: clears any internal caches (if present)
exports.reload = (req, res) => {
  return res.json({ ok: true });
};

// predictUser: make a new prediction for user using the ML model
exports.predictUser = async (req, res) => {
  try {
    // Prefer authenticated user id from req.user if available (auth middleware sets req.user)
    const bodyUserId = req.body && req.body.userId;
    const authUserId = req.user && req.user.id;
    const userId = authUserId || bodyUserId;
    if (!userId) return res.status(400).json({ error: 'userId required (or authenticate)' });

    // For GET requests, only return cached predictions (never regenerate)
    const isGetRequest = req.method === 'GET';

    // Find user and get their health data
    console.log('[predictUser] method=', req.method, 'authUserId=', authUserId, 'bodyUserId=', bodyUserId, 'resolved userId=', userId);
    // Select full profile fields so frontend can render complete user information
    const user = await User.findById(userId).select('_id username email age gender profilePicture birthdate physicalMetrics lifestyle dietaryProfile healthProfile environmentalFactors riskFactors lastPrediction').exec();
    console.log('[predictUser] fetched user summary=', user ? { id: String(user._id), username: user.username, email: user.email, age: user.age, hasPhysicalMetrics: !!user.physicalMetrics, hasDietaryProfile: !!user.dietaryProfile, hasHealthProfile: !!user.healthProfile } : null);
    // Also print the full sanitized user document to the server console to help debugging
    try {
      const userObj = user && user.toObject ? user.toObject() : (user ? JSON.parse(JSON.stringify(user)) : null);
      if (userObj) {
        delete userObj.password;
        delete userObj.__v;
        console.log('[predictUser] raw user document:\n', JSON.stringify(userObj, null, 2));
      }
    } catch (logErr) {
      console.warn('[predictUser] could not stringify raw user document', logErr && logErr.message ? logErr.message : logErr);
    }
    if (!user) return res.status(404).json({ error: 'user not found' });

    // For GET requests, always return cached prediction (never generate new ones)
    // For POST requests, check if user already has a lastPrediction and force=true is not requested
    // If so, skip generating a new prediction and just return the cached one
    // BUT: Only return cached prediction if it's from TODAY (not from previous days)
    const forceRegenerate = !isGetRequest && ((req.query && String(req.query.force) === 'true') || (req.body && req.body.force === true));
    const hasExistingPrediction = user.lastPrediction && Array.isArray(user.lastPrediction.predictions) && user.lastPrediction.predictions.length > 0;

    // Check if the existing prediction is from TODAY
    const isPredictionFromToday = () => {
      if (!user.lastPrediction?.predictedAt) return false;
      const predDate = new Date(user.lastPrediction.predictedAt);
      const today = new Date();
      // Compare year, month, and day only (ignore time)
      return predDate.getFullYear() === today.getFullYear() &&
        predDate.getMonth() === today.getMonth() &&
        predDate.getDate() === today.getDate();
    };

    const predictionIsFromToday = isPredictionFromToday();

    console.log('[predictUser] method=', req.method, 'isGetRequest=', isGetRequest, 'forceRegenerate=', forceRegenerate, 'hasExistingPrediction=', hasExistingPrediction, 'predictionIsFromToday=', predictionIsFromToday);
    console.log('[predictUser] req.body=', req.body);
    console.log('[predictUser] req.query=', req.query);

    // For GET requests OR if user has predictions and no force regenerate
    if (isGetRequest || (hasExistingPrediction && !forceRegenerate && predictionIsFromToday)) {
      console.log('[predictUser] returning cached prediction', isGetRequest ? '(GET request)' : '(has today prediction, no force)');

      // If GET request and no existing prediction, return error
      if (isGetRequest && !hasExistingPrediction) {
        return res.status(404).json({
          error: 'No predictions available',
          message: 'Please complete a health assessment first to generate predictions'
        });
      }

      // Build profile object to return so frontend can render user info from DB (use schema field names)
      const profile = {
        age: (user && user.age) ? user.age : null,
        gender: (user && user.gender) ? user.gender : null,
        physicalMetrics: user && user.physicalMetrics ? user.physicalMetrics : { height: { value: null }, weight: { value: null }, bmi: null, waistCircumference: null },
        lifestyle: user && user.lifestyle ? user.lifestyle : { activityLevel: null, sleepHours: null },
        riskFactors: user && user.riskFactors ? user.riskFactors : { addictions: [], stressLevel: null },
        dietaryProfile: user && user.dietaryProfile ? user.dietaryProfile : { preferences: [], allergies: [], dailyWaterIntake: null, mealFrequency: null },
        healthProfile: user && user.healthProfile ? user.healthProfile : { currentConditions: [], familyHistory: [], medications: [], bloodType: null },
        environmentalFactors: user && user.environmentalFactors ? user.environmentalFactors : { pollutionExposure: null, occupationType: null },
        profilePicture: user && user.profilePicture ? user.profilePicture : null,
        birthdate: user && user.birthdate ? user.birthdate : null,
      };

      // Map lastPrediction.predictions array into sortedDiseases format for response
      const sortedDiseases = (user.lastPrediction.predictions || []).map((p) => ({
        name: p.name || 'Unknown',
        probability: Number(p.probability) || 0
      }));

      return res.json({
        id: String(user._id),
        username: user.username,
        email: user.email,
        profile,
        predictions: sortedDiseases,
        lastPrediction: user.lastPrediction,
        cached: true
      });
    }

    // If no existing prediction or force=true, generate a new prediction
    // OR if the existing prediction is from a previous day (not from TODAY)
    console.log('[predictUser] generating new prediction for user (no cache from TODAY, or force=true)');

    // Prepare comprehensive health data for ML model prediction with full feature extraction
    // This data will be passed to run_batch_predictions.py which handles feature engineering
    const healthData = {
      age: user.age || 0,
      gender: user.gender === 'male' ? 1 : (user.gender === 'female' ? 0 : 0.5),
      height: user.physicalMetrics?.height?.value || 0,
      height_cm: user.physicalMetrics?.height?.value || 0,
      weight: user.physicalMetrics?.weight?.value || 0,
      weight_kg: user.physicalMetrics?.weight?.value || 0,
      bmi: user.physicalMetrics?.bmi || 0,
      waistCircumference: user.physicalMetrics?.waistCircumference || 0,
      waistCircumference_cm: user.physicalMetrics?.waistCircumference || 0,
      activityLevel: user.lifestyle?.activityLevel || 'sedentary',
      activity_level: user.lifestyle?.activityLevel || 'sedentary',
      sleepHours: user.lifestyle?.sleepHours || 0,
      sleep_hours: user.lifestyle?.sleepHours || 0,
      // Dietary profile
      dietaryPreference: (user.dietaryProfile?.preferences && user.dietaryProfile.preferences.length > 0) ? user.dietaryProfile.preferences[0] : 'none',
      dietaryProfile: (user.dietaryProfile?.preferences && user.dietaryProfile.preferences.length > 0) ? user.dietaryProfile.preferences[0] : 'none',
      allergies: (user.dietaryProfile?.allergies && user.dietaryProfile.allergies.length > 0) ? user.dietaryProfile.allergies.join(',') : 'none',
      dailyWaterIntake: user.dietaryProfile?.dailyWaterIntake || 0,
      dailyWaterIntake_L: user.dietaryProfile?.dailyWaterIntake || 0,
      mealFrequency: user.dietaryProfile?.mealFrequency || 3,
      // Health status
      currentConditions: user.healthProfile?.currentConditions || [],
      currentCondition: (user.healthProfile?.currentConditions && user.healthProfile.currentConditions.length > 0) ? user.healthProfile.currentConditions[0] : 'none',
      familyHistory: user.healthProfile?.familyHistory || [],
      bloodType: user.healthProfile?.bloodType || 'O+',
      medications: user.healthProfile?.medications || [],
      // Environmental factors
      pollutionExposure: user.environmentalFactors?.pollutionExposure || 'low',
      occupationType: user.environmentalFactors?.occupationType || 'mixed',
      // Risk factors
      addictions: user.riskFactors?.addictions || [],
      addiction: (user.riskFactors?.addictions && user.riskFactors.addictions.length > 0) ? user.riskFactors.addictions[0].substance : 'none',
      stressLevel: user.riskFactors?.stressLevel || 'low',
    };

    console.log('[predictUser] prepared healthData for feature extraction:', JSON.stringify(healthData, null, 2));

    // Run Python script for HYBRID prediction (ML + Rule-based)
    // Uses hybrid_prediction.py which combines:
    // - ML predictions for trained diseases (Diabetes, Hypertension, CKD, etc.)
    // - Rule-based scoring for unlimited new diseases (Huntington's, Heart Disease, etc.)
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const pythonProcess = spawnSync(pythonPath, [
      path.join(__dirname, '..', 'ml_models', 'utils', 'hybrid_prediction.py'),
      JSON.stringify(healthData)
    ], {
      encoding: 'utf-8'
    });

    if (pythonProcess.error) {
      console.error('Python process error:', pythonProcess.error);
      return res.status(500).json({ error: 'prediction failed', details: 'Python process error' });
    }

    if (pythonProcess.stderr) {
      console.error('Python stderr:', pythonProcess.stderr);
    }

    // Parse prediction results
    let predictions;
    try {
      predictions = JSON.parse(pythonProcess.stdout);
    } catch (err) {
      console.error('Failed to parse prediction output:', pythonProcess.stdout);
      return res.status(500).json({ error: 'failed to parse prediction results' });
    }

    // If the python script returned an error object or an array containing an error object, surface it
    if (predictions && typeof predictions === 'object') {
      if (predictions.error) {
        console.error('Python prediction error:', predictions.error);
        return res.status(500).json({ error: 'prediction error', details: predictions.error });
      }
      if (Array.isArray(predictions) && predictions.length > 0 && predictions[0] && predictions[0].error) {
        console.error('Python prediction error (array):', predictions[0].error);
        return res.status(500).json({ error: 'prediction error', details: predictions[0].error });
      }
    }

    // If the python script returned an error object, surface it
    if (predictions && typeof predictions === 'object' && predictions.error) {
      console.error('Python prediction error:', predictions.error);
      return res.status(500).json({ error: 'prediction error', details: predictions.error });
    }

    // Normalize numeric-keyed objects into arrays (handle scripts that return arrays or numeric-keyed objects)
    if (!Array.isArray(predictions) && predictions && typeof predictions === 'object') {
      const keys = Object.keys(predictions);
      const allNumericKeys = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
      if (allNumericKeys) {
        const arr = keys.sort((a, b) => Number(a) - Number(b)).map(k => predictions[k]);
        predictions = arr;
      }
    }

    let sortedDiseases;
    if (Array.isArray(predictions)) {
      // Python script returns array of objects with: {name, probability, source, percentage, factors, description}
      // Use the name from the object itself, don't try to map to config labels
      const pairs = predictions.map((p, i) => {
        // Python returns full objects with name, probability, source, etc.
        if (p && typeof p === 'object' && p.name !== undefined && p.probability !== undefined) {
          return {
            name: p.name,
            probability: Number(p.probability),
            percentage: p.percentage || (Number(p.probability) * 100),
            source: p.source || 'model',
            description: p.description || 'Health risk indicator requiring attention.',
          };
        }
        // Fallback for simple numeric arrays
        const probability = Number(p);
        return { name: `Disease ${i}`, probability };
      });
      pairs.sort((a, b) => b.probability - a.probability);
      sortedDiseases = pairs;
    } else {
      sortedDiseases = Object.entries(predictions)
        .sort(([, a], [, b]) => b - a)
        .map(([disease, prob]) => ({ name: disease, probability: prob }));
    }

    // Filter out predictions that would display as 0% to users.
    // BUT: Keep all custom diseases, user-reported conditions, and rule-based predictions
    // ONLY filter low-probability ML predictions to reduce noise
    try {
      const filteredByDisplay = (Array.isArray(sortedDiseases) ? sortedDiseases : []).filter(d => {
        const p = Number(d.probability) || 0;
        const source = d.source || '';

        // Always keep: custom predictions, user-reported, existing conditions, rule-based
        const shouldKeepAll = ['custom_prediction', 'user_reported', 'existing_condition', 'rule_based'].includes(source);
        if (shouldKeepAll) {
          return true;
        }

        // For ML predictions only: filter out if rounds to 0%
        return Math.round(p * 100) > 0;
      });
      if (filteredByDisplay && filteredByDisplay.length > 0) {
        sortedDiseases = filteredByDisplay;
      } else {
        // If there are no predictions with a displayable percentage (>0%), return an empty list
        // so the frontend will show "No predictions available" rather than low-noise 0% items.
        sortedDiseases = [];
      }
    } catch (filErr) {
      console.warn('Could not filter small probabilities by display threshold:', filErr && filErr.message ? filErr.message : filErr);
    }

    // Update user's lastPrediction
    // Persist user's lastPrediction (write full object safely and return updated doc)
    let updatedAuth = null;
    let responseLastPrediction = null;
    let lastPredictionAuth = null;
    try {
      const validAuth = Array.isArray(sortedDiseases) && sortedDiseases.length > 0 && sortedDiseases.every(d => d && typeof d.probability === 'number' && Number.isFinite(d.probability));
      if (validAuth) {
        lastPredictionAuth = {
          // `predictions` is extra metadata (not in schema) but useful to return; schema will store defined fields
          predictions: sortedDiseases.map(d => ({ name: d.name, probability: Number(d.probability), source: d.source || 'model', percentage: d.percentage || Number(d.probability) * 100 })),
          disease: sortedDiseases.map(d => d.name),
          probability: Number(sortedDiseases[0].probability) || 0,
          predictedAt: new Date(),
          source: 'model'
        };
        try {
          // Use findByIdAndUpdate to return the updated document and observe exactly what was saved
          const updatedDoc = await User.findByIdAndUpdate(userId, { $set: { lastPrediction: lastPredictionAuth } }, { new: true }).lean().exec();
          updatedAuth = updatedDoc;
          console.log('[predictUser] findByIdAndUpdate result for user', String(userId), '->', {
            updatedLastPrediction: updatedDoc ? updatedDoc.lastPrediction : null
          });
        } catch (upErr) {
          console.error('[predictUser] DB update error for user', String(userId), upErr && upErr.message ? upErr.message : upErr);
        }
        // Prepare a response-lastPrediction regardless of DB write success
        responseLastPrediction = updatedAuth && updatedAuth.lastPrediction ? updatedAuth.lastPrediction : lastPredictionAuth;
      } else {
        console.warn('predictUser: prediction array not valid, skipping DB write', sortedDiseases && sortedDiseases.length);
      }
    } catch (dbErrAuth) {
      console.error('predictUser DB write error', dbErrAuth && dbErrAuth.message ? dbErrAuth.message : dbErrAuth);
    }

    // Build profile object to return so frontend can render user info from DB (use schema field names)
    // Always return a profile object (never null) so the frontend can render sentences or show "not provided" placeholders
    const profile = {
      age: (user && user.age) ? user.age : null,
      gender: (user && user.gender) ? user.gender : null,
      physicalMetrics: user && user.physicalMetrics ? user.physicalMetrics : { height: { value: null }, weight: { value: null }, bmi: null, waistCircumference: null },
      lifestyle: user && user.lifestyle ? user.lifestyle : { activityLevel: null, sleepHours: null },
      riskFactors: user && user.riskFactors ? user.riskFactors : { addictions: [], stressLevel: null },
      dietaryProfile: user && user.dietaryProfile ? user.dietaryProfile : { preferences: [], allergies: [], dailyWaterIntake: null, mealFrequency: null },
      healthProfile: user && user.healthProfile ? user.healthProfile : { currentConditions: [], familyHistory: [], medications: [], bloodType: null },
      environmentalFactors: user && user.environmentalFactors ? user.environmentalFactors : { pollutionExposure: null, occupationType: null },
      profilePicture: user && user.profilePicture ? user.profilePicture : null,
      birthdate: user && user.birthdate ? user.birthdate : null,
    };

    // Enhance predictions with Gemini descriptions for any missing descriptions (async, non-blocking)
    try {
      const diseasesWithoutDesc = sortedDiseases.filter(d => !d.description || d.description === 'Health risk indicator requiring attention.');
      if (diseasesWithoutDesc.length > 0) {
        const diseaseNames = diseasesWithoutDesc.map(d => d.name);
        console.log('[predictUser] Generating descriptions for', diseaseNames.length, 'diseases via Gemini...');

        // Non-blocking async call - don't wait for it
        generateDiseaseDescriptions(diseaseNames).then(descriptions => {
          // Update sortedDiseases with generated descriptions
          sortedDiseases.forEach(disease => {
            if (descriptions[disease.name]) {
              disease.description = descriptions[disease.name];
            }
          });

          // Update DB with enhanced descriptions
          if (responseLastPrediction && Array.isArray(responseLastPrediction.predictions)) {
            responseLastPrediction.predictions.forEach(pred => {
              const enhanced = sortedDiseases.find(d => d.name === pred.name);
              if (enhanced && enhanced.description) {
                pred.description = enhanced.description;
              }
            });

            // Save to DB asynchronously
            User.findByIdAndUpdate(userId, { lastPrediction: responseLastPrediction }, { new: true })
              .catch(err => console.warn('[predictUser] Could not update descriptions in DB:', err.message));
          }
        }).catch(err => console.warn('[predictUser] Gemini description generation failed:', err.message));
      }
    } catch (geminiErr) {
      console.warn('[predictUser] Error initiating Gemini descriptions:', geminiErr.message);
    }

    // Return prediction results (include saved lastPrediction and profile)
    const resp = {
      id: String(user._id),
      username: user.username,
      email: user.email,
      profile,
      predictions: sortedDiseases,
      lastPrediction: responseLastPrediction
    };

    // Optional debug: include full raw user document when requested (helpful for frontend debugging)
    // Usage: POST /api/predict/me?debug=true  or POST /api/predict/by-email?debug=true
    try {
      const wantDebug = (req.query && String(req.query.debug) === 'true') || (req.body && req.body.debug === true);
      if (wantDebug) {
        // sanitize user object: remove sensitive fields like password
        const userObj = user.toObject ? user.toObject() : JSON.parse(JSON.stringify(user));
        delete userObj.password;
        delete userObj.__v;
        resp.rawUser = userObj;
      }
    } catch (dbgErr) {
      console.warn('Could not attach rawUser debug info', dbgErr && dbgErr.message ? dbgErr.message : dbgErr);
    }

    return res.json(resp);

  } catch (err) {
    console.error('predictUser error', err);
    return res.status(500).json({ error: 'prediction failed', details: err && err.message });
  }
};

// Dev helper: predict user by email (no auth) - uses same prediction pipeline
exports.predictUserByEmail = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    console.log('[predictUserByEmail] email=', email);
    // Select full profile fields for the dev-by-email flow as well
    const user = await User.findOne({ email }).select('_id username email age gender profilePicture physicalMetrics lifestyle dietaryProfile healthProfile environmentalFactors riskFactors lastPrediction').exec();
    console.log('[predictUserByEmail] fetched user summary=', user ? { id: String(user._id), username: user.username, email: user.email, age: user.age, hasPhysicalMetrics: !!user.physicalMetrics, hasDietaryProfile: !!user.dietaryProfile, hasHealthProfile: !!user.healthProfile } : null);
    // Also print the full sanitized user document to the server console to help debugging
    try {
      const userObj = user && user.toObject ? user.toObject() : (user ? JSON.parse(JSON.stringify(user)) : null);
      if (userObj) {
        delete userObj.password;
        delete userObj.__v;
        console.log('[predictUserByEmail] raw user document:\n', JSON.stringify(userObj, null, 2));
      }
    } catch (logErr) {
      console.warn('[predictUserByEmail] could not stringify raw user document', logErr && logErr.message ? logErr.message : logErr);
    }
    if (!user) return res.status(404).json({ error: 'user not found' });

    let responseLastPrediction = null;

    // Prepare comprehensive health data for prediction (HYBRID system: ML + Rules)
    const healthData = {
      age: user.age || 0,
      gender: user.gender || 'other',
      height_cm: user.physicalMetrics?.height?.value || 0,
      weight_kg: user.physicalMetrics?.weight?.value || 0,
      bmi: user.physicalMetrics?.bmi || 0,
      waistCircumference_cm: user.physicalMetrics?.waistCircumference || 0,
      activityLevel: user.lifestyle?.activityLevel || 'sedentary',
      sleepHours: user.lifestyle?.sleepHours || 0,
      // Dietary profile
      dietaryPreference: (user.dietaryProfile?.preferences && user.dietaryProfile.preferences.length > 0) ? user.dietaryProfile.preferences[0] : 'none',
      allergies: (user.dietaryProfile?.allergies && user.dietaryProfile.allergies.length > 0) ? user.dietaryProfile.allergies.join(',') : 'none',
      dailyWaterIntake_L: user.dietaryProfile?.dailyWaterIntake || 0,
      mealFrequency: user.dietaryProfile?.mealFrequency || 3,
      // Health status
      currentConditions: user.healthProfile?.currentConditions || [],
      familyHistory: user.healthProfile?.familyHistory || [],
      bloodType: user.healthProfile?.bloodType || 'O+',
      medications: user.healthProfile?.medications || [],
      // Environmental factors
      pollutionExposure: user.environmentalFactors?.pollutionExposure || 'low',
      occupationType: user.environmentalFactors?.occupationType || 'mixed',
      // Risk factors
      addictions: user.riskFactors?.addictions || [],
      stressLevel: user.riskFactors?.stressLevel || 'low'
    };

    // Run Python script for HYBRID prediction (ML + Rule-based)
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const pythonProcess = spawnSync(pythonPath, [
      path.join(__dirname, '..', 'ml_models', 'utils', 'hybrid_prediction.py'),
      JSON.stringify(healthData)
    ], {
      encoding: 'utf-8'
    });

    if (pythonProcess.error) {
      console.error('Python process error:', pythonProcess.error);
      return res.status(500).json({ error: 'prediction failed', details: 'Python process error' });
    }
    if (pythonProcess.stderr) console.error('Python stderr:', pythonProcess.stderr);

    let predictions;
    try {
      predictions = JSON.parse(pythonProcess.stdout);
    } catch (err) {
      console.error('Failed to parse prediction output:', pythonProcess.stdout);
      return res.status(500).json({ error: 'failed to parse prediction results' });
    }

    let sortedDiseases;
    // Normalize numeric-keyed objects into arrays
    if (!Array.isArray(predictions) && predictions && typeof predictions === 'object') {
      const keys = Object.keys(predictions);
      const allNumericKeys = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
      if (allNumericKeys) {
        const arr = keys.sort((a, b) => Number(a) - Number(b)).map(k => predictions[k]);
        predictions = arr;
      }
    }

    if (Array.isArray(predictions)) {
      // Map array indices to human-readable labels. Prefer a configurable labels file.
      let diseases = null;
      try {
        diseases = require('../config/diseases');
      } catch (e) {
        diseases = null;
      }
      const fallback = ["Diabetes", "Hypertension", "Ischemic Heart Disease", "Stroke", "Chronic Kidney Disease", "Lung Cancer", "Asthma", "Arthritis", "COPD", "Anemia"];
      const labelSource = Array.isArray(diseases) ? diseases : fallback;
      const pairs = predictions.map((p, i) => ({ name: labelSource[i] || String(i), probability: Number(p) }));
      pairs.sort((a, b) => b.probability - a.probability);
      sortedDiseases = pairs;
    } else {
      sortedDiseases = Object.entries(predictions)
        .sort(([, a], [, b]) => b - a)
        .map(([disease, prob]) => ({ name: disease, probability: prob }));
    }

    // If some labels are numeric indices, try to remap them using optional config.
    try {
      let labels = null;
      try { labels = require('../config/diseases'); } catch (e) { labels = null; }
      if (Array.isArray(labels)) {
        sortedDiseases = sortedDiseases.map((d) => {
          if (/^\d+$/.test(String(d.name))) {
            const idx = Number(d.name);
            return { name: labels[idx] || String(idx), probability: Number(d.probability) };
          }
          return { name: d.name, probability: Number(d.probability) };
        });
      } else {
        sortedDiseases = sortedDiseases.map((d) => ({ name: d.name, probability: Number(d.probability) }));
      }
    } catch (remapErr) {
      // Fallback: ensure probabilities are numbers
      sortedDiseases = sortedDiseases.map((d) => ({ name: d.name, probability: Number(d.probability) }));
    }

    // Persist prediction to user's lastPrediction (dev endpoint now also saves results safely)
    let updated = null;
    try {
      // Validate sortedDiseases: must be an array with numeric probabilities
      const valid = Array.isArray(sortedDiseases) && sortedDiseases.length > 0 && sortedDiseases.every(d => d && typeof d.probability === 'number' && Number.isFinite(d.probability));
      if (valid) {
        const lastPrediction = {
          predictions: sortedDiseases.map(d => ({ name: d.name, probability: Number(d.probability) })),
          disease: sortedDiseases.map(d => d.name),
          probability: Number(sortedDiseases[0].probability) || 0,
          predictedAt: new Date(),
          source: 'model'
        };
        try {
          const updatedDoc = await User.findByIdAndUpdate(user._id, { $set: { lastPrediction } }, { new: true }).lean().exec();
          updated = updatedDoc;
          console.log('[predictUserByEmail] findByIdAndUpdate result for user', String(user._id), '->', { updatedLastPrediction: updatedDoc ? updatedDoc.lastPrediction : null });
        } catch (upErr) {
          console.error('[predictUserByEmail] DB update error for user', String(user._id), upErr && upErr.message ? upErr.message : upErr);
        }
        // Prepare response lastPrediction independently of DB write success
        responseLastPrediction = lastPrediction;
        if (updated && updated.lastPrediction) responseLastPrediction = updated.lastPrediction;
      } else {
        console.warn('predictUserByEmail: prediction array not valid, skipping DB write', sortedDiseases && sortedDiseases.length);
      }
    } catch (dbErr) {
      console.error('predictUserByEmail DB write error', dbErr && dbErr.message ? dbErr.message : dbErr);
    }

    // build profile for dev endpoint as well (always return an object)
    const profile = {
      age: (user && user.age) ? user.age : null,
      gender: (user && user.gender) ? user.gender : null,
      physicalMetrics: user && user.physicalMetrics ? user.physicalMetrics : { height: { value: null }, weight: { value: null }, bmi: null, waistCircumference: null },
      lifestyle: user && user.lifestyle ? user.lifestyle : { activityLevel: null, sleepHours: null },
      riskFactors: user && user.riskFactors ? user.riskFactors : { addictions: [], stressLevel: null },
      dietaryProfile: user && user.dietaryProfile ? user.dietaryProfile : { preferences: [], allergies: [], dailyWaterIntake: null, mealFrequency: null },
      healthProfile: user && user.healthProfile ? user.healthProfile : { currentConditions: [], familyHistory: [], medications: [], bloodType: null },
      environmentalFactors: user && user.environmentalFactors ? user.environmentalFactors : { pollutionExposure: null, occupationType: null },
      profilePicture: user && user.profilePicture ? user.profilePicture : null,
      birthdate: user && user.birthdate ? user.birthdate : null,
    };

    return res.json({ id: String(user._id), username: user.username, email: user.email, profile, predictions: sortedDiseases, lastPrediction: typeof responseLastPrediction !== 'undefined' ? responseLastPrediction : (updated && updated.lastPrediction ? updated.lastPrediction : null) });
  } catch (err) {
    console.error('predictUserByEmail error', err);
    return res.status(500).json({ error: 'prediction failed', details: err && err.message });
  }
};
