// src/components/QualificationScenario.js
import React, { useEffect, useState } from "react";
import { calculateQualificationScenario } from "../utils/qualificationCalculator";
import { getTeams, getUpcomingMatchList } from "../services/api";
import { FaRedo } from "react-icons/fa"; // For Retry button



const QualificationScenario = () => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ❌ REMOVE hardcoded targetTeamName = "India"
  // We will now dynamically process all matches, not only for India

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);

      const teamsData = await getTeams();
      const upcomingMatches = await getUpcomingMatchList();
      console.log("✅ Upcoming Matches from API:", upcomingMatches);

      if (!teamsData || teamsData.length === 0) {
        console.log("✅ Teams Data from DB:", teamsData);
        throw new Error("No teams data found");
      }
      if (!upcomingMatches || upcomingMatches.length === 0) {
        console.log("✅ Upcoming Matches from API:", upcomingMatches);
        throw new Error("No upcoming matches found");
      }

      // ✅ UPDATED LOGIC: Calculate scenarios for ALL matches (dynamic, not only for India)
// ✅ Final Scenario Evaluation Logic with Safeguards
const results = [];

upcomingMatches.forEach(match => {
        console.log(
          "🔍 Checking match:",
          match.match_name,
          "| team1:", match.team_1,
          "| team2:", match.team_2
        );
  
          
  if (!match || !match.team_1 || !match.team_2) return; // safety check

  try {
    const team1 = match.team_1;
    const team2 = match.team_2;

console.log("📊 Running scenario calc for team:", team1, "with full teamsData:", teamsData);
const scenarios = calculateQualificationScenario(teamsData, [match], team1);

  
    if (Array.isArray(scenarios) && scenarios.length > 0 && scenarios[0]?.match) {
      results.push(scenarios[0]); // push only valid scenario
    } else {
      console.warn("⚠️ No scenario generated for match:", match.match_name || match);
    }
  } catch (e) {
    console.error("❌ Error while generating scenario for match:", match.match_name || match, e);
  }
  
});

if (results.length === 0) {
  throw new Error("No qualification scenarios generated");
}

setScenarios(results);

    } catch (err) {
      console.error("Error fetching or calculating scenarios:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="loader"></div>
        <p style={styles.loadingText}>Fetching Qualification Scenarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p>⚠️ Unable to load qualification scenarios. Please try again.</p>
        <button onClick={fetchData} style={styles.retryButton}>
          <FaRedo /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="qualification-scenario" style={styles.container}>
      <h1 style={styles.heading}>🏏 Qualification Scenarios</h1>

      {scenarios.length === 0 ? (
        <div style={styles.noData}>
          <p>No qualification scenarios available currently. Matches are being updated live!</p>
        </div>
      ) : (
                            <ul style={styles.list}>
                          {scenarios.map((s, index) => {
            if (!s || !s.match) return null; // skip broken data
            return (
              <li key={index} style={styles.listItem}>
                <h3>Match: {s.match}</h3>
                <p>🚀 {s.battingFirstScenario}</p>
                <p>⚡ {s.chasingScenario}</p>
              </li>
            );
          })}

        </ul>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    animation: "fadeIn 0.6s ease",
  },
  heading: {
    fontSize: "26px",
    marginBottom: "10px",
  },
  noData: {
    marginTop: "30px",
    fontSize: "18px",
    color: "#ccc",
    textAlign: "center",
  },
  list: {
    marginTop: "20px",
    listStyleType: "none",
    padding: 0,
  },
  listItem: {
    background: "#1e293b",
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    transition: "transform 0.2s ease",
  },
  loadingContainer: {
    padding: "40px",
    textAlign: "center",
  },
  loadingText: {
    marginTop: "10px",
    fontSize: "18px",
    color: "#999",
  },
  errorContainer: {
    padding: "40px",
    textAlign: "center",
    color: "#ff4d4f",
  },
  retryButton: {
    marginTop: "15px",
    padding: "8px 16px",
    backgroundColor: "#1e90ff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default QualificationScenario;
