import React, { useState } from "react";
import UploadSection from "./components/UploadSection";
import Results from "./components/Results";
import "./index.css";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("quick");

  return (
    <div className="container">
      <div className="header">
        <div className="inner">
          <h1 className="logo-text">Resume Analyzer</h1>
          <div className="small">Intelligent Resume Analysis & Optimization</div>
        </div>
      </div>

      <div className="hero">
        <h1>Professional Resume Analysis</h1>
        <p>Get instant AI-powered feedback on your resume and optimize it for better job opportunities</p>
      </div>

      <div className="grid">
        <div className="card">
          <UploadSection 
            setResult={setResult} 
            setLoading={setLoading} 
            setError={setError}
            mode={mode}
            setMode={setMode}
          />
        </div>

        <div className="card">
          <Results result={result} loading={loading} error={error} />
        </div>
      </div>

      <div className="footer">
        <p>💡 Tip: Tailor your resume for each job application to maximize your match score!</p>
        <p>Professional Resume Analysis Tool | AI-Powered Optimization</p>
      </div>
    </div>
  );
}

export default App;
