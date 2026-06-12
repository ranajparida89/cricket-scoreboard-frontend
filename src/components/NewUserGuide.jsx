// src/components/NewUserGuide.jsx

import React, { useState } from "react";
import "./NewUserGuide.css";
import step1Img from "../assets/onboarding-step1.png";

export default function NewUserGuide() {
  const [completedSteps, setCompletedSteps] = useState([]);

  const toggleStep = (step) => {
    setCompletedSteps((prev) =>
      prev.includes(step)
        ? prev.filter((s) => s !== step)
        : [...prev, step]
    );
  };

  const progress = (completedSteps.length / 6) * 100;

  return (
    <div className="new-user-guide-page">
      <section className="nug-hero">
        <div>
          <p className="nug-tag">CrickEdge Onboarding</p>
          <h1>🏏 New User Guide</h1>
          <p>
            Follow these 6 simple steps to create your account, register your board,
            setup your team and become tournament ready.
          </p>
        </div>

        <div className="nug-progress-card">
          <span>{completedSteps.length}/6 Completed</span>
          <div className="nug-progress-bar">
            <div
              className="nug-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <div className="nug-step-list">
        <StepCard
          step={1}
          title="Create User in CrickEdge"
          completedSteps={completedSteps}
          toggleStep={toggleStep}
        >
          <img src={step1Img} alt="Create user in CrickEdge" className="nug-step-img" />

          <p>
            Visit <b>crickedge.in</b> and click on <b>Sign In / Create User</b>.
          </p>

          <ul>
            <li>Provide a valid email ID.</li>
            <li>An OTP will be sent to verify your email.</li>
            <li>After verification, use the same email ID to login.</li>
          </ul>

          <div className="nug-note">
            💡 Use a valid email ID because your CrickEdge activity will be linked with it.
          </div>
        </StepCard>

        <StepCard
          step={2}
          title="Provide Board Name and Team Name"
          completedSteps={completedSteps}
          toggleStep={toggleStep}
        >
          <div className="nug-two-grid">
            <div className="nug-mini-card">
              <h4>Board Name Examples</h4>
              <p>DCC, KCC, VCL, NCC</p>
            </div>

            <div className="nug-mini-card">
              <h4>Team Name Examples</h4>
              <p>Death Storm Dominators, Power XI</p>
            </div>
          </div>

          <div className="nug-note">
            Objective: Your Board name will carry your Team name and track Wins,
            Losses, Championships, Rankings and overall progress.
          </div>
        </StepCard>

        <StepCard
          step={3}
          title="Admin Creates Board and Team"
          completedSteps={completedSteps}
          toggleStep={toggleStep}
        >
          <div className="nug-flow">
            <span>You provide details</span>
            <b>→</b>
            <span>Admin verifies</span>
            <b>→</b>
            <span>Board created</span>
            <b>→</b>
            <span>Team created</span>
          </div>
        </StepCard>

        <StepCard
          step={4}
          title="Admin Provides Team / Auction Players"
          completedSteps={completedSteps}
          toggleStep={toggleStep}
        >
          <ul>
            <li>Once Board and Team are created, Admin will provide your team.</li>
            <li>If players are not assigned, you can buy players from Auction.</li>
            <li>Each team will consist of <b>14 players</b>, similar to IPL style squad.</li>
          </ul>

          <div className="nug-badge">🏏 14 Players Squad</div>
        </StepCard>

        <StepCard
          step={5}
          title="Edit Player Skills as per Rules"
          completedSteps={completedSteps}
          toggleStep={toggleStep}
        >
          <div className="nug-skill-grid">
            <div>Batsman <b>99</b></div>
            <div>Allrounder <b>92</b></div>
            <div>Licensed Bowler <b>83</b></div>
            <div>Non Licensed Bowler <b>75</b></div>
          </div>

          <div className="nug-note">
            Player skills must be updated exactly as mentioned in CrickEdge rules.
          </div>
        </StepCard>

        <StepCard
          step={6}
          title="Send Playing XI Screenshot for Approval"
          completedSteps={completedSteps}
          toggleStep={toggleStep}
        >
          <ul>
            <li>After editing player skills, prepare your Playing XI.</li>
            <li>Send screenshots of all Playing XI players to Admin.</li>
            <li>If all skills are correct, Admin will approve.</li>
            <li>If anything is incorrect, Admin may reject and ask for correction.</li>
          </ul>

          <div className="nug-approval-grid">
            <div className="nug-approved">✅ Approved</div>
            <div className="nug-rejected">❌ Rejected</div>
          </div>
        </StepCard>
      </div>

      <section className="nug-rules-card">
        <h2>📜 Rules & Regulations</h2>
        <p>
          Before playing any tournament, every user must go through the official
          CrickEdge rules page.
        </p>

        <a href="/rules-and-regulations">View Rules & Regulations</a>
      </section>
    </div>
  );
}

function StepCard({ step, title, children, completedSteps, toggleStep }) {
  const isDone = completedSteps.includes(step);

  return (
    <section className={`nug-card ${isDone ? "done" : ""}`}>
      <div className="nug-card-head">
        <div>
          <span className="nug-step-no">STEP {step}</span>
          <h2>{title}</h2>
        </div>

        <button onClick={() => toggleStep(step)}>
          {isDone ? "✅ Done" : "Mark Done"}
        </button>
      </div>

      <div className="nug-card-body">{children}</div>
    </section>
  );
}