import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import "./NewYear2026Overlay.css";

const NewYear2026Overlay = ({ onFinish }) => {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const fire = () => {
      confetti({
        particleCount: 150,
        spread: 360,
        startVelocity: 45,
        scalar: 1.2,
        origin: {
          x: Math.random(),
          y: Math.random() * 0.6
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
    }, 300);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="ny2026-overlay">
      <div className="ny2026-text">
        🎆 Happy New Year 2026 🎆
        <span>Welcome to CrickEdge</span>
      </div>
    </div>
  );
};

export default NewYear2026Overlay;
