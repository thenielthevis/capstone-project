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
    
    def _score_huntingtons(self, data):
        """Huntington's disease risk scoring"""
        score = 0.0
        factors = []
        
        # Family history: strongest predictor
        if self._has_family_history(data, 'huntingtons'):
            score += 0.40
            factors.append(('family_history', 0.40))
        
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
    
    def _has_addiction(self, data, substances):
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
    
    def predict_disease(self, disease_name, data):
        """Predict risk for a specific disease"""
        if disease_name.lower() not in self.diseases:
            return 0.0, []
        
        score_func = self.diseases[disease_name.lower()]
        return score_func(data)
    
    def predict_all(self, data):
        """Predict risk for all rule-based diseases"""
        results = {}
        for disease_name in self.diseases:
            score, factors = self.predict_disease(disease_name, data)
            results[disease_name] = {
                'probability': score,
                'factors': factors,
                'source': 'rule_based'
            }
        return results


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
    # PART 3: COMBINE & RANK
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
        # Only include predictions > 1% to reduce noise
        if prediction['probability'] * 100 >= 1:
            result.append({
                'name': disease_name,
                'probability': prediction['probability'],
                'percentage': prediction['probability'] * 100,
                'source': prediction['source'],
                'factors': prediction.get('factors', [])
            })
    
    _debug_print(f"✓ Final predictions: {len(result)} diseases")
    
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
