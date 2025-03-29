// src/components/AboutCrickEdge.js
import React from "react";

const AboutCrickEdge = () => {
  return (
    <div className="container text-white py-4">
      <h2 className="mb-4">🏏 About <strong>CrickEdge</strong></h2>

      <p>
        <strong>CrickEdge</strong> is a modern, real-time cricket scoreboard web application designed to bring the <em>thrill of cricket analytics</em> to players, fans, and organizers alike.
        Whether you're tracking international showdowns or managing local tournaments, CrickEdge provides a <strong>clean, intuitive, and insightful platform</strong> to record, view, and analyze match data effortlessly.
      </p>

      <hr className="bg-light" />

      <h4>🎯 Our Purpose</h4>
      <p>
        CrickEdge was built with the vision of making <strong>cricket scoring and performance tracking</strong> more interactive, insightful, and accessible—combining <em>live data capture</em>, <em>automated calculations</em>, and <em>a dynamic user interface</em> to elevate the cricket experience for everyone.
      </p>

      <hr className="bg-light" />

      <h4>⚙️ Key Features</h4>
      <ul className="list-unstyled">
        <li>✅ <strong>Real-Time Match Scoreboard:</strong> Submit match details with ease—team scores, overs, wickets, and results.</li>
        <li>📊 <strong>Live Leaderboard & Net Run Rate (NRR):</strong> ICC-compliant NRR calculations including all-out conditions and ball-to-decimal conversion.</li>
        <li>🏆 <strong>Match History & Filters:</strong> Search by match type, teams, or winners for performance tracking.</li>
        <li>🌍 <strong>Teams Directory:</strong> Real-time stats per team with win/loss breakdown and NRR across formats.</li>
        <li>📈 <strong>Graph & Chart View:</strong> Visualize progress using bar/line charts for points, wins, and trends.</li>
        <li>🧑‍💼 <strong>Admin Panel (Optional):</strong> Toggle match submission restrictions for control or simplicity.</li>
        <li>💻 <strong>Responsive Design:</strong> Optimized for mobile, tablet, and desktop screens using dark UI.</li>
      </ul>
    </div>
  );
};

export default AboutCrickEdge;
