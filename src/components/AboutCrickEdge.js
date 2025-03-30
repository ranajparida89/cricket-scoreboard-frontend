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

      <hr className="bg-light" />

      {/* ✅ New Developer Section */}
      <h4 className="mt-5">👨‍💻 About the Developer – <em>Ranaj Parida</em></h4>
      <p>
        CrickEdge is more than just a cricket scoreboard — it’s a labor of love, built from the ground up by a passionate developer, <strong>Ranaj Parida</strong>.
      </p>
      <p>
        With over <strong>9+ years of experience</strong> in the IT industry, Ranaj leveraged his core strengths in <strong>Oracle SQL, PL/SQL, and backend engineering</strong> to explore new technologies and bring CrickEdge to life. Despite a busy professional and personal life, Ranaj single-handedly designed, coded, tested, and deployed CrickEdge — managing both the frontend and backend with great precision.
      </p>
      <p>
        💡 What truly sets Ranaj apart is his <strong>grit, consistency, and eagerness to learn</strong>. Having no prior experience in full-stack JavaScript frameworks, he took the initiative to self-learn <strong>React.js, Node.js, PostgreSQL, Socket.IO, Bootstrap</strong>, and even explored <strong>cloud hosting with Render and Vercel</strong> — just to ensure CrickEdge provides a seamless, real-time, and responsive experience for every cricket fan.
      </p>
      <p>
        🛠️ Every feature — from <strong>match submissions</strong>, <strong>real-time leaderboard updates</strong>, to <strong>dynamic team performance analytics</strong> — is the result of late-night coding sessions, rigorous debugging, and tireless iterations by Ranaj. He poured countless hours into getting the <strong>NRR calculations</strong> right, refining the <strong>UI/UX</strong>, and making the app <strong>mobile-friendly and production-ready</strong> — all while balancing his role as a Senior Consultant and a family man.
      </p>
      <p>
        💚 Ranaj’s journey is a shining example of how <strong>passion meets perseverance</strong>. CrickEdge is his tribute to cricket, clean design, and continuous self-improvement — a dream turned into code.
      </p>
    </div>
  );
};

export default AboutCrickEdge;
