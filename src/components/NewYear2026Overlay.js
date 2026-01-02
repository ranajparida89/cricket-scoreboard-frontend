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

    // 🎆 Fireworks from text center (minimal & classy)
    const rect = textRef.current?.getBoundingClientRect();
    const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
    const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.45;

    const fire = () => {
      confetti({
        particleCount: 70,
        spread: 300,
        startVelocity: 42,
        scalar: 1.15,
        gravity: 0.9,
        ticks: 170,
        origin: { x, y }
      });
    };

    fire();
    const interval = setInterval(fire, 900);

    const endTimer = setTimeout(() => {
      clearInterval(interval);
      onFinish();
    }, 9000);

    return () => {
      clearInterval(interval);
      clearTimeout(endTimer);
    };
  }, [onFinish, isNewYear]);

  return (
    <div className="ny-overlay">
      <div className="ny-vignette" />

      <div className="ny-text-wrap" ref={textRef}>
        {isNewYear ? (
          <>
            <h1 className="ny-title ny-brand-sweep">
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
            <h1 className="ny-title single ny-brand-sweep">
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
