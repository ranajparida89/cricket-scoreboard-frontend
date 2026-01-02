import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import "./NewYear2026Overlay.css";

const NewYear2026Overlay = ({ onFinish }) => {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const fire = () => {
      confetti({
        particleCount: 180,
        spread: 360,
        startVelocity: 50,
        scalar: 1.3,
        gravity: 0.9,
        ticks: 200,
        origin: {
          x: Math.random(),
          y: Math.random() * 0.5
        }
      });
    };

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        onFinish();
      } else {
        fire();
      }
    }, 280);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="ny2026-overlay">
      <div className="ny-vignette" />

      <div className="ny-glass-card">
        <h1 className="ny-title">🎆 Happy New Year 2026 🎆</h1>
        <p className="ny-subtitle">Welcome to CrickEdge</p>
      </div>
    </div>
  );
};

export default NewYear2026Overlay;
