#!/usr/bin/env python
"""
Standalone test of the ML prediction pipeline
Demonstrates that PyTorch model loading and feature extraction are working
"""
import os
import sys
import json

# Add the utils directory to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
UTILS_DIR = os.path.join(CURRENT_DIR, 'utils')
sys.path.insert(0, UTILS_DIR)
sys.path.insert(0, CURRENT_DIR)

from utils.inference import load_checkpoint, predict_from_array
from utils.run_batch_predictions import process_input

def test_prediction():
    print("=" * 60)
    print("ML PREDICTION PIPELINE TEST")
    print("=" * 60)
    
    # Step 1: Load Model
    print("\n[1] Loading PyTorch model...")
    if not load_checkpoint():
        print("❌ Failed to load model")
        return False
    print("✓ Model loaded successfully")
    
    # Step 2: Prepare sample user data (mimicking MongoDB user object)
    print("\n[2] Preparing sample user data...")
    sample_user = {
        "age": 45,
        "gender": "male",
        "height_cm": 180,
        "weight_kg": 75,
        "bmi": 23.1,
        "waistCircumference_cm": 85,
        "activityLevel": "moderately_active",
        "sleepHours": 7,
        "dietaryPreference": "mixed",
        "allergies": "none",
        "dailyWaterIntake_L": 2.5,
        "mealFrequency": 3,
        "currentCondition": "none",
        "familyHistory": ["hypertension"],
        "bloodType": "O+",
        "pollutionExposure": "low",
        "occupationType": "office",
        "addiction": "none",
        "stressLevel": "moderate"
    }
    print(f"✓ Sample user data prepared: age={sample_user['age']}, gender={sample_user['gender']}")
    
    # Step 3: Feature Extraction
    print("\n[3] Extracting and preprocessing features...")
    try:
        features = process_input(sample_user)
        print(f"✓ Features extracted: {len(features)}-element vector")
        print(f"  First 10 features: {features[:10]}")
    except Exception as e:
        print(f"❌ Feature extraction failed: {e}")
        return False
    
    # Step 4: Run Inference
    print("\n[4] Running PyTorch model inference...")
    try:
        predictions = predict_from_array(features)
        print(f"✓ Predictions generated: {len(predictions)} disease probabilities")
        print(f"  Raw predictions: {predictions}")
    except Exception as e:
        print(f"❌ Inference failed: {e}")
        return False
    
    # Step 5: Map to Disease Labels
    print("\n[5] Mapping predictions to disease labels...")
    DISEASES = [
        "Diabetes",
        "Hypertension",
        "Ischemic Heart Disease",
        "Stroke",
        "Chronic Kidney Disease",
        "Lung Cancer",
        "Asthma",
        "Arthritis",
        "COPD",
        "Anemia"
    ]
    
    disease_probs = []
    for i, prob in enumerate(predictions):
        percentage = prob * 100
        # Filter out very low probabilities (< 1%)
        if percentage >= 1:
            disease_probs.append({
                "disease": DISEASES[i],
                "probability": prob,
                "percentage": percentage
            })
    
    # Sort by probability descending
    disease_probs.sort(key=lambda x: x['probability'], reverse=True)
    
    print("✓ Disease predictions (risk descending):")
    for item in disease_probs:
        print(f"  - {item['disease']}: {item['percentage']:.2f}%")
    
    print("\n" + "=" * 60)
    print("✓ ML PIPELINE TEST SUCCESSFUL")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_prediction()
    sys.exit(0 if success else 1)
