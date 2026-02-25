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
    'Osteoporosis': 'Weakened bone structure increasing fracture risk, related to age and activity levels.',
    'Thyroid Disorder': 'Thyroid gland dysfunction affecting metabolism and hormone regulation.',
    'Obesity': 'Excessive body weight increasing risk of multiple chronic diseases.',
    'Depression': 'Mental health condition affecting mood, motivation, and quality of life.',
    'Anxiety': 'Persistent worry and tension affecting daily functioning.',
    'Type 2 Diabetes': 'Insulin resistance leading to high blood sugar levels.',
    'Type 1 Diabetes': 'Autoimmune condition where body cannot produce insulin.',
    'Cholesterol': 'High blood cholesterol increasing cardiovascular disease risk.',
    'Migraine': 'Severe headaches often with nausea and sensitivity to light.',
    'Gout': 'Painful inflammatory condition caused by uric acid crystal accumulation.',
    'Fatty Liver Disease': 'Fat accumulation in liver cells affecting liver function.',
    'Sleep Apnea': 'Breathing interruptions during sleep affecting oxygen levels.',
    'Pneumonia': 'Lung infection causing inflammation and fluid accumulation.',
    'Bronchitis': 'Inflammation of airways in lungs causing persistent cough.',
    'Tuberculosis': 'Infectious bacterial disease primarily affecting the lungs.',
    'Kidney Stones': 'Hard mineral deposits forming in kidneys causing severe pain.',
    'Prostate Issues': 'Enlargement or inflammation of prostate gland in males.',
    'Cervical Cancer': 'Malignant growth in cervix affecting women.',
    'Breast Cancer': 'Malignant tumor in breast tissue.',
    'Colorectal Cancer': 'Cancer affecting colon or rectum.',
    'Skin Cancer': 'Malignant growth on skin from UV or genetic factors.',
    'Alzheimers': 'Progressive brain disorder causing memory loss and cognitive decline.',
    'Rheumatoid Arthritis': 'Autoimmune joint disease causing pain and inflammation.',
    'Lupus': 'Autoimmune disease affecting multiple body systems.',
    'Celiac Disease': 'Autoimmune condition triggered by gluten consumption.',
    'IBS': 'Irritable Bowel Syndrome causing digestive discomfort.',
    'Crohns Disease': 'Inflammatory bowel disease affecting digestive tract.',
    'Hepatitis': 'Liver inflammation from viral or autoimmune causes.',
    'Gastroenteritis': 'Stomach and intestinal inflammation from infection.',
    'Ulcers': 'Sores in stomach or intestinal lining.',
    'Glaucoma': 'Eye disease causing optic nerve damage and vision loss.',
    'Cataracts': 'Clouding of eye lens affecting vision.',
    'Diabetic Retinopathy': 'Eye damage from diabetes affecting blood vessels in retina.',
    'Hyperlipidemia': 'Abnormally high levels of lipids in blood.',
    'Metabolic Syndrome': 'Group of conditions including obesity, high BP, and high blood sugar.',
    'Polycystic Ovary Syndrome': 'Hormonal disorder affecting women with irregular periods.',
    'Endometriosis': 'Tissue growth outside uterus causing pain.',
    'Benign Prostatic Hyperplasia': 'Non-cancerous enlargement of prostate.',
    'Erectile Dysfunction': 'Difficulty achieving or maintaining erections.',
    'Multiple Sclerosis': 'Autoimmune disease affecting nervous system.',
    'Epilepsy': 'Neurological disorder causing recurrent seizures.',
    'Migraine Headaches': 'Intense, debilitating headaches often unilateral.',
    'Peripheral Neuropathy': 'Nerve damage causing weakness and pain in extremities.',
    'Neuropathy': 'Nerve damage affecting sensation and motor function.',
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
            'thyroid_disorder': self._score_thyroid_disorder,
            'obesity': self._score_obesity,
            'depression': self._score_depression,
            'anxiety': self._score_anxiety,
            'cholesterol': self._score_cholesterol,
            'migraine': self._score_migraine,
            'gout': self._score_gout,
            'fatty_liver_disease': self._score_fatty_liver_disease,
            'sleep_apnea': self._score_sleep_apnea,
            'pneumonia': self._score_pneumonia,
            'bronchitis': self._score_bronchitis,
            'tuberculosis': self._score_tuberculosis,
            'kidney_stones': self._score_kidney_stones,
            'prostate_issues': self._score_prostate_issues,
            'breast_cancer': self._score_breast_cancer,
            'colorectal_cancer': self._score_colorectal_cancer,
            'rheumatoid_arthritis': self._score_rheumatoid_arthritis,
            'lupus': self._score_lupus,
            'ibs': self._score_ibs,
            'crohns_disease': self._score_crohns_disease,
            'hepatitis': self._score_hepatitis,
            'glaucoma': self._score_glaucoma,
            'cataracts': self._score_cataracts,
            'metabolic_syndrome': self._score_metabolic_syndrome,
            'pcos': self._score_pcos,
            'multiple_sclerosis': self._score_multiple_sclerosis,
            'epilepsy': self._score_epilepsy,
            'peripheral_neuropathy': self._score_peripheral_neuropathy,
        }
        
        # Proper disease names mapping (lowercase key -> proper display name)
        self.disease_names = {
            'huntingtons': 'Huntingtons',
            'heart_disease': 'Heart Disease',
            'lung_cancer': 'Lung Cancer',
            'parkinsons': 'Parkinsons',
            'dementia': 'Dementia',
            'osteoporosis': 'Osteoporosis',
            'thyroid_disorder': 'Thyroid Disorder',
            'obesity': 'Obesity',
            'depression': 'Depression',
            'anxiety': 'Anxiety',
            'cholesterol': 'Cholesterol',
            'migraine': 'Migraine',
            'gout': 'Gout',
            'fatty_liver_disease': 'Fatty Liver Disease',
            'sleep_apnea': 'Sleep Apnea',
            'pneumonia': 'Pneumonia',
            'bronchitis': 'Bronchitis',
            'tuberculosis': 'Tuberculosis',
            'kidney_stones': 'Kidney Stones',
            'prostate_issues': 'Prostate Issues',
            'breast_cancer': 'Breast Cancer',
            'colorectal_cancer': 'Colorectal Cancer',
            'rheumatoid_arthritis': 'Rheumatoid Arthritis',
            'lupus': 'Lupus',
            'ibs': 'IBS',
            'crohns_disease': 'Crohns Disease',
            'hepatitis': 'Hepatitis',
            'glaucoma': 'Glaucoma',
            'cataracts': 'Cataracts',
            'metabolic_syndrome': 'Metabolic Syndrome',
            'pcos': 'PCOS',
            'multiple_sclerosis': 'Multiple Sclerosis',
            'epilepsy': 'Epilepsy',
            'peripheral_neuropathy': 'Peripheral Neuropathy',
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
    
    def _score_thyroid_disorder(self, data):
        """Thyroid disorder risk scoring"""
        score = 0.0
        factors = []
        
        # Gender: women more susceptible
        if data.get('gender') == 'female':
            score += 0.20
            factors.append(('female_gender', 0.20))
        
        # Family history
        if self._has_family_history(data, ['thyroid', 'goiter']):
            score += 0.30
            factors.append(('family_history', 0.30))
        
        # Age: higher risk after 50
        age = float(data.get('age', 0))
        if age > 50:
            score += 0.15
            factors.append(('age_50plus', 0.15))
        
        # Current conditions
        if self._has_current_condition(data, ['autoimmune', 'iodine deficiency']):
            score += 0.20
            factors.append(('autoimmune_condition', 0.20))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.10
            factors.append(('high_stress', 0.10))
        
        # Poor sleep
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.08
            factors.append(('poor_sleep', 0.08))
        
        return min(score, 1.0), factors
    
    def _score_obesity(self, data):
        """Obesity risk scoring"""
        score = 0.0
        factors = []
        
        # BMI: primary factor
        bmi = float(data.get('bmi', 22))
        if bmi > 35:
            score += 0.40
            factors.append(('very_high_bmi', 0.40))
        elif bmi > 30:
            score += 0.30
            factors.append(('high_bmi', 0.30))
        elif bmi > 25:
            score += 0.15
            factors.append(('overweight', 0.15))
        
        # Family history
        if self._has_family_history(data, ['obesity', 'overweight']):
            score += 0.15
            factors.append(('family_history', 0.15))
        
        # Sedentary lifestyle
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.20
            factors.append(('sedentary', 0.20))
        
        # Poor diet
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'fast_food' in diet or 'junk' in diet:
            score += 0.15
            factors.append(('poor_diet', 0.15))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.10
            factors.append(('high_stress', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_depression(self, data):
        """Depression risk scoring"""
        score = 0.0
        factors = []
        
        # High stress: major factor
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.30
            factors.append(('high_stress', 0.30))
        
        # Poor sleep
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6 or sleep > 9:
            score += 0.15
            factors.append(('poor_sleep', 0.15))
        
        # Sedentary lifestyle
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.15
            factors.append(('sedentary', 0.15))
        
        # Family history
        if self._has_family_history(data, ['depression', 'mental health']):
            score += 0.25
            factors.append(('family_history', 0.25))
        
        # Addiction issues
        if self._has_addiction(data, ['alcohol', 'drugs']):
            score += 0.15
            factors.append(('addiction', 0.15))
        
        # Low water intake (dehydration affects mood)
        water = float(data.get('dailyWaterIntake_L', 2.0))
        if water < 1.5:
            score += 0.10
            factors.append(('dehydration', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_anxiety(self, data):
        """Anxiety disorder risk scoring"""
        score = 0.0
        factors = []
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.35
            factors.append(('high_stress', 0.35))
        
        # Family history
        if self._has_family_history(data, ['anxiety', 'panic']):
            score += 0.25
            factors.append(('family_history', 0.25))
        
        # Poor sleep
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.15
            factors.append(('poor_sleep', 0.15))
        
        # High caffeine consumption (not tracked, but implied in activity)
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.10
            factors.append(('sedentary', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_cholesterol(self, data):
        """High cholesterol risk scoring"""
        score = 0.0
        factors = []
        
        # Age: risk increases with age
        age = float(data.get('age', 0))
        if age > 45:
            score += (age - 45) * 0.005
            factors.append(('age_factor', (age - 45) * 0.005))
        
        # Family history
        if self._has_family_history(data, ['cholesterol', 'heart disease']):
            score += 0.25
            factors.append(('family_history', 0.25))
        
        # BMI
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
        
        # Poor diet
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'fast_food' in diet or 'junk' in diet:
            score += 0.20
            factors.append(('poor_diet', 0.20))
        
        return min(score, 1.0), factors
    
    def _score_migraine(self, data):
        """Migraine risk scoring"""
        score = 0.0
        factors = []
        
        # Family history: strong predictor
        if self._has_family_history(data, ['migraine', 'headache']):
            score += 0.40
            factors.append(('family_history', 0.40))
        
        # Gender: women more susceptible
        if data.get('gender') == 'female':
            score += 0.20
            factors.append(('female_gender', 0.20))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.20
            factors.append(('high_stress', 0.20))
        
        # Poor sleep
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6 or sleep > 9:
            score += 0.15
            factors.append(('poor_sleep', 0.15))
        
        # Dehydration
        water = float(data.get('dailyWaterIntake_L', 2.0))
        if water < 1.5:
            score += 0.15
            factors.append(('dehydration', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_gout(self, data):
        """Gout risk scoring"""
        score = 0.0
        factors = []
        
        # Age and gender: more common in men over 40
        age = float(data.get('age', 0))
        if data.get('gender') == 'male' and age > 40:
            score += 0.20
            factors.append(('male_age_factor', 0.20))
        
        # Family history
        if self._has_family_history(data, ['gout', 'uric acid']):
            score += 0.30
            factors.append(('family_history', 0.30))
        
        # High BMI
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.20
            factors.append(('high_bmi', 0.20))
        
        # Alcohol consumption
        if self._has_addiction(data, 'alcohol'):
            score += 0.25
            factors.append(('alcohol_consumption', 0.25))
        
        # Poor diet (high purine foods)
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'meat' in diet or 'seafood' in diet:
            score += 0.15
            factors.append(('high_purine_diet', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_fatty_liver_disease(self, data):
        """Fatty Liver Disease risk scoring"""
        score = 0.0
        factors = []
        
        # BMI: key factor
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.25
            factors.append(('high_bmi', 0.25))
        elif bmi > 25:
            score += 0.12
            factors.append(('overweight', 0.12))
        
        # Diabetes/metabolic conditions
        if self._has_current_condition(data, ['diabetes', 'metabolic']):
            score += 0.20
            factors.append(('metabolic_condition', 0.20))
        
        # Alcohol consumption
        if self._has_addiction(data, 'alcohol'):
            score += 0.25
            factors.append(('alcohol_consumption', 0.25))
        
        # Sedentary lifestyle
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.15
            factors.append(('sedentary', 0.15))
        
        # Poor diet
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'fast_food' in diet or 'junk' in diet:
            score += 0.15
            factors.append(('poor_diet', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_sleep_apnea(self, data):
        """Sleep Apnea risk scoring"""
        score = 0.0
        factors = []
        
        # BMI: strong predictor
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.30
            factors.append(('high_bmi', 0.30))
        elif bmi > 25:
            score += 0.15
            factors.append(('overweight', 0.15))
        
        # Age: more common after 50
        age = float(data.get('age', 0))
        if age > 50:
            score += 0.15
            factors.append(('age_50plus', 0.15))
        
        # Gender: more common in men
        if data.get('gender') == 'male':
            score += 0.15
            factors.append(('male_gender', 0.15))
        
        # Family history
        if self._has_family_history(data, ['sleep apnea', 'sleep disorder']):
            score += 0.20
            factors.append(('family_history', 0.20))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.10
            factors.append(('smoking', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_pneumonia(self, data):
        """Pneumonia risk scoring"""
        score = 0.0
        factors = []
        
        # Age: elderly or very young at higher risk
        age = float(data.get('age', 0))
        if age > 65 or age < 5:
            score += 0.20
            factors.append(('extreme_age', 0.20))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.20
            factors.append(('smoking', 0.20))
        
        # Respiratory conditions
        if self._has_current_condition(data, ['asthma', 'copd', 'respiratory']):
            score += 0.25
            factors.append(('respiratory_condition', 0.25))
        
        # Weak immune system (poor sleep, stress)
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.15
            factors.append(('poor_sleep', 0.15))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.10
            factors.append(('high_stress', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_bronchitis(self, data):
        """Bronchitis risk scoring"""
        score = 0.0
        factors = []
        
        # Smoking: primary factor
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.35
            factors.append(('smoking', 0.35))
        
        # Respiratory conditions
        if self._has_current_condition(data, ['asthma', 'copd', 'respiratory']):
            score += 0.20
            factors.append(('respiratory_condition', 0.20))
        
        # Air pollution exposure
        pollution = data.get('pollutionExposure', 'low').lower()
        if 'high' in pollution:
            score += 0.20
            factors.append(('high_pollution', 0.20))
        
        # Age: older age higher risk
        age = float(data.get('age', 0))
        if age > 50:
            score += 0.10
            factors.append(('age_50plus', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_tuberculosis(self, data):
        """Tuberculosis risk scoring"""
        score = 0.0
        factors = []
        
        # Close contact/travel history (not explicitly tracked, so lower base)
        score += 0.05
        factors.append(('base_risk', 0.05))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.15
            factors.append(('smoking', 0.15))
        
        # Weak immune (poor sleep, high stress, poor nutrition)
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.15
            factors.append(('poor_sleep', 0.15))
        
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.10
            factors.append(('high_stress', 0.10))
        
        # Low BMI (malnutrition)
        bmi = float(data.get('bmi', 22))
        if bmi < 18.5:
            score += 0.15
            factors.append(('low_bmi', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_kidney_stones(self, data):
        """Kidney Stones risk scoring"""
        score = 0.0
        factors = []
        
        # Low water intake: primary factor
        water = float(data.get('dailyWaterIntake_L', 2.0))
        if water < 1.5:
            score += 0.40
            factors.append(('low_water_intake', 0.40))
        elif water < 2.0:
            score += 0.20
            factors.append(('moderate_water_intake', 0.20))
        
        # Family history
        if self._has_family_history(data, ['kidney stones', 'calculi']):
            score += 0.25
            factors.append(('family_history', 0.25))
        
        # Chronic kidney disease
        if self._has_current_condition(data, ['kidney disease', 'ckd']):
            score += 0.20
            factors.append(('kidney_disease', 0.20))
        
        # High protein diet
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'meat' in diet or 'protein' in diet:
            score += 0.15
            factors.append(('high_protein_diet', 0.15))
        
        # Age: 40-60 higher risk
        age = float(data.get('age', 0))
        if 40 <= age <= 60:
            score += 0.10
            factors.append(('age_range', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_prostate_issues(self, data):
        """Prostate Issues risk scoring"""
        score = 0.0
        factors = []
        
        # Gender: only affects men
        if data.get('gender') != 'male':
            return 0.0, []
        
        # Age: increases significantly after 50
        age = float(data.get('age', 0))
        if age > 70:
            score += 0.35
            factors.append(('age_70plus', 0.35))
        elif age > 50:
            score += 0.20
            factors.append(('age_50plus', 0.20))
        
        # Family history
        if self._has_family_history(data, ['prostate', 'prostate cancer']):
            score += 0.30
            factors.append(('family_history', 0.30))
        
        # High BMI
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.15
            factors.append(('high_bmi', 0.15))
        
        # Sedentary lifestyle
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.10
            factors.append(('sedentary', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_breast_cancer(self, data):
        """Breast Cancer risk scoring"""
        score = 0.0
        factors = []
        
        # Gender: primarily affects women
        if data.get('gender') != 'female':
            score += 0.05  # Still some risk for men
        else:
            score += 0.10  # Base risk for women
        
        # Age: increases after 50
        age = float(data.get('age', 0))
        if age > 70:
            score += 0.20
            factors.append(('age_70plus', 0.20))
        elif age > 50:
            score += 0.15
            factors.append(('age_50plus', 0.15))
        
        # Family history: strong predictor
        if self._has_family_history(data, ['breast cancer', 'cancer']):
            score += 0.35
            factors.append(('family_history', 0.35))
        
        # Obesity
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.15
            factors.append(('obesity', 0.15))
        
        # Alcohol consumption
        if self._has_addiction(data, 'alcohol'):
            score += 0.10
            factors.append(('alcohol_consumption', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_colorectal_cancer(self, data):
        """Colorectal Cancer risk scoring"""
        score = 0.0
        factors = []
        
        # Age: increases after 50
        age = float(data.get('age', 0))
        if age > 50:
            score += 0.20
            factors.append(('age_50plus', 0.20))
        
        # Family history
        if self._has_family_history(data, ['colorectal cancer', 'colon cancer']):
            score += 0.30
            factors.append(('family_history', 0.30))
        
        # Poor diet (low fiber)
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'fast_food' in diet or 'meat-heavy' in diet:
            score += 0.20
            factors.append(('poor_diet', 0.20))
        
        # Obesity
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.15
            factors.append(('obesity', 0.15))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.10
            factors.append(('smoking', 0.10))
        
        # Sedentary lifestyle
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.10
            factors.append(('sedentary', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_rheumatoid_arthritis(self, data):
        """Rheumatoid Arthritis risk scoring"""
        score = 0.0
        factors = []
        
        # Gender: more common in women
        if data.get('gender') == 'female':
            score += 0.20
            factors.append(('female_gender', 0.20))
        
        # Age: typically 40-60
        age = float(data.get('age', 0))
        if 40 <= age <= 60:
            score += 0.15
            factors.append(('age_range', 0.15))
        
        # Family history
        if self._has_family_history(data, ['rheumatoid arthritis', 'ra']):
            score += 0.30
            factors.append(('family_history', 0.30))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.15
            factors.append(('smoking', 0.15))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.15
            factors.append(('high_stress', 0.15))
        
        # Autoimmune conditions
        if self._has_current_condition(data, ['autoimmune']):
            score += 0.20
            factors.append(('autoimmune_condition', 0.20))
        
        return min(score, 1.0), factors
    
    def _score_lupus(self, data):
        """Lupus (SLE) risk scoring"""
        score = 0.0
        factors = []
        
        # Gender: predominantly affects women
        if data.get('gender') == 'female':
            score += 0.30
            factors.append(('female_gender', 0.30))
        
        # Age: typically 15-45
        age = float(data.get('age', 0))
        if 15 <= age <= 45:
            score += 0.20
            factors.append(('age_range', 0.20))
        
        # Family history
        if self._has_family_history(data, ['lupus', 'autoimmune']):
            score += 0.35
            factors.append(('family_history', 0.35))
        
        # Autoimmune conditions
        if self._has_current_condition(data, ['autoimmune']):
            score += 0.15
            factors.append(('autoimmune_condition', 0.15))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.15
            factors.append(('high_stress', 0.15))
        
        # Poor sleep
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.10
            factors.append(('poor_sleep', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_ibs(self, data):
        """IBS (Irritable Bowel Syndrome) risk scoring"""
        score = 0.0
        factors = []
        
        # Gender: more common in women
        if data.get('gender') == 'female':
            score += 0.15
            factors.append(('female_gender', 0.15))
        
        # Age: typically 20-50
        age = float(data.get('age', 0))
        if 20 <= age <= 50:
            score += 0.10
            factors.append(('age_range', 0.10))
        
        # High stress: major trigger
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.30
            factors.append(('high_stress', 0.30))
        
        # Poor diet
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'fast_food' in diet or 'junk' in diet:
            score += 0.20
            factors.append(('poor_diet', 0.20))
        
        # Low physical activity
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.15
            factors.append(('sedentary', 0.15))
        
        # Poor sleep
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.15
            factors.append(('poor_sleep', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_crohns_disease(self, data):
        """Crohn's Disease risk scoring"""
        score = 0.0
        factors = []
        
        # Age: typically 15-35 and 50-70
        age = float(data.get('age', 0))
        if 15 <= age <= 35 or 50 <= age <= 70:
            score += 0.15
            factors.append(('susceptible_age', 0.15))
        
        # Family history
        if self._has_family_history(data, ['crohns', 'inflammatory bowel']):
            score += 0.35
            factors.append(('family_history', 0.35))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.20
            factors.append(('smoking', 0.20))
        
        # Stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.15
            factors.append(('high_stress', 0.15))
        
        # Poor diet
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'fast_food' in diet or 'junk' in diet:
            score += 0.15
            factors.append(('poor_diet', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_hepatitis(self, data):
        """Hepatitis risk scoring"""
        score = 0.0
        factors = []
        
        # Alcohol consumption: risk for hepatitis
        if self._has_addiction(data, 'alcohol'):
            score += 0.30
            factors.append(('alcohol_consumption', 0.30))
        
        # Travel history (approximated by current conditions)
        if self._has_current_condition(data, ['liver disease']):
            score += 0.20
            factors.append(('liver_condition', 0.20))
        
        # Family history
        if self._has_family_history(data, ['hepatitis', 'liver disease']):
            score += 0.25
            factors.append(('family_history', 0.25))
        
        # Age: some types more common in older adults
        age = float(data.get('age', 0))
        if age > 50:
            score += 0.10
            factors.append(('age_50plus', 0.10))
        
        # Poor hygiene/sanitation risk (approximated)
        score += 0.05
        factors.append(('base_risk', 0.05))
        
        return min(score, 1.0), factors
    
    def _score_glaucoma(self, data):
        """Glaucoma risk scoring"""
        score = 0.0
        factors = []
        
        # Age: increases after 60
        age = float(data.get('age', 0))
        if age > 60:
            score += 0.20
            factors.append(('age_60plus', 0.20))
        elif age > 40:
            score += 0.10
            factors.append(('age_40plus', 0.10))
        
        # Family history: strong predictor
        if self._has_family_history(data, ['glaucoma', 'eye disease']):
            score += 0.35
            factors.append(('family_history', 0.35))
        
        # High blood pressure
        if self._has_current_condition(data, ['hypertension', 'high blood pressure']):
            score += 0.15
            factors.append(('hypertension', 0.15))
        
        # Diabetes
        if self._has_current_condition(data, ['diabetes']):
            score += 0.15
            factors.append(('diabetes', 0.15))
        
        # Race: African Americans at higher risk
        score += 0.05
        factors.append(('base_risk', 0.05))
        
        return min(score, 1.0), factors
    
    def _score_cataracts(self, data):
        """Cataracts risk scoring"""
        score = 0.0
        factors = []
        
        # Age: primary risk factor
        age = float(data.get('age', 0))
        if age > 70:
            score += 0.30
            factors.append(('age_70plus', 0.30))
        elif age > 60:
            score += 0.20
            factors.append(('age_60plus', 0.20))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.20
            factors.append(('smoking', 0.20))
        
        # Diabetes
        if self._has_current_condition(data, ['diabetes']):
            score += 0.20
            factors.append(('diabetes', 0.20))
        
        # Family history
        if self._has_family_history(data, ['cataracts', 'eye disease']):
            score += 0.15
            factors.append(('family_history', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_metabolic_syndrome(self, data):
        """Metabolic Syndrome risk scoring"""
        score = 0.0
        factors = []
        
        # High BMI: key component
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.25
            factors.append(('obesity', 0.25))
        elif bmi > 25:
            score += 0.12
            factors.append(('overweight', 0.12))
        
        # Sedentary lifestyle
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.20
            factors.append(('sedentary', 0.20))
        
        # Poor diet
        diet = data.get('dietaryPreference', 'mixed').lower()
        if 'fast_food' in diet or 'junk' in diet:
            score += 0.15
            factors.append(('poor_diet', 0.15))
        
        # Family history
        if self._has_family_history(data, ['metabolic syndrome', 'diabetes']):
            score += 0.20
            factors.append(('family_history', 0.20))
        
        # High stress
        if data.get('stressLevel') in ['high', 'extreme']:
            score += 0.10
            factors.append(('high_stress', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_pcos(self, data):
        """PCOS (Polycystic Ovary Syndrome) risk scoring"""
        score = 0.0
        factors = []
        
        # Gender: only affects women
        if data.get('gender') != 'female':
            return 0.0, []
        
        # Age: typically reproductive years
        age = float(data.get('age', 0))
        if 20 <= age <= 40:
            score += 0.15
            factors.append(('age_range', 0.15))
        
        # Family history: strong predictor
        if self._has_family_history(data, ['pcos', 'polycystic ovary']):
            score += 0.35
            factors.append(('family_history', 0.35))
        
        # Obesity
        bmi = float(data.get('bmi', 22))
        if bmi > 30:
            score += 0.25
            factors.append(('obesity', 0.25))
        elif bmi > 25:
            score += 0.15
            factors.append(('overweight', 0.15))
        
        # Insulin resistance indicator (high BMI, diabetes)
        if self._has_current_condition(data, ['diabetes', 'insulin resistance']):
            score += 0.20
            factors.append(('insulin_resistance', 0.20))
        
        return min(score, 1.0), factors
    
    def _score_multiple_sclerosis(self, data):
        """Multiple Sclerosis risk scoring"""
        score = 0.0
        factors = []
        
        # Age: typically 20-40
        age = float(data.get('age', 0))
        if 20 <= age <= 40:
            score += 0.15
            factors.append(('susceptible_age', 0.15))
        elif age < 20 or age > 50:
            score += 0.05
            factors.append(('age_factor', 0.05))
        
        # Gender: more common in women
        if data.get('gender') == 'female':
            score += 0.15
            factors.append(('female_gender', 0.15))
        
        # Family history
        if self._has_family_history(data, ['multiple sclerosis', 'autoimmune']):
            score += 0.35
            factors.append(('family_history', 0.35))
        
        # Viral infections (approximated by health conditions)
        if self._has_current_condition(data, ['viral infection', 'autoimmune']):
            score += 0.15
            factors.append(('infection_autoimmune', 0.15))
        
        # Low vitamin D (approximated by sedentary lifestyle and low sun exposure)
        activity = data.get('activityLevel', 'moderate').lower()
        if 'sedentary' in activity:
            score += 0.10
            factors.append(('sedentary', 0.10))
        
        # Smoking
        if self._has_addiction(data, ['smoking', 'cigarettes']):
            score += 0.10
            factors.append(('smoking', 0.10))
        
        return min(score, 1.0), factors
    
    def _score_epilepsy(self, data):
        """Epilepsy risk scoring"""
        score = 0.0
        factors = []
        
        # Age: peaks in childhood and elderly
        age = float(data.get('age', 0))
        if age < 5 or age > 65:
            score += 0.15
            factors.append(('extreme_age', 0.15))
        
        # Family history
        if self._has_family_history(data, ['epilepsy', 'seizure']):
            score += 0.30
            factors.append(('family_history', 0.30))
        
        # Neurological conditions
        if self._has_current_condition(data, ['neurological', 'seizure', 'head injury']):
            score += 0.25
            factors.append(('neurological_condition', 0.25))
        
        # Brain injury history (approximated)
        score += 0.05
        factors.append(('base_risk', 0.05))
        
        # Sleep deprivation (can trigger seizures)
        sleep = float(data.get('sleepHours', 7))
        if sleep < 6:
            score += 0.15
            factors.append(('poor_sleep', 0.15))
        
        return min(score, 1.0), factors
    
    def _score_peripheral_neuropathy(self, data):
        """Peripheral Neuropathy risk scoring"""
        score = 0.0
        factors = []
        
        # Age: increases with age
        age = float(data.get('age', 0))
        if age > 60:
            score += 0.15
            factors.append(('age_60plus', 0.15))
        elif age > 40:
            score += 0.08
            factors.append(('age_40plus', 0.08))
        
        # Diabetes: major cause
        if self._has_current_condition(data, ['diabetes']):
            score += 0.35
            factors.append(('diabetes', 0.35))
        
        # Chronic kidney disease
        if self._has_current_condition(data, ['kidney disease', 'ckd']):
            score += 0.20
            factors.append(('kidney_disease', 0.20))
        
        # Infections (history)
        if self._has_current_condition(data, ['infection', 'hiv']):
            score += 0.20
            factors.append(('infection', 0.20))
        
        # Occupational exposure
        occupation = data.get('occupationType', '').lower()
        if any(x in occupation for x in ['chemical', 'pesticide', 'industrial']):
            score += 0.15
            factors.append(('occupational_exposure', 0.15))
        
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
