import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import "./NewYear2026Overlay.css";

const NewYear2026Overlay = ({ onFinish }) => {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const fire = () => {
      confetti({
        particleCount: 160,
        spread: 360,
        startVelocity: 55,
        scalar: 1.4,
        gravity: 0.95,
        ticks: 220,
        origin: {
          x: Math.random(),
          y: Math.random() * 0.45
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
    }, 260);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="ny2026-overlay">
      <div className="ny-vignette" />

      <div className="ny-text-wrap">
        <h1 className="ny-title">
          <span>Happy</span>
          <span>New</span>
          <span>Year</span>
          <span className="year">2026</span>
        </h1>

        <p className="ny-subtitle">Welcome to CrickEdge</p>
      </div>
    </div>
  );
};

export default NewYear2026Overlay;
