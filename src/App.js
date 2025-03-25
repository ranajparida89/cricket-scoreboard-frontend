import React from "react";
import MatchForm from "./components/MatchForm";
import Leaderboard from "./components/Leaderboard";
import MatchHistory from "./components/MatchHistory";
import TeamChart from "./components/TeamCharts";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="container my-4">
      <h1 className="text-center mb-4 text-primary">🏏 Cricket Scoreboard App</h1>

      <div className="row">
        <div className="col-md-6">
          <MatchForm />
        </div>
        <div className="col-md-6">
          <Leaderboard />
        </div>
      </div>

      <div className="mt-5">
        <MatchHistory />
      </div>

      <div className="mt-5">
        <TeamChart />
      </div>
    </div>
  );
}

export default App;
