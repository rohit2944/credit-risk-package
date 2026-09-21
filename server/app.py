"""
app.py - Updated Credit Risk API with Multi-tier Risk & Robust Validation.
Includes 'age' and handles Low, Medium, High risk categories.
"""

import os
import numpy as np
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# -- App setup -----------------------------------------------------------------
app = Flask(__name__)
CORS(app)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')
DATA_PATH  = os.path.join(BASE_DIR, 'data', 'dataset.csv')

def load_model():
    """Load model.pkl and scaler."""
    if os.path.exists(MODEL_PATH):
        saved  = joblib.load(MODEL_PATH)
        print("[SUCCESS] model.pkl loaded successfully")
        return saved['model'], saved['scaler']
    else:
        raise FileNotFoundError("Model file not found. Run train_model.py first.")

# Load model and scaler at startup
model, scaler = load_model()

def get_median_risk():
    """Calculate the median risk probability from the population dataset."""
    try:
        if os.path.exists(DATA_PATH):
            df = pd.read_csv(DATA_PATH)
            X = df[['age', 'income', 'loan', 'credit_score']].values
            X_scaled = scaler.transform(X)
            probs = model.predict_proba(X_scaled)[:, 1]
            return round(float(np.median(probs)), 4)
    except Exception as e:
        print(f"[!] Error calculating median risk: {e}")
    return 0.35 # Fallback baseline

# Baseline risk for the population
MEDIAN_POPULATION_RISK = get_median_risk()

def get_rejection_reason(age, income, loan, credit_score, prob_default):
    """Determine the primary reason for high/medium risk predictions."""
    # Critical Safety Override Reason
    if loan > income:
        return "CRITICAL RISK: Requested loan amount exceeds your total annual income. This profile is not eligible for automatic approval."
    
    if prob_default < 0.35:
        return "Your profile meets all standard credit requirements."
    
    reasons = []
    # Heuristic rules that likely align with patterns in the RandomForest
    if credit_score < 620:
        reasons.append("Credit score is below the recommended threshold (620).")
    
    dti = loan / income if income > 0 else 1.0
    if dti > 0.50:
        reasons.append(f"High Debt-to-Income ratio ({round(dti*100)}%). Typical limit is 50%.")
    elif dti > 0.40:
        reasons.append(f"Elevated Debt-to-Income ratio ({round(dti*100)}%). Typical target is below 40%.")
    
    if income < 20000:
        reasons.append("Annual income is below our minimum sustainability threshold.")
        
    if age < 23 and loan > 50000:
        reasons.append("High loan-to-age risk: Limited financial history for requested amount.")

    if not reasons:
        if prob_default >= 0.65:
            return "Multiple complex risk factors identified by the AI model based on historical default patterns."
        return "Borderline financial metrics detected; application requires manual secondary review."
        
    return " ".join(reasons)

# -- Validation Helper ----------------------------------------------------------
def validate_inputs(data):
    """Validate all numeric inputs for realistic ranges."""
    errors = []
    
    # Check for missing keys
    required = ['age', 'income', 'loan', 'credit_score']
    for req in required:
        if req not in data or data[req] is None:
            errors.append(f"Missing required field: {req}")
    
    if errors: return errors

    try:
        age          = float(data['age'])
        income       = float(data['income'])
        loan         = float(data['loan'])
        credit_score = float(data['credit_score'])

        # Range checks
        if not (18 <= age <= 100):
            errors.append("Age must be between 18 and 100.")
        if not (1000 <= income <= 10000000):
            errors.append("Income must be between 1,000 and 10,000,000.")
        if not (1000 <= loan <= 10000000):
            errors.append("Loan amount must be between 1,000 and 10,000,000.")
        if not (300 <= credit_score <= 900):
            errors.append("Credit score must be between 300 and 900.")

    except (ValueError, TypeError):
        errors.append("All inputs must be valid numeric values.")

    return errors

# -- Routes ---------------------------------------------------------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Credit Risk API is running [OK]'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON body provided'}), 400

        # Validate
        val_errors = validate_inputs(data)
        if val_errors:
            return jsonify({'error': 'Validation Failed', 'details': val_errors}), 422

        # Extract values
        age          = float(data['age'])
        income       = float(data['income'])
        loan         = float(data['loan'])
        credit_score = float(data['credit_score'])

        # Build feature array and scale
        features        = np.array([[age, income, loan, credit_score]])
        features_scaled = scaler.transform(features)

        # Get probability of Default (Class 1)
        # model.predict_proba returns [[prob_0, prob_1]]
        prob_default = model.predict_proba(features_scaled)[0][1]
        
        # -- Financial Safety Guardrails (Overrides ML Optimism) ----------------
        # Force High Risk if loan exceeds annual income
        if loan > income:
            prob_default = max(prob_default, 0.90)
        # Force Medium/High Risk if loan is > 80% of income
        elif loan > 0.8 * income:
            prob_default = max(prob_default, 0.65)
        if prob_default < 0.35:
            prediction = "Low Risk"
            risk_level = 0
            confidence = round((1 - prob_default) * 100, 2)
        elif prob_default < 0.65:
            prediction = "Medium Risk"
            risk_level = 1
            confidence = round((1 - abs(0.5 - prob_default) * 2) * 100, 2) # How "centered" in Medium it is
        else:
            prediction = "High Risk"
            risk_level = 2
            confidence = round(prob_default * 100, 2)

        return jsonify({
            'prediction': prediction,
            'confidence': confidence,
            'probability': round(float(prob_default), 4),
            'median_risk': MEDIAN_POPULATION_RISK,
            'risk_level': risk_level,   # 0=Low, 1=Medium, 2=High
            'reason': get_rejection_reason(age, income, loan, credit_score, prob_default),
            'input': {
                'age': age,
                'income': income,
                'loan': loan,
                'credit_score': credit_score
            }
        })

    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

@app.route('/save_record', methods=['POST'])
def save_record():
    try:
        data = request.json
        # Validate required fields
        required_fields = ['age', 'income', 'loan', 'credit_score', 'default']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Append to CSV using pandas for clean handling
        new_row = {
            'age': [int(data['age'])],
            'income': [float(data['income'])],
            'loan': [float(data['loan'])],
            'credit_score': [int(data['credit_score'])],
            'default': [int(data['default'])]
        }
        
        df = pd.DataFrame(new_row)
        
        # Check if file exists to determine if we should write header
        dataset_path = 'data/dataset.csv'
        write_header = not os.path.exists(dataset_path) or os.path.getsize(dataset_path) == 0
        
        df.to_csv(dataset_path, mode='a', index=False, header=write_header)
        
        return jsonify({'message': 'Record saved to historical dataset successfully'})
    except Exception as e:
        return jsonify({'error': f'Failed to save record: {str(e)}'}), 500

if __name__ == '__main__':
    print("\n[START] Credit Risk API starting on http://127.0.0.1:5001\n")
    app.run(debug=True, port=5001)
