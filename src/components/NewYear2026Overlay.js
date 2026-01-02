import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import "./NewYear2026Overlay.css";

const isJanuary2026 = () => {
  const d = new Date();
  return d.getFullYear() === 2026 && d.getMonth() === 0;
};

const NewYear2026Overlay = ({ onFinish }) => {
  const isNewYear = isJanuary2026();

  useEffect(() => {
    if (!isNewYear) {
      const timer = setTimeout(onFinish, 3500);
      return () => clearTimeout(timer);
    }

    const duration = 3500;
    const end = Date.now() + duration;

    const fire = () => {
      confetti({
        particleCount: 120,
        spread: 360,
        startVelocity: 55,
        scalar: 1.25,
        gravity: 0.9,
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
    }, 320);

    return () => clearInterval(interval);
  }, [onFinish, isNewYear]);

  return (
    <div className={`ny-overlay ${isNewYear ? "ny-newyear" : "ny-normal"}`}>
      <div className="ny-vignette" />

      <div className="ny-text-wrap">
        {isNewYear ? (
          <>
            <h1 className="ny-title">
              <span style={{ "--d": 0 }}>Happy</span>
              <span style={{ "--d": 1 }}>New</span>
              <span style={{ "--d": 2 }}>Year</span>
              <span style={{ "--d": 3 }} className="year">2026</span>
            </h1>
            <p className="ny-subtitle ny-golden">
              Welcome to CrickEdge
            </p>
          </>
        ) : (
          <>
            <h1 className="ny-title single">
              Welcome to <span className="brand">CrickEdge</span>
            </h1>
            <p className="ny-subtitle">
              Edge of Every Inning
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default NewYear2026Overlay;
