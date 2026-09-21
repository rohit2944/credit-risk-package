# 📊 Credit Risk Assessment & Prediction Application

A full-stack credit risk scoring and machine learning application. This platform evaluates applicant credit risk (Low, Medium, High), provides confidence scores, calculates population median baseline metrics, offers safety guardrail overrides, and delivers detailed risk explanations for decision support.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Python, Flask, Flask-CORS
- **Machine Learning**: Scikit-Learn (RandomForest Classifier), Joblib, NumPy, Pandas
- **Frontend**: React 19, Recharts, CSS3
- **Data Persistence**: CSV Dataset storage (`server/data/dataset.csv`)

---

## ✨ Features

- **Multi-tier Risk Assessment**: Categorizes applicants into **Low Risk**, **Medium Risk**, and **High Risk** profiles.
- **Financial Guardrail Overrides**: Built-in safety rules (e.g., loan exceeding annual income automatically flags critical risk regardless of model optimism).
- **Explainable AI Feedback**: Provides detailed reasons for rejection or medium-risk flag (e.g., High Debt-to-Income ratio, low credit score).
- **Interactive UI**: Real-time risk scoring, probability visualizations, and historical dataset logging via React dashboard.
- **RESTful API**: Standardized JSON request & response schemas with server-side field validation.

---

## 📁 Repository Structure

```
credit-risk-package/
├── client/                  # React Frontend Application
│   ├── public/              # Static public assets
│   ├── src/                 # React components & dashboard logic
│   │   ├── App.js           # Main UI & form handler
│   │   ├── App.css          # UI Styling
│   │   └── index.js         # Entry point
│   └── package.json         # React dependencies & scripts
│
├── server/                  # Flask Machine Learning Backend
│   ├── app.py               # Flask REST API endpoints & safety rules
│   ├── train_model.py       # ML Model training script
│   ├── model.pkl            # Serialized RandomForest model & scaler
│   ├── data/
│   │   └── dataset.csv      # Population dataset
│   └── requirements.txt     # Python dependencies
│
├── credit_risk/             # Core Python package utilities
│   └── model.py             # Model utility definitions
├── .gitignore               # Root git ignore rules
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.8+
- **Node.js**: 16+ & `npm`

---

### 1. Backend Setup (Flask Server)

Navigate to the `server` directory and set up a virtual environment:

```bash
cd server

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Running the Server
```bash
python app.py
```
The Flask API will start on `http://127.0.0.1:5001`.

---

### 2. Frontend Setup (React Client)

Navigate to the `client` directory and install dependencies:

```bash
cd client

# Install dependencies
npm install

# Start development server
npm start
```
The React application will launch at `http://localhost:3000`.

---

## 🔌 API Endpoints

### 1. `GET /health`
Verifies backend status.

**Response:**
```json
{
  "status": "ok",
  "message": "Credit Risk API is running [OK]"
}
```

### 2. `POST /predict`
Calculates default risk probability and risk tier for an applicant.

**Request Body:**
```json
{
  "age": 30,
  "income": 75000,
  "loan": 15000,
  "credit_score": 720
}
```

**Response:**
```json
{
  "prediction": "Low Risk",
  "confidence": 92.4,
  "probability": 0.076,
  "median_risk": 0.35,
  "risk_level": 0,
  "reason": "Your profile meets all standard credit requirements.",
  "input": {
    "age": 30.0,
    "income": 75000.0,
    "loan": 15000.0,
    "credit_score": 720.0
  }
}
```

### 3. `POST /save_record`
Appends new applicant data to the historical dataset.

---

## 🤝 Contributing

1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
