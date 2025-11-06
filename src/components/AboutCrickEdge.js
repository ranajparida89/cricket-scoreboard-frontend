// src/components/AboutCrickEdge.js
import React from "react";
import "./AboutCrickEdge.css";

const AboutCrickEdge = () => {
  return (
    <div className="ce-about-page">
      {/* hero */}
      <section className="ce-about-hero">
        <div className="ce-about-hero-body">
          <span className="ce-pill">About CrickEdge</span>
          <h1>
            A realtime, analytics-first
            <span className="text-accent"> cricket scoreboard platform.</span>
          </h1>
          <p>
            CrickEdge brings match admins, players and fans onto a single,
            clean interface where scoring, leaderboards and performance insights
            stay in sync — across web, mobile and tournaments of any size.
          </p>
        </div>
        <div className="ce-about-hero-panel">
          <div className="ce-stat-card">
            <p className="label">Built for</p>
            <p className="value">T20 · ODI · Test</p>
          </div>
          <div className="ce-stat-card">
            <p className="label">Key focus</p>
            <p className="value">Accuracy in NRR</p>
          </div>
          <div className="ce-stat-card">
            <p className="label">Made by</p>
            <p className="value">Ranaj Parida</p>
          </div>
        </div>
      </section>

      {/* purpose */}
      <section className="ce-about-section">
        <h2>Why CrickEdge exists</h2>
        <p className="lead">
          Most community / local cricket tournaments still juggle Excel sheets,
          WhatsApp scores or half-filled Google Forms. CrickEdge was built to
          make scoring and viewing cricket data feel like using a modern product
          — fast, structured and visually clear.
        </p>
        <div className="ce-purpose-grid">
          <div className="ce-purpose-card">
            <h3>🎯 Clear scoring</h3>
            <p>
              Record overs, wickets, results and match metadata in seconds —
              without needing to remember formulas.
            </p>
          </div>
          <div className="ce-purpose-card">
            <h3>📡 Real-time insights</h3>
            <p>
              Leaderboards and board analytics update instantly, so organizers
              and players always see the current picture.
            </p>
          </div>
          <div className="ce-purpose-card">
            <h3>🌓 Modern dark UI</h3>
            <p>
              The interface is intentionally dark and high-contrast to match
              the rest of the CrickEdge experience.
            </p>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="ce-about-section">
        <h2>What you can do with CrickEdge</h2>
        <div className="ce-feature-grid">
          <div className="ce-feature-card">
            <h4>✅ Real-Time Match Scoreboard</h4>
            <p>
              Submit match details with ease — team scores, overs, wickets and
              final result.
            </p>
          </div>
          <div className="ce-feature-card">
            <h4>📊 Live Leaderboard & NRR</h4>
            <p>
              ICC-style NRR that actually considers all-out scenarios and
              ball-to-decimal conversion.
            </p>
          </div>
          <div className="ce-feature-card">
            <h4>🏆 Match History & Filters</h4>
            <p>
              Find matches by type, teams or winners to study how boards
              perform over time.
            </p>
          </div>
          <div className="ce-feature-card">
            <h4>🌍 Teams Directory</h4>
            <p>
              Per-team stats in real time — wins, losses, format-wise NRR and
              overall consistency.
            </p>
          </div>
          <div className="ce-feature-card">
            <h4>📈 Visual Analytics</h4>
            <p>
              Bar, line and comparative views to show points, win percentages
              and momentum.
            </p>
          </div>
          <div className="ce-feature-card">
            <h4>🧑‍💼 Admin Controls</h4>
            <p>
              Optional panel to toggle submissions or restrict who can update
              match results.
            </p>
          </div>
          <div className="ce-feature-card">
            <h4>💻 Responsive Everywhere</h4>
            <p>
              Optimized for mobile, tablet and desktop so scorers and viewers
              can use it from the ground.
            </p>
          </div>
        </div>
      </section>

      {/* platform highlights */}
      <section className="ce-about-section ce-highlight-strip">
        <div className="ce-highlight-item">
          <p className="title">Built as a full product</p>
          <p className="desc">
            Frontend, backend, database, deployment — all wired to work together.
          </p>
        </div>
        <div className="ce-highlight-item">
          <p className="title">Real tournaments ready</p>
          <p className="desc">
            Handles multiple boards, match types and historical data.
          </p>
        </div>
        <div className="ce-highlight-item">
          <p className="title">Analytics-first</p>
          <p className="desc">
            Scoreboard is step 1 — insights are the actual destination.
          </p>
        </div>
      </section>

      {/* tech stack */}
      <section className="ce-about-section">
        <h2>Tech behind CrickEdge</h2>
        <p className="lead">
          It started as an exploration project and turned into a complete
          cricket platform.
        </p>
        <div className="ce-tech-grid">
          <div className="ce-tech-card">
            <h4>Frontend</h4>
            <p>React.js, modern dark layout, component-based UI.</p>
          </div>
          <div className="ce-tech-card">
            <h4>Backend</h4>
            <p>Node.js / Express with clean routes for boards, matches and analytics.</p>
          </div>
          <div className="ce-tech-card">
            <h4>Database</h4>
            <p>PostgreSQL with match history, test match results and hall-of-fame data.</p>
          </div>
          <div className="ce-tech-card">
            <h4>Real-Time</h4>
            <p>Socket / live style updates for dashboards and scorecards.</p>
          </div>
          <div className="ce-tech-card">
            <h4>Deployments</h4>
            <p>Render / Vercel style hosting for API + UI.</p>
          </div>
        </div>
      </section>

      {/* maker story */}
      <section className="ce-about-section">
        <h2>The maker behind it – Ranaj Parida</h2>
        <p className="lead">
          CrickEdge wasn’t built by a big team. It was built by one curious
          developer with 9+ years of IT experience and a clear idea of what a
          cricket platform should feel like.
        </p>

        <div className="ce-founder-grid">
          <div className="ce-founder-card">
            <h3>👨‍💻 Who</h3>
            <p>
              Ranaj Parida — Senior Consultant, strong in Oracle SQL / PL/SQL
              and backend engineering, decided to build a full stack cricket app
              from scratch.
            </p>
          </div>
          <div className="ce-founder-card">
            <h3>📚 Self-learning journey</h3>
            <p>
              Picked up React, Node.js, PostgreSQL, Socket.IO, Bootstrap and
              cloud deployment in his own time to make CrickEdge production
              ready.
            </p>
          </div>
          <div className="ce-founder-card">
            <h3>🛠️ Craft & effort</h3>
            <p>
              Every feature — match submission, leaderboard refresh, NRR logic,
              responsive layout — was design → code → test by one person, often
              late at night.
            </p>
          </div>
          <div className="ce-founder-card">
            <h3>💚 Motivation</h3>
            <p>
              A mix of love for cricket, clean UI, and proving that a solo
              builder can ship something genuinely useful.
            </p>
          </div>
        </div>

        <div className="ce-timeline">
          <div className="ce-timeline-item">
            <span className="ce-timeline-dot" />
            <div>
              <h4>Idea & base schema</h4>
              <p>
                Started from match tables, player tables and hall-of-fame logic
                to support future analytics.
              </p>
            </div>
          </div>
          <div className="ce-timeline-item">
            <span className="ce-timeline-dot" />
            <div>
              <h4>UI & dark theme</h4>
              <p>
                Built a dark, neon-accent UI so cricket data looks premium even
                on mobile.
              </p>
            </div>
          </div>
          <div className="ce-timeline-item">
            <span className="ce-timeline-dot" />
            <div>
              <h4>Analytics & NRR</h4>
              <p>
                Fine-tuned NRR and board analytics so tournaments can trust the
                numbers they see.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutCrickEdge;
