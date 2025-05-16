// src/components/SmartAnalyzer.js
import React, { useState } from "react";
import "./SmartAnalyzer.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaMagic, FaHistory, FaChartLine } from "react-icons/fa";

const SmartAnalyzer = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const handleQuery = async () => {
    setError("");
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
      setHistory((prev) => [{ query, response: data }, ...prev]);
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
  };

  return (
    <div className="analyzer-container">
      <h2 className="analyzer-title">🧠 CrickEdge Smart Analyzer</h2>

      <div className="query-section">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a cricket question..."
          className="analyzer-input"
        />
        <Button onClick={handleQuery} disabled={loading} className="analyzer-btn">
          {loading ? "Analyzing..." : <FaMagic className="mr-2" />} Analyze
        </Button>
      </div>

      {error && <p className="error-text">⚠️ {error}</p>}

      <div className="examples">
        <span>Try:</span>
        <Button onClick={() => handleExampleClick("Top scorer in last 10 ODIs")}>Top scorer</Button>
        <Button onClick={() => handleExampleClick("India vs Australia win % in T20s")}>Win %</Button>
        <Button onClick={() => handleExampleClick("Best economy bowler in T20")}>Best economy</Button>
      </div>

      {response && (
        <Card className="response-card">
          <CardContent>
            <h3><FaChartLine className="inline mr-2" />Response:</h3>
            <pre className="response-output">{JSON.stringify(response, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <h4><FaHistory className="inline mr-2" />Query History</h4>
          <ul>
            {history.map((item, idx) => (
              <li key={idx}>
                <strong>{item.query}</strong>
                <pre>{JSON.stringify(item.response, null, 2)}</pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SmartAnalyzer;
