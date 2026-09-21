import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Debounce helper
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function App() {
  const [form, setForm] = useState({
    age: '',
    income: '',
    loan: '',
    credit_score: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Handles updates from both initial form and simulator
  const fetchPrediction = async (values, isSimulator = false) => {
    if (!isSimulator) setLoading(true);
    else setSimulating(true);
    
    setError('');
    setIsSaved(false); // Reset saved state on change
    
    try {
      const response = await fetch('http://localhost:5001/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(values.age),
          income: parseFloat(values.income),
          loan: parseFloat(values.loan),
          credit_score: parseInt(values.credit_score),
        }),
      });

      const data = await response.json();

      if (response.status === 422) {
        setValidationErrors(data.details || []);
      } else if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Unable to reach the server. Make sure the Flask backend is running on port 5001.');
    } finally {
      setLoading(false);
      setSimulating(false);
    }
  };

  const handleSaveToDataset = async () => {
    if (!result || isSaved) return;

    try {
      // Suggest default label based on risk level
      // risk_level 0 (Low) -> 0 (No Default)
      // risk_level 1/2 (Medium/High) -> 1 (Default)
      const label = result.risk_level === 0 ? 0 : 1;

      const response = await fetch('http://localhost:5001/save_record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: result.input.age,
          income: result.input.income,
          loan: result.input.loan,
          credit_score: result.input.credit_score,
          default: label
        }),
      });

      if (response.ok) {
        setIsSaved(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save record.');
      }
    } catch (err) {
      setError('Connection error while saving.');
    }
  };

  // Debounced simulator update
  const debouncedPredict = useCallback(
    debounce((values) => fetchPrediction(values, true), 400),
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    setError('');
    setValidationErrors([]);
    
    // If we've already had a result, update live (Simulator mode)
    if (result) {
      debouncedPredict(updatedForm);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPrediction(form);
  };

  const handleReset = () => {
    setForm({ age: '', income: '', loan: '', credit_score: '' });
    setResult(null);
    setError('');
    setValidationErrors([]);
    setIsSaved(false);
  };

  const getRiskTheme = (riskLevel) => {
    if (riskLevel === 0) return 'low';
    if (riskLevel === 1) return 'medium';
    return 'high';
  };

  return (
    <div className="app">
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      <div className="container">
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="logo-title">CreditSense AI</h1>
              <p className="logo-subtitle">Credit Risk Intelligence Platform (v2.0)</p>
            </div>
          </div>
          <div className="header-badge">
            <span className={`badge-dot ${simulating ? 'simulating' : ''}`} />
            {simulating ? 'Processing Live...' : 'RandomForest Powered'}
          </div>
        </header>

        <section className="hero">
          <h2 className="hero-title">
            Realistic Risk <span className="gradient-text">Analysis</span>
          </h2>
          <p className="hero-desc">
            Explore your financial boundaries with real-time "What-If" simulation and interactive factor intelligence.
          </p>
        </section>

        <main className={`card ${result ? 'result-mode' : ''}`}>
          {!result ? (
            <form className="form" onSubmit={handleSubmit}>
              <h3 className="form-title">Financial Profile</h3>

              <div className="fields">
                <div className="field-group">
                  <label className="field-label" htmlFor="age">
                    <span className="field-icon">👤</span> Age
                  </label>
                  <div className="input-wrapper">
                    <input id="age" name="age" type="number" className="field-input no-prefix" placeholder="e.g. 25" value={form.age} onChange={handleChange} required />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="income">
                    <span className="field-icon">💰</span> Annual Income (₹)
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">₹</span>
                    <input id="income" name="income" type="number" className="field-input" placeholder="e.g. 50000" value={form.income} onChange={handleChange} required />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="loan">
                    <span className="field-icon">🏦</span> Loan Amount (₹)
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">₹</span>
                    <input id="loan" name="loan" type="number" className="field-input" placeholder="e.g. 20000" value={form.loan} onChange={handleChange} required />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="credit_score">
                    <span className="field-icon">📊</span> Credit Score
                  </label>
                  <div className="input-wrapper">
                    <input id="credit_score" name="credit_score" type="number" className="field-input no-prefix" placeholder="e.g. 720" value={form.credit_score} onChange={handleChange} min="300" max="900" required />
                  </div>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <ul className="error-list">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}

              {error && <div className="error-box">{error}</div>}

              <button type="submit" className={`btn-predict ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Analyze Risk Profile'}
              </button>
            </form>
          ) : (
            <div className="dashboard">
              <div className="dashboard-results">
                <div className="result-section">
                  <div className={`result-badge ${getRiskTheme(result.risk_level)}`}>
                    {result.risk_level === 0 ? '✅' : result.risk_level === 1 ? '⚡' : '⚠️'}
                  </div>
                  <h3 className="result-label">ML Classification</h3>
                  <p className={`result-value text-${getRiskTheme(result.risk_level)}`}>
                    {result.prediction}
                  </p>

                  <div className="confidence-card">
                    <div className="confidence-header">
                      <span className="confidence-title">Model Confidence</span>
                      <span className="confidence-pct">{result.confidence}%</span>
                    </div>
                    <div className="confidence-bar-bg">
                      <div className={`confidence-bar-fill fill-${getRiskTheme(result.risk_level)}`} style={{ width: `${result.confidence}%` }} />
                    </div>
                  </div>

                  <div className={`analysis-box border-${getRiskTheme(result.risk_level)}`}>
                    <div className="analysis-header">
                      <span className="analysis-icon">🔍</span>
                      <h4 className="analysis-title">AI Decision Analysis</h4>
                    </div>
                    <p className="analysis-reason">{result.reason}</p>
                    <div className="median-comparison">
                      <div className="median-info">
                        <span className="median-label">Population Benchmark</span>
                        <span className="median-sub">Database average risk</span>
                      </div>
                      <div className="median-val-chip">{(result.median_risk * 100).toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Data Collection Card */}
                  <div className="archive-card">
                    <div className="archive-info">
                      <span className="archive-icon">💾</span>
                      <div>
                        <h4 className="archive-title">Feedback Loop</h4>
                        <p className="archive-desc">Save this case to the historical training dataset.</p>
                      </div>
                    </div>
                    <button 
                      className={`btn-save ${isSaved ? 'saved' : ''}`} 
                      onClick={handleSaveToDataset}
                      disabled={isSaved}
                    >
                      {isSaved ? '✅ Saved' : 'Add to Training Data'}
                    </button>
                  </div>

                  <button className="btn-reset" onClick={handleReset}>Reset Analysis</button>
                </div>
              </div>

              <div className="dashboard-simulator">
                <h3 className="sim-title">"What-If" Simulator</h3>
                <p className="sim-desc">Adjust your parameters below to see how they impact your risk level in real-time.</p>
                
                <div className="sim-controls">
                  <div className="sim-group">
                    <label className="sim-label">Credit Score: <span>{form.credit_score}</span></label>
                    <input type="range" name="credit_score" min="300" max="900" step="10" value={form.credit_score} onChange={handleChange} className="sim-slider" />
                  </div>
                  <div className="sim-group">
                    <label className="sim-label">Loan Amount: <span>₹{parseInt(form.loan).toLocaleString()}</span></label>
                    <input type="range" name="loan" min="1000" max="500000" step="5000" value={form.loan} onChange={handleChange} className="sim-slider" />
                  </div>
                  <div className="sim-group">
                    <label className="sim-label">Annual Income: <span>₹{parseInt(form.income).toLocaleString()}</span></label>
                    <input type="range" name="income" min="10000" max="1000000" step="10000" value={form.income} onChange={handleChange} className="sim-slider" />
                  </div>
                  <div className="sim-group">
                    <label className="sim-label">Age: <span>{form.age}</span></label>
                    <input type="range" name="age" min="18" max="100" step="1" value={form.age} onChange={handleChange} className="sim-slider" />
                  </div>
                </div>

                <div className="sim-tip">
                  <span className="tip-icon">💡</span>
                  <p>Lowering your loan-to-income ratio or improving your credit score is the fastest way to reach <strong>Low Risk</strong>.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
