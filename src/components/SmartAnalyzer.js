// ✅ Step 3: Improve history output and UI styling in SmartAnalyzer.js

import React, { useState } from "react";
import "./SmartAnalyzer.css";
import { FaMagic, FaHistory, FaChartLine } from "react-icons/fa";
import questions from "../components/questions"; // ✅ Correct relative path if `questions.js` is inside components folder


const SmartAnalyzer = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleQuery = async () => {
    setError("");
    setShowSuggestions(false);
    if (!query.trim()) {
      setError("Please enter a valid question.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://cricket-scoreboard-backend.onrender.com/api/analyzer/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      setResponse(data);
      setHistory((prev) => [{ query, result: data?.result }, ...prev]);
    } catch (err) {
      setError("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    setResponse(null);
    setError("");
    setShowSuggestions(false);
  };

  const filteredSuggestions = questions.filter(q =>
    q.toLowerCase().includes(query.toLowerCase()) && query.length > 1
  ).slice(0, 7);

  return (
    <div className="analyzer-container">
      <h2 className="analyzer-title">🧠 CrickEdge Smart Analyzer</h2>

      <div className="query-section">
  {/* ✅ Step 6: Dropdown for Popular Queries */}
  <div className="popular-dropdown-container">
    <label htmlFor="popular-queries">Popular Queries:</label>
    <select
      id="popular-queries"
      className="popular-dropdown"
      onChange={(e) => handleExampleClick(e.target.value)}
      defaultValue=""
    >
      <option value="" disabled>Select a popular query...</option>
      {questions.slice(0, 50).map((q, idx) => (
        <option key={idx} value={q}>{q}</option>
      ))}
    </select>
  </div>

  {/* ✅ Main Input */}
  <input
    type="text"
    value={query}
    onChange={(e) => {
      setQuery(e.target.value);
      setShowSuggestions(true);
    }}
    placeholder="Ask a cricket question..."
    className="analyzer-input"
    onFocus={() => setShowSuggestions(true)}
  />
  <button onClick={handleQuery} disabled={loading} className="analyzer-btn">
    {loading ? "Analyzing..." : <><FaMagic className="mr-2" /> Analyze</>}
  </button>
</div>


      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="suggestion-dropdown">
          {filteredSuggestions.map((suggestion, index) => (
            <li key={index} onClick={() => handleExampleClick(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="error-text">⚠️ {error}</p>}

      <div className="examples">
        <span>Try:</span>
        <button onClick={() => handleExampleClick("Top scorer for India in ODI")}>Top scorer</button>
        <button onClick={() => handleExampleClick("Top wicket taker for Australia")}>Top wickets</button>
        <button onClick={() => handleExampleClick("Most centuries for India")}>Most centuries</button>
      </div>

   {response && (
  <div className="response-card glow-border">
    <div className="badge-strip">
      <span className="badge">🎯 Smart Result</span>
      <span className="tooltip-icon" title="Based on live cricket performance data.">ℹ️</span>
    </div>
    <div
      className="response-output"
      dangerouslySetInnerHTML={{ __html: response?.result || "<p>No data available.</p>" }}
    ></div>
  </div>
)}


      {history.length > 0 && (
        <div className="history-section">
          <h4><FaHistory className="inline mr-2" />Past Queries</h4>
          <div className="history-list">
            {history.map((item, idx) => (
              <div key={idx} className="history-entry">
                <div className="history-question">❓ <strong>{item.query}</strong></div>
                <div
                  className="history-answer"
                  dangerouslySetInnerHTML={{ __html: item.result }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAnalyzer;
