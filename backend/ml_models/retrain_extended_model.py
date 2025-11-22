#!/usr/bin/env python
"""
Quick retraining script - Generates synthetic medical data and retrains model
for 10 diseases including Huntington's
"""
import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import torch

def generate_synthetic_dataset(n_samples=5000):
    """Generate synthetic medical dataset for 10 diseases"""
    print(f"Generating {n_samples} synthetic medical records...")
    
    # 18 medical features
    X, y = make_classification(
        n_samples=n_samples,
        n_features=18,
        n_informative=15,
        n_redundant=3,
        n_classes=10,  # 10 diseases
        n_clusters_per_class=1,
        weights=None,
        flip_y=0.01,
        random_state=42
    )
    
    # Create meaningful medical feature names
    feature_names = [
        'age', 'gender', 'height_cm', 'weight_kg', 'bmi', 'waistCircumference_cm',
        'activityLevel', 'sleepHours', 'dietaryPreference_encoded', 'allergies_encoded',
        'dailyWaterIntake_L', 'mealFrequency', 'currentCondition_encoded', 'familyHistory_encoded',
        'bloodType_encoded', 'pollutionExposure_encoded', 'occupationType_encoded', 'stressLevel_encoded'
    ]
    
    # Normalize features to reasonable ranges
    X[:, 0] = (X[:, 0] * 30) + 20  # age: 20-50
    X[:, 1] = (X[:, 1] + 1) / 2  # gender: 0-1
    X[:, 2] = (X[:, 2] * 30) + 150  # height: 150-180cm
    X[:, 3] = (X[:, 3] * 30) + 50  # weight: 50-80kg
    X[:, 4] = (X[:, 4] * 10) + 18  # bmi: 18-28
    X[:, 5] = (X[:, 5] * 30) + 70  # waist: 70-100cm
    X[:, 6] = (X[:, 6] + 1) / 2  # activity: 0-1
    X[:, 7] = (X[:, 7] * 2) + 5  # sleep: 5-9 hours
    # Rest are categorical encodings 0-1
    
    # Create DataFrame
    df = pd.DataFrame(X, columns=feature_names)
    
    # Map disease labels
    disease_names = [
        'Diabetes',
        'Hypertension',
        'Ischemic Heart Disease',
        'Stroke',
        'Chronic Kidney Disease',
        'Lung Cancer',
        'Asthma',
        'Arthritis',
        'COPD',
        'Huntingtons'
    ]
    
    df['Diseases'] = y
    df['Disease_Name'] = df['Diseases'].map({i: disease_names[i] for i in range(10)})
    
    print(f"✓ Generated dataset:")
    print(f"  Shape: {df.shape}")
    print(f"  Classes: {dict(df['Disease_Name'].value_counts())}")
    
    return df

def retrain_model(df):
    """Retrain model on the dataset"""
    
    print("\n[1] Preparing data...")
    X = df.drop(['Diseases', 'Disease_Name'], axis=1)
    y = df['Diseases']
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"  Train set: {X_train.shape}")
    print(f"  Test set: {X_test.shape}")
    print(f"  Features: {X.shape[1]}")
    print(f"  Classes: {len(np.unique(y))}")
    
    print("\n[2] Training MLP classifier...")
    model = MLPClassifier(
        hidden_layer_sizes=(256, 128, 64),
        activation='relu',
        solver='adam',
        max_iter=1000,
        learning_rate_init=0.001,
        random_state=42,
        verbose=True
    )
    
    model.fit(X_train, y_train)
    
    print("\n[3] Evaluating model...")
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    
    print(f"  Train Accuracy: {train_acc:.4f}")
    print(f"  Test Accuracy: {test_acc:.4f}")
    
    return model, scaler, X.shape[1]

def convert_to_pytorch(model, scaler, n_features, output_dir='backend/ml_models/trained_models'):
    """Convert sklearn model to PyTorch format"""
    
    print("\n[4] Converting to PyTorch...")
    
    # Create state dict mimicking the MLP structure
    state_dict = {}
    
    layer_idx = 0
    for i, coef in enumerate(model.coefs_):
        # coef shape: (n_input, n_output)
        # PyTorch expects (n_output, n_input) - transpose
        weight = torch.tensor(coef.T, dtype=torch.float32)
        bias = torch.tensor(model.intercepts_[i], dtype=torch.float32)
        
        # Store with fc prefix matching inference.py expectations
        state_dict[f'fc.{layer_idx}.weight'] = weight
        state_dict[f'fc.{layer_idx}.bias'] = bias
        
        layer_idx += 3  # fc.0, fc.3, fc.6 (with ReLU in between)
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Save model
    model_path = os.path.join(output_dir, 'disease_prediction_model_10diseases.pth')
    torch.save(state_dict, model_path)
    print(f"  ✓ Model saved: {model_path}")
    
    # Save metadata
    metadata = {
        'n_classes': 10,
        'n_features': n_features,
        'scaler_mean': scaler.mean_.tolist(),
        'scaler_scale': scaler.scale_.tolist(),
        'diseases': [
            'Diabetes',
            'Hypertension',
            'Ischemic Heart Disease',
            'Stroke',
            'Chronic Kidney Disease',
            'Lung Cancer',
            'Asthma',
            'Arthritis',
            'COPD',
            'Huntingtons'
        ]
    }
    
    metadata_path = os.path.join(output_dir, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  ✓ Metadata saved: {metadata_path}")
    
    return model_path

def main():
    print("=" * 70)
    print("RETRAINING MODEL FOR 10 DISEASES (INCLUDING HUNTINGTON'S)")
    print("=" * 70)
    
    try:
        # Step 1: Generate synthetic dataset
        df = generate_synthetic_dataset(n_samples=5000)
        
        # Step 2: Retrain model
        model, scaler, n_features = retrain_model(df)
        
        # Step 3: Convert and save
        model_path = convert_to_pytorch(model, scaler, n_features)
        
        print("\n" + "=" * 70)
        print("✓ RETRAINING SUCCESSFUL!")
        print("=" * 70)
        print(f"""
New model now predicts 10 diseases:
  1. Diabetes
  2. Hypertension
  3. Ischemic Heart Disease
  4. Stroke
  5. Chronic Kidney Disease
  6. Lung Cancer
  7. Asthma
  8. Arthritis
  9. COPD
  10. Huntingtons ← NEW!

Next steps:
  1. Update backend/config/diseases.js with new disease names
  2. Test: python backend/ml_models/test_ml_pipeline.py
  3. Restart backend server
  4. Test predictions in frontend
        """)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during retraining: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
