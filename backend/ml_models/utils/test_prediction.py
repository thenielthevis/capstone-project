import sys
import os

# Add the utils directory to Python path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'utils'))

from inference import load_checkpoint, predict_from_array

def test_prediction():
    # Load the model
    ok = load_checkpoint()
    if not ok:
        print('Model failed to load. Aborting.')
        return
    
    # Test case for a healthy individual
    test_data = [0.0] * 57  # Initialize with zeros
    
    # Fill in the basic features we know
    test_data[0] = 28.0  # age
    test_data[1] = 1.0   # gender (male)
    test_data[2] = 175.0 # height_cm
    test_data[3] = 70.0  # weight_kg
    test_data[4] = 22.9  # bmi (normal range)
    test_data[5] = 80.0  # waistCircumference_cm
    test_data[6] = 0.8   # activityLevel (very active)
    
    try:
        predictions = predict_from_array(test_data)
        print("\nPrediction Results:")
        if isinstance(predictions, dict):
            for disease, prob in sorted(predictions.items(), key=lambda x: x[1], reverse=True):
                print(f"{disease}: {prob*100:.1f}%")
        else:
            # Define disease names based on dataset
            diseases = ["Diabetes", "Hypertension", "Heart Disease", "Stroke", "Kidney Disease", 
                      "Lung Cancer", "Asthma", "Arthritis", "COPD", "Anemia"]
            
            # Convert raw scores to percentages
            scores = [(disease, score * 100) for disease, score in zip(diseases, predictions)]
            
            # Sort by probability and print
            scores.sort(key=lambda x: x[1], reverse=True)
            for disease, prob in scores:
                print(f"{disease}: {prob:.1f}%")
    except Exception as e:
        print("Error during prediction:", str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_prediction()