import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import "./NewYear2026Overlay.css";

const isJanuary2026 = () => {
  const d = new Date();
  return d.getFullYear() === 2026 && d.getMonth() === 0;
};

const NewYear2026Overlay = ({ onFinish }) => {
  const isNewYear = isJanuary2026();
  const textRef = useRef(null);

  useEffect(() => {
    if (!isNewYear) {
      const timer = setTimeout(onFinish, 4500);
      return () => clearTimeout(timer);
    }

    /* 🎆 Fireworks from text center */
    const rect = textRef.current?.getBoundingClientRect();
    const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
    const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.45;

    const fire = () => {
      confetti({
        particleCount: 80,
        spread: 360,
        startVelocity: 45,
        scalar: 1.2,
        gravity: 0.9,
        ticks: 180,
        origin: { x, y }
      });
    };

    fire();
    const interval = setInterval(fire, 700);

    /* Full lifecycle end */
    const endTimer = setTimeout(() => {
      clearInterval(interval);
      onFinish();
    }, 8500);

    return () => {
      clearInterval(interval);
      clearTimeout(endTimer);
    };
  }, [onFinish, isNewYear]);

  return (
    <div className={`ny-overlay ${isNewYear ? "ny-newyear" : "ny-normal"}`}>
      <div className="ny-vignette" />

      <div className="ny-text-wrap" ref={textRef}>
        {isNewYear ? (
          <>
            <h1 className="ny-title">
              <span style={{ "--i": 0 }}>Happy</span>
              <span style={{ "--i": 1 }}>New</span>
              <span style={{ "--i": 2 }}>Year</span>
              <span style={{ "--i": 3 }} className="year">2026</span>
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
