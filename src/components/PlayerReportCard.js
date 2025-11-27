// src/components/PlayerReportCard.js
// Crickedge Player Report Card – all tabs + styles like sample images

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PlayerReportCard.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";
const API_PR_CARD = `${API_BASE}/api/player-report-card`;

const TABS = [
  { id: "highest-score", label: "Highest Score" },
  { id: "bowling-average", label: "Bowling Average" },
  { id: "most-wickets-format", label: "Most Wickets" },
  { id: "batting-average", label: "Batting Average" },
  { id: "top-run-scorers", label: "Top Run Scorer" },
  { id: "most-fifties", label: "Most Fifties" },
  { id: "most-hundreds", label: "Most Hundreds" },
  { id: "most-wickets-overall", label: "Most Wickets (Overall)" },
  { id: "most-ducks", label: "Most Ducks" },
  { id: "most-balls-faced", label: "Most Balls Faced (Test)" },
];

const MATCH_TYPE_OPTIONS = [
  { value: "ALL", label: "All Formats" },
  { value: "ODI", label: "ODI" },
  { value: "T20", label: "T20" },
  { value: "Test", label: "Test" },
];

// Generic row card that reads CSS variables for colors
const StatRowCard = ({ rank, primary, secondary, value, highlight = false }) => {
  const classes = ["prc-row-card"];
  if (highlight) classes.push("prc-row-card--highlight");

  return (
    <div className={classes.join(" ")}>
      <div className="prc-row-left">
        <div className="prc-row-rank">
          <span className="prc-rank-number">{rank}</span>
          {highlight && <span className="prc-rank-crown">👑</span>}
        </div>
        <div className="prc-row-main">
          <div className="prc-row-primary">{primary}</div>
          {secondary && <div className="prc-row-secondary">{secondary}</div>}
        </div>
      </div>
      <div className="prc-row-value">
        <span>{value}</span>
      </div>
    </div>
  );
};

const PlayerReportCard = () => {
  const [activeTab, setActiveTab] = useState("highest-score");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [highestScores, setHighestScores] = useState([]);
  const [bowlingAvg, setBowlingAvg] = useState([]);
  const [mostWicketsFormat, setMostWicketsFormat] = useState([]);
  const [battingAvg, setBattingAvg] = useState([]);
  const [topRunScorers, setTopRunScorers] = useState([]);
  const [mostFifties, setMostFifties] = useState([]);
  const [mostHundreds, setMostHundreds] = useState([]);
  const [mostWicketsOverall, setMostWicketsOverall] = useState([]);
  const [mostDucks, setMostDucks] = useState([]);
  const [mostBalls, setMostBalls] = useState([]);

  // filters
  const [bowlingMatchType, setBowlingMatchType] = useState("Test");
  const [wicketsMatchType, setWicketsMatchType] = useState("ALL");
  const [battingMatchType, setBattingMatchType] = useState("ALL");
  const [wicketsOverallMatchType, setWicketsOverallMatchType] =
    useState("ALL");

  // ---- data loaders ----

  const withStatus = async (fn) => {
    try {
      setLoading(true);
      setError("");
      await fn();
    } catch (e) {
      console.error(e);
      setError("Something went wrong while loading data.");
    } finally {
      setLoading(false);
    }
  };

  const loadHighestScore = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/highest-score`, {
        params: { matchType: "ODI" },
      });
      setHighestScores(res.data || []);
    });

  const loadBowlingAverage = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/bowling-average`, {
        params: { matchType: bowlingMatchType },
      });
      setBowlingAvg(res.data || []);
    });

  const loadMostWicketsFormat = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/most-wickets`, {
        params: { matchType: wicketsMatchType },
      });
      setMostWicketsFormat(res.data || []);
    });

  const loadBattingAverage = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/batting-average`, {
        params: { matchType: battingMatchType },
      });
      setBattingAvg(res.data || []);
    });

  const loadTopRunScorers = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/top-run-scorers`);
      setTopRunScorers(res.data || []);
    });

  const loadMostFifties = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/most-fifties`);
      setMostFifties(res.data || []);
    });

  const loadMostHundreds = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/most-hundreds`);
      setMostHundreds(res.data || []);
    });

  const loadMostWicketsOverall = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/most-wickets`, {
        params: { matchType: wicketsOverallMatchType },
      });
      setMostWicketsOverall(res.data || []);
    });

  const loadMostDucks = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/most-ducks`);
      setMostDucks(res.data || []);
    });

  const loadMostBalls = () =>
    withStatus(async () => {
      const res = await axios.get(`${API_PR_CARD}/most-balls-faced`);
      setMostBalls(res.data || []);
    });

  // ---- effects for tab changes / filter changes ----

  useEffect(() => {
    if (activeTab === "highest-score") loadHighestScore();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "bowling-average") loadBowlingAverage();
  }, [activeTab, bowlingMatchType]);

  useEffect(() => {
    if (activeTab === "most-wickets-format") loadMostWicketsFormat();
  }, [activeTab, wicketsMatchType]);

  useEffect(() => {
    if (activeTab === "batting-average") loadBattingAverage();
  }, [activeTab, battingMatchType]);

  useEffect(() => {
    if (activeTab === "top-run-scorers") loadTopRunScorers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "most-fifties") loadMostFifties();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "most-hundreds") loadMostHundreds();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "most-wickets-overall") loadMostWicketsOverall();
  }, [activeTab, wicketsOverallMatchType]);

  useEffect(() => {
    if (activeTab === "most-ducks") loadMostDucks();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "most-balls-faced") loadMostBalls();
  }, [activeTab]);

  // ---------- render helpers ----------

  const renderStatus = () => {
    if (loading) return <div className="prc-status">Loading...</div>;
    if (error)
      return <div className="prc-status prc-status--error">{error}</div>;
    return null;
  };

  const formatBalls = (n) => {
    if (n == null) return "-";
    return Number(n).toLocaleString("en-IN");
  };

  // Individual tab UI (hero title + list)

  const HighestScoreTab = () => (
    <section className="prc-section prc-section--highest-score">
      <div className="prc-section-inner">
        <header className="prc-hero">
          <h2 className="prc-hero-title">HIGHEST SCORE</h2>
          <p className="prc-hero-sub">Individual Highest Score in ODI Cricket</p>
        </header>
        <div className="prc-list-panel">
          {renderStatus()}
          {!loading &&
            !error &&
            highestScores.map((row) => (
              <StatRowCard
                key={row.rank}
                rank={row.rank}
                primary={row.playerName}
                secondary="INDIVIDUAL ODI INNINGS"
                value={`${row.score}${row.notOut ? "*" : ""}`}
                highlight={row.rank === 1}
              />
            ))}
        </div>
      </div>
    </section>
  );

  const BowlingAverageTab = () => (
    <section className="prc-section prc-section--bowling-average">
      <div className="prc-section-inner">
        <header className="prc-hero">
          <h2 className="prc-hero-title">BEST AVERAGE</h2>
          <p className="prc-hero-sub">
            Crickedge Best Bowling Average
            {bowlingMatchType !== "ALL" ? ` in ${bowlingMatchType}` : ""} (min: 1
            wicket)
          </p>

          <div className="prc-filter">
            <label>Match Type:</label>
            <select
              value={bowlingMatchType}
              onChange={(e) => setBowlingMatchType(e.target.value)}
            >
              {MATCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>
        <div className="prc-list-panel">
          {renderStatus()}
          {!loading &&
            !error &&
            bowlingAvg.map((row) => (
              <StatRowCard
                key={row.rank}
                rank={row.rank}
                primary={row.playerName}
                secondary={`${row.totalWickets} wkts`}
                value={
                  row.bowlingAvg != null ? Number(row.bowlingAvg).toFixed(2) : "-"
                }
                highlight={row.rank === 1}
              />
            ))}
        </div>
      </div>
    </section>
  );

  const MostWicketsFormatTab = () => (
    <section className="prc-section prc-section--most-wickets">
      <div className="prc-section-inner">
        <header className="prc-hero">
          <h2 className="prc-hero-title">MOST WICKETS</h2>
          <p className="prc-hero-sub">
            Crickedge Most Wickets Taken
            {wicketsMatchType !== "ALL"
              ? ` in ${wicketsMatchType}`
              : " (All Formats)"}
          </p>

          <div className="prc-filter">
            <label>Match Type:</label>
            <select
              value={wicketsMatchType}
              onChange={(e) => setWicketsMatchType(e.target.value)}
            >
              {MATCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>
        <div className="prc-list-panel">
          {renderStatus()}
          {!loading &&
            !error &&
            mostWicketsFormat.map((row) => (
              <StatRowCard
                key={row.rank}
                rank={row.rank}
                primary={row.playerName}
                secondary="TOTAL WICKETS"
                value={row.totalWickets}
                highlight={row.rank === 1}
              />
            ))}
        </div>
      </div>
    </section>
  );

  const BattingAverageTab = () => {
    const suffix =
      battingMatchType === "ALL" ? "" : ` in ${battingMatchType} format`;

    return (
      <section className="prc-section prc-section--batting-average">
        <div className="prc-section-inner">
          <header className="prc-hero">
            <h2 className="prc-hero-title">HIGHEST AVERAGES</h2>
            <p className="prc-hero-sub">
              Crickedge Batting Average Holder{suffix}
            </p>

            <div className="prc-filter">
              <label>Match Type:</label>
              <select
                value={battingMatchType}
                onChange={(e) => setBattingMatchType(e.target.value)}
              >
                {MATCH_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </header>
          <div className="prc-list-panel">
            {renderStatus()}
            {!loading &&
              !error &&
              battingAvg.map((row) => (
                <StatRowCard
                  key={row.rank}
                  rank={row.rank}
                  primary={row.playerName}
                  secondary={`${row.totalRuns} runs · ${row.innings} inns`}
                  value={
                    row.battingAvg != null
                      ? Number(row.battingAvg).toFixed(2)
                      : "-"
                  }
                  highlight={row.rank === 1}
                />
              ))}
          </div>
        </div>
      </section>
    );
  };

  const TopRunScorersTab = () => (
    <section className="prc-section prc-section--top-runs">
      <div className="prc-section-inner prc-section-inner--runs">
        <header className="prc-hero prc-hero--runs">
          <h2 className="prc-hero-title">TOP INTERNATIONAL RUN SCORERS</h2>
          <p className="prc-hero-sub">
            Combined runs across all Crickedge formats (ODI, T20, Test).
          </p>
        </header>
        <div className="prc-list-panel prc-list-panel--runs">
          {renderStatus()}
          {!loading &&
            !error &&
            topRunScorers.map((row) => {
              const isTop = row.rank === 1;
              const rowClass = isTop
                ? "prc-runs-row prc-runs-row--highlight"
                : "prc-runs-row";
              return (
                <div key={row.rank} className={rowClass}>
                  <div className="prc-runs-rank">{row.rank}</div>
                  <div className="prc-runs-name">
                    {row.playerName}
                    {isTop && <span className="prc-runs-crown">👑</span>}
                  </div>
                  <div className="prc-runs-value">
                    {Number(row.totalRuns).toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );

  const MostFiftiesTab = () => (
    <section className="prc-section prc-section--fifties">
      <div className="prc-section-inner">
        <header className="prc-hero">
          <h2 className="prc-hero-title">MOST FIFTIES</h2>
          <p className="prc-hero-sub">
            Crickedge Most Fifties (combined ODI, T20 and Test).
          </p>
        </header>
        <div className="prc-list-panel">
          {renderStatus()}
          {!loading &&
            !error &&
            mostFifties.map((row) => (
              <StatRowCard
                key={row.rank}
                rank={row.rank}
                primary={row.playerName}
                secondary="TOTAL FIFTIES"
                value={row.totalFifties}
                highlight={row.rank === 1}
              />
            ))}
        </div>
      </div>
    </section>
  );

  const MostHundredsTab = () => (
    <section className="prc-section prc-section--hundreds">
      <div className="prc-section-inner">
        <header className="prc-hero">
          <h2 className="prc-hero-title">MOST HUNDREDS</h2>
          <p className="prc-hero-sub">
            Crickedge Most Hundreds (combined ODI, T20 and Test).
          </p>
        </header>
        <div className="prc-list-panel">
          {renderStatus()}
          {!loading &&
            !error &&
            mostHundreds.map((row) => (
              <StatRowCard
                key={row.rank}
                rank={row.rank}
                primary={row.playerName}
                secondary="TOTAL HUNDREDS"
                value={row.totalHundreds}
                highlight={row.rank === 1}
              />
            ))}
        </div>
      </div>
    </section>
  );

  const MostWicketsOverallTab = () => (
    <section className="prc-section prc-section--most-wickets-overall">
      <div className="prc-section-inner">
        <header className="prc-hero">
          <h2 className="prc-hero-title">MOST WICKETS (OVERALL)</h2>
          <p className="prc-hero-sub">
            Crickedge Most Wickets Taken overall
            {wicketsOverallMatchType !== "ALL"
              ? ` in ${wicketsOverallMatchType}`
              : " (All Formats)"}
          </p>

          <div className="prc-filter">
            <label>Match Type:</label>
            <select
              value={wicketsOverallMatchType}
              onChange={(e) => setWicketsOverallMatchType(e.target.value)}
            >
              {MATCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>
        <div className="prc-list-panel">
          {renderStatus()}
          {!loading &&
            !error &&
            mostWicketsOverall.map((row) => (
              <StatRowCard
                key={row.rank}
                rank={row.rank}
                primary={row.playerName}
                secondary="TOTAL WICKETS"
                value={row.totalWickets}
                highlight={row.rank === 1}
              />
            ))}
        </div>
      </div>
    </section>
  );

  const MostDucksTab = () => (
    <section className="prc-section prc-section--ducks">
      <div className="prc-section-inner">
        <header className="prc-hero">
          <h2 className="prc-hero-title">MOST DUCKS</h2>
          <p className="prc-hero-sub">
            Crickedge Most Duckout – players dismissed for 0 runs most often.
          </p>
        </header>
        <div className="prc-list-panel">
          {renderStatus()}
          {!loading &&
            !error &&
            mostDucks.map((row) => (
              <StatRowCard
                key={row.rank}
                rank={row.rank}
                primary={row.playerName}
                secondary="TOTAL DUCKS"
                value={row.ducks}
                highlight={row.rank === 1}
              />
            ))}
        </div>
      </div>
    </section>
  );

  const MostBallsTab = () => (
    <section className="prc-section prc-section--balls">
      <div className="prc-section-inner">
        <header className="prc-hero">
          <h2 className="prc-hero-title">MOST BALLS FACED</h2>
          <p className="prc-hero-sub">
            Crickedge Most Balls Faced in Test Cricket (combined Test innings).
          </p>
        </header>
        <div className="prc-list-panel">
          {renderStatus()}
          {!loading &&
            !error &&
            mostBalls.map((row) => (
              <StatRowCard
                key={row.rank}
                rank={row.rank}
                primary={row.playerName}
                secondary="TOTAL BALLS FACED (TEST)"
                value={formatBalls(row.totalBalls)}
                highlight={row.rank === 1}
              />
            ))}
        </div>
      </div>
    </section>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "highest-score":
        return <HighestScoreTab />;
      case "bowling-average":
        return <BowlingAverageTab />;
      case "most-wickets-format":
        return <MostWicketsFormatTab />;
      case "batting-average":
        return <BattingAverageTab />;
      case "top-run-scorers":
        return <TopRunScorersTab />;
      case "most-fifties":
        return <MostFiftiesTab />;
      case "most-hundreds":
        return <MostHundredsTab />;
      case "most-wickets-overall":
        return <MostWicketsOverallTab />;
      case "most-ducks":
        return <MostDucksTab />;
      case "most-balls-faced":
        return <MostBallsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="prc-page">
      {/* Module heading */}
      <div className="prc-header-half-circle">
        <span className="prc-header-title">
          CRICKEDGE PLAYER REPORT CARD
        </span>
      </div>

      {/* Tabs */}
      <div className="prc-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={
              tab.id === activeTab ? "prc-tab prc-tab--active" : "prc-tab"
            }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab body */}
      {renderTabContent()}
    </div>
  );
};

export default PlayerReportCard;
