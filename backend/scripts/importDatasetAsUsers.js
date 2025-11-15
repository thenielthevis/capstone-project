const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env from backend/.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const User = require('../models/userModel');

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // naive CSV split that handles simple commas inside quoted strings
    // For safety we attempt a basic parser: split by comma but respect quotes
    const line = lines[i];
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(cur); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur);
    // Pad or trim
    while (values.length < header.length) values.push('');
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = values[j] !== undefined ? values[j].trim() : '';
    }
    rows.push(obj);
  }
  return rows;
}

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.DB_URI || process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error('No MongoDB URI found. Add MONGO_URI or DB_URI to backend/.env');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const csvPath = path.join(__dirname, '..', 'ml_models', 'data', 'health_prediction_dataset_5diseases.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found at', csvPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(raw);
  console.log('Parsed rows:', rows.length);

  const created = [];
  // small name lists for random generation
  const firstNames = ['Luna','Mateo','Sofia','Noah','Mia','Luca','Ana','Carlos','Marina','Diego','Isla','Rafael','Ella','Lucas','Nora'];
  const lastNames = ['Garcia','Santos','Reyes','Lopez','Cruz','Delgado','Torres','Ramos','Moreno','Vargas','Ibarra','Silva','Ortiz','Navarro','Dominguez'];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      // generate a more human-like random name
      const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
      const username = `${fname.toLowerCase()}_${lname.toLowerCase()}_${i}`;
      const email = `${username}@example.com`;

      const existing = await User.findOne({ email }).exec();
      // parse diseases: CSV may include comma-separated list
      const diseaseVal = r.Diseases || '';
      const diseaseArr = String(diseaseVal).split(',').map(s => s.trim()).filter(Boolean);

      if (existing) {
        // update selected fields
        existing.age = r.age ? Number(r.age) : existing.age;
        existing.gender = r.gender || existing.gender;
        existing.physicalMetrics = existing.physicalMetrics || {};
        existing.physicalMetrics.height = existing.physicalMetrics.height || {};
        existing.physicalMetrics.height.value = r.height_cm ? Number(r.height_cm) : existing.physicalMetrics.height.value;
        existing.physicalMetrics.weight = existing.physicalMetrics.weight || {};
        existing.physicalMetrics.weight.value = r.weight_kg ? Number(r.weight_kg) : existing.physicalMetrics.weight.value;
        existing.physicalMetrics.bmi = r.bmi ? Number(r.bmi) : existing.physicalMetrics.bmi;
        existing.physicalMetrics.waistCircumference = r.waistCircumference_cm ? Number(r.waistCircumference_cm) : existing.physicalMetrics.waistCircumference;

        existing.lifestyle = existing.lifestyle || {};
        existing.lifestyle.activityLevel = r.activityLevel || existing.lifestyle.activityLevel;
        existing.lifestyle.sleepHours = r.sleepHours ? Number(r.sleepHours) : existing.lifestyle.sleepHours;

        existing.dietaryProfile = existing.dietaryProfile || {};
        existing.dietaryProfile.preferences = r.dietaryPreference ? [r.dietaryPreference] : existing.dietaryProfile.preferences;
        existing.dietaryProfile.allergies = r.allergies ? r.allergies.split(';').map(s => s.trim()).filter(Boolean) : existing.dietaryProfile.allergies;
        existing.dietaryProfile.dailyWaterIntake = r.dailyWaterIntake_L ? Number(r.dailyWaterIntake_L) : existing.dietaryProfile.dailyWaterIntake;
        existing.dietaryProfile.mealFrequency = r.mealFrequency ? Number(r.mealFrequency) : existing.dietaryProfile.mealFrequency;

        existing.healthProfile = existing.healthProfile || {};
        existing.healthProfile.currentConditions = r.currentCondition ? r.currentCondition.split(';').map(s => s.trim()).filter(Boolean) : existing.healthProfile.currentConditions;
        existing.healthProfile.familyHistory = r.familyHistory ? r.familyHistory.split(';').map(s => s.trim()).filter(Boolean) : existing.healthProfile.familyHistory;
        existing.healthProfile.bloodType = r.bloodType || existing.healthProfile.bloodType;

        existing.environmentalFactors = existing.environmentalFactors || {};
        existing.environmentalFactors.pollutionExposure = r.pollutionExposure || existing.environmentalFactors.pollutionExposure;
        existing.environmentalFactors.occupationType = r.occupationType || existing.environmentalFactors.occupationType;

        existing.riskFactors = existing.riskFactors || {};
        existing.riskFactors.stressLevel = r.stressLevel || existing.riskFactors.stressLevel;

        existing.lastPrediction = {
          disease: diseaseArr.length > 0 ? diseaseArr : undefined,
          probability: null,
          predictedAt: new Date(),
          source: 'dataset'
        };

        await existing.save();
        created.push(existing);
        continue;
      }

      // create a new user from dataset row
      const newUser = new User({
        username,
        email,
        password: 'Password123', // will be hashed by pre-save hook
        role: 'user',
        verified: true,
        age: r.age ? Number(r.age) : undefined,
        gender: r.gender || undefined,
        physicalMetrics: {
          height: { value: r.height_cm ? Number(r.height_cm) : undefined },
          weight: { value: r.weight_kg ? Number(r.weight_kg) : undefined },
          bmi: r.bmi ? Number(r.bmi) : undefined,
          waistCircumference: r.waistCircumference_cm ? Number(r.waistCircumference_cm) : undefined
        },
        lifestyle: {
          activityLevel: r.activityLevel || undefined,
          sleepHours: r.sleepHours ? Number(r.sleepHours) : undefined
        },
        dietaryProfile: {
          preferences: r.dietaryPreference ? [r.dietaryPreference] : undefined,
          allergies: r.allergies ? r.allergies.split(';').map(s => s.trim()).filter(Boolean) : undefined,
          dailyWaterIntake: r.dailyWaterIntake_L ? Number(r.dailyWaterIntake_L) : undefined,
          mealFrequency: r.mealFrequency ? Number(r.mealFrequency) : undefined
        },
        healthProfile: {
          currentConditions: r.currentCondition ? r.currentCondition.split(';').map(s => s.trim()).filter(Boolean) : undefined,
          familyHistory: r.familyHistory ? r.familyHistory.split(';').map(s => s.trim()).filter(Boolean) : undefined,
          medications: undefined,
          bloodType: r.bloodType || undefined
        },
        environmentalFactors: {
          pollutionExposure: r.pollutionExposure || undefined,
          occupationType: r.occupationType || undefined
        },
        riskFactors: {
          addictions: undefined,
          stressLevel: r.stressLevel || undefined
        },
        lastPrediction: {
          disease: diseaseArr.length > 0 ? diseaseArr : undefined,
          probability: null,
          predictedAt: new Date(),
          source: 'dataset'
        }
      });

      await newUser.save();
      created.push(newUser);
    } catch (rowErr) {
      console.warn(`Failed to import row ${i}:`, rowErr && rowErr.message ? rowErr.message : rowErr);
      continue;
    }
  }

  console.log('Imported/updated users:', created.length);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error('Import failed', e); process.exit(1); });