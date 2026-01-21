#!/usr/bin/env python
"""
HYBRID PREDICTION ENGINE
- ML-based predictions for trained diseases
- Rule-based risk scoring for unlimited new diseases
- Combines both approaches for best accuracy
"""
import os
import sys
import json
import numpy as np

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
UTILS_DIR = os.path.join(CURRENT_DIR, 'utils')
sys.path.insert(0, UTILS_DIR)
sys.path.insert(0, CURRENT_DIR)

from inference import load_checkpoint, predict_from_array, _debug_print
from run_batch_predictions import process_input

# ============================================================================
# DISEASE DESCRIPTIONS MAPPING
# ============================================================================
DISEASE_DESCRIPTIONS = {
    'Diabetes': 'A condition affecting blood sugar regulation, associated with diet, weight, and lifestyle factors.',
    'Hypertension': 'High blood pressure that can increase risk of heart disease and stroke.',
    'Ischemic Heart Disease': 'Reduced blood flow to the heart due to narrowed arteries.',
    'Stroke': 'Interrupted blood flow to the brain caused by blockage or rupture of blood vessels.',
    'Chronic Kidney Disease': 'Progressive loss of kidney function affecting toxin removal and fluid balance.',
    'Lung Cancer': 'Malignant growth in the lungs, associated with environmental and lifestyle factors.',
    'Asthma': 'Chronic inflammation of airways causing breathing difficulties and airway obstruction.',
    'Arthritis': 'Joint inflammation causing pain, stiffness, and reduced mobility.',
    'COPD': 'Chronic Obstructive Pulmonary Disease affecting lung function and breathing capacity.',
    'Anemia': 'Low red blood cell count reducing oxygen-carrying capacity in the blood.',
    'Huntingtons': 'Hereditary neurodegenerative disease affecting movement, cognition, and mood.',
    'Heart Disease': 'General heart and cardiovascular dysfunction related to lifestyle and risk factors.',
    'Parkinsons': 'Progressive neurological disorder affecting movement and motor control.',
    'Dementia': 'Decline in cognitive abilities and memory, associated with aging and genetics.',
    'Osteoporosis': 'Weakened bone structure increasing fracture risk, related to age and activity levels.'
}

# ============================================================================
# RULE-BASED ENGINE FOR UNLIMITED DISEASES
# ============================================================================

class RuleBasedEngine:
    """
    Rule-based risk scoring for diseases without ML training data.
    Calculates probability based on user features and medical rules.
    """
    
    def __init__(self):
        """Initialize disease rules and thresholds"""
        self.diseases = {
            'huntingtons': self._score_huntingtons,
            'heart_disease': self._score_heart_disease,
            'lung_cancer': self._score_lung_cancer,
            'parkinsons': self._score_parkinsons,
            'dementia': self._score_dementia,
            'osteoporosis': self._score_osteoporosis,
        }
        
        # Proper disease names mapping (lowercase key -> proper display name)
        self.disease_names = {
            'huntingtons': 'Huntingtons',
            'heart_disease': 'Heart Disease',
            'lung_cancer': 'Lung Cancer',
            'parkinsons': 'Parkinsons',
            'dementia': 'Dementia',
            'osteoporosis': 'Osteoporosis',
        }
    
    def _score_huntingtons(self, data):
        """Huntington's disease risk scoring"""
        score = 0.0
        factors = []
        
        # Family history: strongest predictor
        if self._has_family_history(data, 'huntingtons'):
            score += 0.40
            factors.append(('family_history', 0.40))
        
        # Current neurological conditions
        if self._has_current_condition(data, ['neurological', 'epilepsy', 'parkinson']):
            score += 0.15
            factors.append(('neurological_condition', 0.15))
        
        # Age: typically manifests 30-50
        age = float(data.get('age', 0))
        if 30 <= age <= 60:
            score += 0.15
            factors.append(('age_range', 0.15))
        
        # High stress can trigger symptoms
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.10
            factors.append(('stress_level', 0.10))
        
        # Low sleep worsens neurological symptoms
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.08
            factors.append(('low_sleep', 0.08))
        
        # Alcohol use: can worsen neurological symptoms
        if self._has_addiction(data, 'alcohol'):
            score += 0.07
            factors.append(('alcohol_use', 0.07))
        
        return min(score, 1.0), factors
    
    def _score_heart_disease(self, data):
        """Coronary/heart disease risk scoring"""
        score = 0.0
        factors = []
        
        # Family history
        if self._has_family_history(data, 'heart_disease'):
            score += 0.25
            factors.append(('family_history', 0.25))
        
        # Current conditions: if already has hypertension or diabetes, higher risk
        if self._has_current_condition(data, ['hypertension', 'high blood pressure', 'diabetes']):
            score += 0.20
            factors.append(('existing_condition', 0.20))
        
        # BMI: critical factor
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.20
            factors.append(('high_bmi', 0.20))
        elif bmi > 25:
            score += 0.10
            factors.append(('overweight', 0.10))
        
        # Sedentary lifestyle
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.15
            factors.append(('sedentary', 0.15))
        elif 'light' in activity:
            score += 0.08
            factors.append(('lightly_active', 0.08))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.12
            factors.append(('high_stress', 0.12))
        
        # Smoking/vaping
        if self._has_addiction(data, ['smoking', 'vape']):
            score += 0.15
            factors.append(('smoking_vaping', 0.15))
        
        # High cholesterol indicators (via family history or BMI)
        if bmi > 28:
            score += 0.05
            factors.append(('cholesterol_indicator', 0.05))
        
        # Age: risk increases after 45
        age = float(data.get('age', 0))
        if age > 45:
            score += (age - 45) * 0.01
            factors.append(('age_factor', (age - 45) * 0.01))
        
        return min(score, 1.0), factors
    
    def _score_lung_cancer(self, data):
        """Lung cancer risk scoring"""
        score = 0.0
        factors = []
        
        # Current respiratory conditions
        if self._has_current_condition(data, ['copd', 'asthma', 'respiratory', 'tuberculosis', 'tb']):
            score += 0.25
            factors.append(('respiratory_condition', 0.25))
        
        # Smoking is primary risk
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.35
            factors.append(('smoking', 0.35))
        
        # Vaping
        if self._has_addiction(data, 'vape'):
            score += 0.15
            factors.append(('vaping', 0.15))
        
        # Air pollution exposure
        pollution = data.get('pollutionExposure', 'low').lower()
        if 'high' in pollution:
            score += 0.15
            factors.append(('high_pollution', 0.15))
        elif 'moderate' in pollution:
            score += 0.08
            factors.append(('moderate_pollution', 0.08))
        
        # Family history
        if self._has_family_history(data, ['lung_cancer', 'cancer']):
            score += 0.20
            factors.append(('family_history', 0.20))
        
        # Age: risk increases after 65
        age = float(data.get('age', 0))
        if age > 65:
            score += 0.10
            factors.append(('age_65plus', 0.10))
        
        # Occupational exposure
        occupation = data.get('occupationType', '').lower()
        if any(x in occupation for x in ['mining', 'asbestos', 'industrial']):
            score += 0.15
            factors.append(('occupational_hazard', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_parkinsons(self, data):
        """Parkinson's disease risk scoring"""
        score = 0.0
        factors = []
        
        # Age: typically 60+
        age = float(data.get('age', 0))
        if age > 60:
            score += 0.25
            factors.append(('age_60plus', 0.25))
        elif age > 50:
            score += 0.10
            factors.append(('age_50plus', 0.10))
        
        # Family history
        if self._has_family_history(data, "parkinsons"):
            score += 0.30
            factors.append(('family_history', 0.30))
        
        # Current neurological conditions
        if self._has_current_condition(data, ['neurological', 'tremor', 'epilepsy']):
            score += 0.15
            factors.append(('neurological_condition', 0.15))
        
        # Pesticide exposure (occupational)
        occupation = data.get('occupationType', '').lower()
        if any(x in occupation for x in ['farming', 'agricultural', 'pesticide']):
            score += 0.15
            factors.append(('pesticide_exposure', 0.15))
        
        # High stress and poor sleep
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.10
            factors.append(('high_stress', 0.10))
        
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.10
            factors.append(('poor_sleep', 0.10))
        
        # Head injury history (not tracked, but represented by stress/age combo)
        # Male gender slightly higher risk (simplified as presence)
        if data.get('gender') == 'male':
            score += 0.05
            factors.append(('male_gender', 0.05))
        
        return min(score, 1.0), factors
    
    def _score_dementia(self, data):
        """Dementia/Alzheimer's risk scoring"""
        score = 0.0
        factors = []
        
        # Age: primary risk factor
        age = float(data.get('age', 0))
        if age > 65:
            score += 0.30
            factors.append(('age_65plus', 0.30))
        elif age > 50:
            score += 0.10
            factors.append(('age_50plus', 0.10))
        
        # Family history
        if self._has_family_history(data, ['dementia', 'alzheimers', 'memory']):
            score += 0.25
            factors.append(('family_history', 0.25))
        
        # Current conditions: if already has diabetes, high BP, stroke, higher risk
        if self._has_current_condition(data, ['diabetes', 'stroke', 'hypertension', 'high blood pressure']):
            score += 0.15
            factors.append(('existing_condition', 0.15))
        
        # Low physical activity
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.15
            factors.append(('sedentary', 0.15))
        
        # Poor diet
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'fast_food' in diet or 'junk' in diet:
            score += 0.10
            factors.append(('poor_diet', 0.10))
        
        # Low water intake / poor hydration
        water = float(data.get('dailyWaterIntake_L', 2.0))
        if water < 1.5:
            score += 0.08
            factors.append(('low_water_intake', 0.08))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.12
            factors.append(('high_stress', 0.12))
        
        return min(score, 1.0), factors
    
    def _score_osteoporosis(self, data):
        """Osteoporosis risk scoring"""
        score = 0.0
        factors = []
        
        # Age: critical after 50 (especially women)
        age = float(data.get('age', 0))
        if age > 50:
            score += 0.20
            factors.append(('age_50plus', 0.20))
        elif age > 40:
            score += 0.10
            factors.append(('age_40plus', 0.10))
        
        # Gender: women higher risk (simplified)
        if data.get('gender') == 'female':
            score += 0.15
            factors.append(('female_gender', 0.15))
        
        # Current bone/joint conditions
        if self._has_current_condition(data, ['arthritis', 'osteoarthritis', 'fracture', 'rheumatoid']):
            score += 0.15
            factors.append(('bone_condition', 0.15))
        
        # Low physical activity
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.15
            factors.append(('sedentary', 0.15))
        
        # Family history
        if self._has_family_history(data, ['osteoporosis', 'bone']):
            score += 0.20
            factors.append(('family_history', 0.20))
        
        # Low BMI
        bmi = float(data.get('bmi', 22))
        if bmi < 19:
            score += 0.15
            factors.append(('low_bmi', 0.15))
        
        # Poor diet / low dairy
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'vegan' in diet or 'restricted' in diet:
            score += 0.10
            factors.append(('restricted_diet', 0.10))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.10
            factors.append(('smoking', 0.10))
        
        return min(score, 1.0), factors
    
    def _has_family_history(self, data, diseases):
        """Check if user has family history of disease(s)"""
        family_history = data.get('familyHistory', [])
        if isinstance(family_history, str):
            family_history = [family_history]
        
        if isinstance(diseases, str):
            diseases = [diseases]
        
        family_history_str = ' '.join(family_history).lower()
        for disease in diseases:
            if disease.lower() in family_history_str:
                return True
        return False
    
    def _has_addon(self, data, substances):
        """Check if user has addiction to substance(s)"""
        addiction = data.get('addiction', '')
        if isinstance(addiction, str):
            addiction = addiction.lower()
        else:
            addiction = str(addiction).lower()
        
        if isinstance(substances, str):
            substances = [substances]
        
        for substance in substances:
            if substance.lower() in addiction:
                return True
        return False
    
    def _has_current_condition(self, data, conditions):
        """Check if user has any of the current health conditions"""
        current_conditions = data.get('currentConditions', [])
        if isinstance(current_conditions, str):
            current_conditions = [current_conditions]
        
        if isinstance(conditions, str):
            conditions = [conditions]
        
        current_conditions_str = ' '.join(str(c) for c in current_conditions).lower()
        for condition in conditions:
            if condition.lower() in current_conditions_str:
                return True
        return False
    
    def _has_addiction(self, data, substances):
        """Check if user has addiction to substance(s)"""
        return self._has_addon(data, substances)
    
    def predict_disease(self, disease_name, data):
        """Predict risk for a specific disease"""
        if disease_name.lower() not in self.diseases:
            return 0.0, []
        
        score_func = self.diseases[disease_name.lower()]
        return score_func(data)
    
    def predict_all(self, data):
        """Predict risk for all rule-based diseases"""
        results = {}
        for disease_key in self.diseases:
            score, factors = self.predict_disease(disease_key, data)
            # Use proper display name instead of lowercase key
            proper_name = self.disease_names.get(disease_key, disease_key)
            results[proper_name] = {
                'probability': score,
                'factors': factors,
                'source': 'rule_based'
            }
        return results
    
    def score_custom_disease(self, disease_name, data):
        """
        Score a custom/user-entered disease based on generic risk factors.
        Even though we don't have specific rules for this disease, we can estimate
        risk based on family history, lifestyle, and general health factors.
        """
        score = 0.0
        factors = []
        
        # Primary factor: Family history of this disease
        if self._has_family_history(data, disease_name):
            score += 0.50  # Strong indicator
            factors.append(('family_history', 0.50))
        
        # Age factor: Some genetic diseases manifest at certain ages
        age = float(data.get('age', 0))
        if age > 50:
            score += 0.10
            factors.append(('age_above_50', 0.10))
        
        # Lifestyle factors that increase generic disease risk
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.08
            factors.append(('sedentary_lifestyle', 0.08))
        
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.07
            factors.append(('poor_sleep', 0.07))
        
        # Stress and general health
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.08
            factors.append(('high_stress', 0.08))
        
        # General addictions increase disease risk
        if self._has_addiction(data, ['smoking', 'alcohol']):
            score += 0.10
            factors.append(('substance_abuse', 0.10))
        
        # BMI extremes indicate general health issues
        bmi = float(data.get('bmi', 22))
        if bmi < 18.5 or bmi > 35:
            score += 0.08
            factors.append(('extreme_bmi', 0.08))
        
        # If no risk factors found (score still 0), give minimum baseline
        # This ensures custom diseases are always shown with at least some risk
        if score == 0.0:
            score = 0.05  # 5% baseline for any custom disease user entered
            factors.append(('baseline_risk', 0.05))
        
        return min(score, 0.95), factors  # Cap at 95% for custom diseases


# ============================================================================
# HYBRID PREDICTION PIPELINE
# ============================================================================

def hybrid_predict(user_data):
    """
    HYBRID PREDICTION:
    1. ML predictions for trained diseases (Diabetes, Hypertension, CKD, etc.)
    2. Rule-based predictions for new diseases (Huntington's, Heart Disease, etc.)
    3. Combined & ranked by probability
    """
    
    all_predictions = {}
    
    # ────────────────────────────────────────────────────────────────────
    # PART 1: ML PREDICTIONS (for trained diseases)
    # ────────────────────────────────────────────────────────────────────
    _debug_print("=== HYBRID PREDICTION: Starting ML component ===")
    
    if not load_checkpoint():
        _debug_print("Warning: Could not load ML model, using rule-based only")
    else:
        try:
            # Extract features
            features = process_input(user_data)
            _debug_print(f"Features extracted: {len(features)} elements")
            
            # Get ML predictions
            ml_predictions = predict_from_array(features)
            _debug_print(f"ML predictions: {ml_predictions}")
            
            # Map to disease names
            ml_diseases = [
                'Diabetes',
                'Hypertension',
                'Ischemic Heart Disease',
                'Stroke',
                'Chronic Kidney Disease',
                'Lung Cancer',
                'Asthma',
                'Arthritis',
                'COPD',
                'Anemia'
            ]
            
            for i, prob in enumerate(ml_predictions):
                if i < len(ml_diseases):
                    disease_name = ml_diseases[i]
                    all_predictions[disease_name] = {
                        'probability': float(prob),
                        'factors': [],
                        'source': 'ml_model'
                    }
            
            _debug_print(f"✓ Added {len(ml_predictions)} ML predictions")
            
        except Exception as e:
            _debug_print(f"Error in ML prediction: {str(e)}")
    
    # ────────────────────────────────────────────────────────────────────
    # PART 2: RULE-BASED PREDICTIONS (unlimited new diseases)
    # ────────────────────────────────────────────────────────────────────
    _debug_print("=== HYBRID PREDICTION: Starting rule-based component ===")
    
    engine = RuleBasedEngine()
    rule_predictions = engine.predict_all(user_data)
    
    for disease_name, prediction in rule_predictions.items():
        all_predictions[disease_name] = prediction
        _debug_print(f"✓ {disease_name}: {prediction['probability']:.4f}")
    
    # ────────────────────────────────────────────────────────────────────
    # PART 3: PREDICT CUSTOM/USER-ENTERED DISEASES
    # ────────────────────────────────────────────────────────────────────
    _debug_print("=== HYBRID PREDICTION: Scoring custom diseases ===")
    
    current_conditions = user_data.get('currentConditions', [])
    if isinstance(current_conditions, str):
        current_conditions = [current_conditions]
    
    engine = RuleBasedEngine()
    
    # For each user-entered condition, try to predict its risk
    # (custom diseases not in the predefined list get generic scoring)
    predefined_diseases = [
        'diabetes', 'hypertension', 'ischemic heart disease', 'stroke',
        'chronic kidney disease', 'lung cancer', 'asthma', 'arthritis',
        'copd', 'anemia', 'huntingtons', 'heart disease', 'parkinsons',
        'dementia', 'osteoporosis'
    ]
    
    for condition in current_conditions:
        if isinstance(condition, str) and condition.strip():
            condition_name = condition.strip()
            condition_lower = condition_name.lower()
            
            # Check if this is a custom (non-predefined) disease
            is_custom = not any(pred in condition_lower for pred in predefined_diseases)
            
            if is_custom:
                # Score custom disease using generic risk factors
                score, factors = engine.score_custom_disease(condition_name, user_data)
                if score > 0:
                    all_predictions[condition_name] = {
                        'probability': score,
                        'factors': factors,
                        'source': 'custom_prediction'
                    }
                    _debug_print(f"✓ Custom disease scored: {condition_name} ({score:.2%})")
                else:
                    # No risk factors found, mark as having it (100%)
                    all_predictions[condition_name] = {
                        'probability': 1.0,
                        'factors': [('user_reported', 1.0)],
                        'source': 'user_reported'
                    }
                    _debug_print(f"✓ User-reported condition: {condition_name} (100%)")
            elif condition_name not in all_predictions:
                # This is a predefined disease the user reported having
                all_predictions[condition_name] = {
                    'probability': 1.0,
                    'factors': [('existing_condition', 1.0)],
                    'source': 'existing_condition'
                }
                _debug_print(f"✓ Added current condition: {condition_name} (100%)")
    
    # ────────────────────────────────────────────────────────────────────
    # PART 4: COMBINE & RANK
    # ────────────────────────────────────────────────────────────────────
    _debug_print("=== HYBRID PREDICTION: Combining results ===")
    
    # Sort by probability
    sorted_predictions = sorted(
        all_predictions.items(),
        key=lambda x: x[1]['probability'],
        reverse=True
    )
    
    # Format output
    result = []
    for disease_name, prediction in sorted_predictions:
        # Include:
        # 1. Existing conditions (100% - user already has them)
        # 2. Rule-based predictions (ALL - part of hybrid system, show even if low probability)
        # 3. Custom predictions (scored based on family history & risk factors)
        # 4. User-reported conditions (custom diseases user entered with no scoring)
        # 5. ML predictions > 1% (to reduce noise from model)
        is_existing = prediction['source'] == 'existing_condition'
        is_rule_based = prediction['source'] == 'rule_based'
        is_custom_prediction = prediction['source'] == 'custom_prediction'
        is_user_reported = prediction['source'] == 'user_reported'
        is_ml_above_threshold = prediction['source'] == 'ml_model' and (prediction['probability'] * 100 >= 1)
        
        if is_existing or is_rule_based or is_custom_prediction or is_user_reported or is_ml_above_threshold:
            # Get description from mapping, with fallback
            description = DISEASE_DESCRIPTIONS.get(disease_name, 'Health risk indicator requiring attention.')
            
            result.append({
                'name': disease_name,
                'probability': prediction['probability'],
                'percentage': prediction['probability'] * 100,
                'source': prediction['source'],
                'description': description,
                'factors': prediction.get('factors', [])
            })
    
    _debug_print(f"✓ Final predictions: {len(result)} diseases (including {len([p for p in result if p['source'] == 'existing_condition'])} current conditions)")
    
    return result


# ============================================================================
# MAIN ENTRY POINT (called from Node.js)
# ============================================================================

def main():
    """Main entry point for hybrid prediction"""
    
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
            _debug_print(f"Input data received: {list(input_data.keys())}")
            
            predictions = hybrid_predict(input_data)
            
            # Return as JSON array
            print(json.dumps(predictions))
            
        except Exception as e:
            print(json.dumps({"error": f"Prediction failed: {str(e)}"}))
    else:
        print(json.dumps({"error": "No input data provided"}))


if __name__ == "__main__":
    main()
