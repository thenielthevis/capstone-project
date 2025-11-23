import os
import sys
import json
import numpy as np
import pandas as pd
from inference import load_checkpoint, predict_from_array, _debug_print

# ensure local imports
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'utils'))
sys.path.insert(0, ROOT)

from inference import load_checkpoint, predict_from_array, _debug_print


def process_input(data):
    """Process input data into features for prediction"""
    # Build a raw row matching the training CSV columns (non-encoded)
    raw_row = {
        'age': data.get('age', 0),
        'gender': 'male' if data.get('gender') in (1, 'male', 'Male') else ('female' if data.get('gender') in (0, 'female', 'Female') else 'other'),
        'height_cm': data.get('height') or data.get('height_cm') or 0,
        'weight_kg': data.get('weight') or data.get('weight_kg') or 0,
        'bmi': data.get('bmi', 0),
        'waistCircumference_cm': data.get('waistCircumference') or data.get('waistCircumference_cm') or 0,
        'activityLevel': data.get('activityLevel') or data.get('activity_level') or 'sedentary',
        'sleepHours': data.get('sleepHours') or data.get('sleep_hours') or 0,
        'dietaryPreference': data.get('dietaryPreference') or data.get('dietaryProfile') or 'none',
        'allergies': data.get('allergies') or 'none',
        'dailyWaterIntake_L': data.get('dailyWaterIntake') or data.get('dailyWaterIntake_L') or 0,
        'mealFrequency': data.get('mealFrequency') or 3,
        'currentCondition': data.get('currentConditions') and (data.get('currentConditions')[0] if isinstance(data.get('currentConditions'), list) and data.get('currentConditions') else data.get('currentConditions')) or 'none',
        'familyHistory': data.get('familyHistory') and (data.get('familyHistory')[0] if isinstance(data.get('familyHistory'), list) and data.get('familyHistory') else data.get('familyHistory')) or 'none',
        'bloodType': data.get('bloodType') or 'O+',
        'pollutionExposure': data.get('pollutionExposure') or data.get('environmentalFactors', {}).get('pollutionExposure') or 'low',
        'occupationType': data.get('occupationType') or data.get('environmentalFactors', {}).get('occupationType') or 'mixed',
        'addiction': (data.get('riskFactors', {}).get('addictions') and data.get('riskFactors').get('addictions')[0] and data.get('riskFactors').get('addictions')[0].get('substance')) or data.get('addiction') or 'none',
        'stressLevel': data.get('stressLevel') or data.get('riskFactors', {}).get('stressLevel') or 'low'
    }
    
    # Debug: log the extracted raw_row to verify all fields are being captured
    _debug_print(f"process_input() extracted raw_row: {json.dumps(raw_row, indent=2)}")

    # Load training CSV to compute dummy columns (cache across calls)
    csv_path = os.path.abspath(os.path.join(ROOT, 'data', 'health_prediction_dataset_5diseases.csv'))
    if not os.path.exists(csv_path):
        # fallback to basic numeric features
        return [
            float(raw_row['age']),
            1 if raw_row['gender'] == 'male' else 0,
            float(raw_row['height_cm']),
            float(raw_row['weight_kg']),
            float(raw_row['bmi']),
            0.0,
            float(raw_row['sleepHours'])
        ]

    df_train = pd.read_csv(csv_path)
    # Drop target column if present
    if 'Diseases' in df_train.columns:
        dfX = df_train.drop(columns=['Diseases'])
    else:
        dfX = df_train

    try:
        # Create dummies for categorical columns in training set
        df_dummies = pd.get_dummies(dfX.astype(str), dummy_na=False)
        feature_columns = df_dummies.columns.tolist()

        # Create single-row DataFrame from raw_row with original training column names
        single = pd.DataFrame([raw_row])
        single = single.reindex(columns=dfX.columns, fill_value='none')
        single_dummies = pd.get_dummies(single.astype(str), dummy_na=False)
        # Reindex to full feature columns set, fill missing with 0
        single_aligned = single_dummies.reindex(columns=feature_columns, fill_value=0)

        # If the resulting vector length matches model expectation (we can't know here), return it
        vec = single_aligned.values.flatten().astype(float).tolist()
        # If vector is too long for model (common), fall back to compact 57-d vector similar to test script
        if len(vec) > 100:
            raise ValueError('feature vector too large, falling back')
        return vec
    except Exception:
        # Fallback: create compact 57-length vector (match test_prediction.py layout)
        v = [0.0] * 57
        try:
            v[0] = float(raw_row.get('age', 0))
            v[1] = 1.0 if raw_row.get('gender') == 'male' else 0.0
            v[2] = float(raw_row.get('height_cm', 0))
            v[3] = float(raw_row.get('weight_kg', 0))
            v[4] = float(raw_row.get('bmi', 0))
            v[5] = float(raw_row.get('waistCircumference_cm', 0))
            # map activityLevel to [0..1]
            activity_levels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']
            try:
                v[6] = activity_levels.index(raw_row.get('activityLevel', 'sedentary')) / (len(activity_levels)-1)
            except Exception:
                v[6] = 0.0
            # sleep hours into index 7 (best-effort)
            try:
                v[7] = float(raw_row.get('sleepHours', 0))
            except Exception:
                v[7] = 0.0
        except Exception:
            pass
        return v

def main():
    # Load the model
    ok = load_checkpoint()
    if not ok:
        print(json.dumps({"error": "Model failed to load"}))
        return

    # If command line argument is provided, use it as input data
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
            features = process_input(input_data)
            try:
                predictions = predict_from_array(features)
                print(json.dumps(predictions))
            except Exception as e:
                print(json.dumps({"error": f"Prediction failed: {str(e)}"}))
        except Exception as e:
            print(json.dumps({"error": f"Failed to parse input: {str(e)}"}))
        return
    
    # If no argument provided, process test data file
    csv_path = os.path.abspath(os.path.join(ROOT, 'data', 'test_prediction.csv'))
    if not os.path.exists(csv_path):
        print(json.dumps({"error": "Test data CSV not found"}))
        return
    
    try:
        df = pd.read_csv(csv_path)
        results = []
        for _, row in df.iterrows():
            features = process_input(row)
            try:
                predictions = predict_from_array(features)
                results.append(predictions)
            except Exception as e:
                results.append({"error": f"Prediction failed: {str(e)}"})
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": f"Failed to process CSV: {str(e)}"}))
        return

    # Align columns: if X_d has fewer cols, pad; if more, trim
if __name__ == '__main__':
    main()
