// HYBRID PREDICTION SYSTEM
// Combines ML predictions (trained diseases) + Rule-based (unlimited new diseases)

// ────────────────────────────────────────────────────────────────────────────
// ML PREDICTIONS (from PyTorch model - 10 diseases currently)
// ────────────────────────────────────────────────────────────────────────────
const ML_DISEASES = [
  'Diabetes',                    // Index 0 - ML trained
  'Hypertension',                // Index 1 - ML trained
  'Ischemic Heart Disease',      // Index 2 - ML trained
  'Stroke',                      // Index 3 - ML trained
  'Chronic Kidney Disease',      // Index 4 - ML trained
  'Lung Cancer',                 // Index 5 - ML trained
  'Asthma',                      // Index 6 - ML trained
  'Arthritis',                   // Index 7 - ML trained
  'COPD',                        // Index 8 - ML trained
  'Anemia'                       // Index 9 - ML trained
];

// ────────────────────────────────────────────────────────────────────────────
// RULE-BASED PREDICTIONS (unlimited new diseases)
// These are calculated from user features without requiring ML training
// ────────────────────────────────────────────────────────────────────────────
const RULE_BASED_DISEASES = [
  'Huntingtons',                 // Rule-based (family history, age, stress)
  'Heart Disease',               // Rule-based (BMI, lifestyle, stress, smoking)
  'Parkinsons',                  // Rule-based (age, family history, occupation)
  'Dementia',                    // Rule-based (age, family history, activity, diet)
  'Osteoporosis'                 // Rule-based (age, gender, BMI, activity)
];

// ────────────────────────────────────────────────────────────────────────────
// ALL DISEASES (ML + Rule-based)
// ────────────────────────────────────────────────────────────────────────────
module.exports = [
  ...ML_DISEASES,
  ...RULE_BASED_DISEASES
];

// ────────────────────────────────────────────────────────────────────────────
// HYBRID PREDICTION SYSTEM INFO
// ────────────────────────────────────────────────────────────────────────────
// 
// How it works:
// 1. ML Component: Processes 57 health features through trained neural network
//    - Returns probabilities for 10 diseases with clinical accuracy
//    - Based on real medical data patterns
//
// 2. Rule-Based Component: Calculates risk scores based on medical rules
//    - Hunts for diseases without training data
//    - Each rule checks specific risk factors (family history, lifestyle, etc.)
//    - Completely transparent (can see contributing factors)
//
// 3. Combined: Results merged and ranked by probability
//    - Frontend shows top predictions with confidence scores
//    - Can add infinite new diseases via rule-based engine
//    - No retraining needed for new diseases
//
// To add more diseases:
// 1. Add new disease class to hybrid_prediction.py (RuleBasedEngine class)
// 2. Create _score_{disease_name} method with medical rules
// 3. Add disease name to RULE_BASED_DISEASES array above
// 4. Restart backend server
//
// ────────────────────────────────────────────────────────────────────────────
