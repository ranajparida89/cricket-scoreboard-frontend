// ✅ src/components/TournamentTicker.js
// Small header ticker that shows ongoing tournament countdown
// - visible for all users
// - turns red in last 1 day
// - disappears automatically when time is over / no tournament

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TournamentTicker.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

// convert ms → {days, hours, minutes, seconds}
const msToParts = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const pad2 = (n) => String(n).padStart(2, "0");

const TournamentTicker = () => {
  const [tournament, setTournament] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);

  // initial fetch
  useEffect(() => {
    const fetchOngoing = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/tournament/ongoing`);
        const t = res.data;
        if (!t || !t.id) {
          setTournament(null);
          setRemainingMs(0);
          return;
        }

        setTournament(t);
        setRemainingMs(Number(t.remaining_ms || 0));
      } catch (err) {
        console.error("TournamentTicker: failed to load ongoing tournament", err);
      }
    };

    fetchOngoing();
  }, []);

  // countdown tick when running
  useEffect(() => {
    if (!tournament || tournament.status !== "running") return;
    if (remainingMs <= 0) return;

    const id = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(id);
          // mark as completed locally → ticker hides
          setTournament((t) =>
            t ? { ...t, status: "completed", remaining_ms: 0 } : t
          );
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [tournament?.status, remainingMs]);

  // nothing to show: no tournament / completed / time over
  if (!tournament || tournament.status === "completed" || remainingMs <= 0) {
    return null;
  }

  const parts = msToParts(remainingMs);
  const isUrgent = parts.days === 0;
  const timerClass = "tt-timer " + (isUrgent ? "red" : "green");

  const label =
    tournament.status === "paused"
      ? `${tournament.tournament_name} (Paused)`
      : `${tournament.tournament_name}`;

  return (
    <div className="tt-bar">
      <span className="tt-label">🏆 Ongoing Tournament:</span>
      <span className="tt-name">{label}</span>
      <span className={timerClass}>
        {parts.days} Days {pad2(parts.hours)} hr : {pad2(parts.minutes)} min :{" "}
        {pad2(parts.seconds)} sec
      </span>
    </div>
  );
};

export default TournamentTicker;
