"""
train_model.py — Updated script to train a RandomForest model for Credit Risk.
Includes 'age' and 3-tier risk evaluation logic.
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'dataset.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')

def train_and_save():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    
    # Verify columns
    expected_cols = ['age', 'income', 'loan', 'credit_score', 'default']
    if not all(col in df.columns for col in expected_cols):
        print(f"Error: Dataset missing columns. Found: {list(df.columns)}")
        return

    print(f"  Rows: {len(df)}, Columns: {list(df.columns)}")

    # Features: Age, Income, Loan, Credit Score
    X = df[['age', 'income', 'loan', 'credit_score']].values
    y = df['default'].values

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # Train model (RandomForest for better non-linear patterns)
    print("Training RandomForestClassifier model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {acc * 100:.1f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk', 'High Risk']))

    # Save model + scaler together
    joblib.dump({'model': model, 'scaler': scaler}, MODEL_PATH)
    print(f"\n[✓] Model and Scaler saved to: {MODEL_PATH}")

if __name__ == '__main__':
    train_and_save()
