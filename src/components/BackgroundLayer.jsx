// src/components/BackgroundLayer.jsx
import React from "react";
import stadiumJpg from "../assets/images/stadium123.jpg";

/**
 * Fixed background on desktop, scrolls on touch devices to avoid shimmer.
 * No filters or fancy transforms — just a clean, stable bitmap layer.
 */
export default function BackgroundLayer() {
  return (
    <div className="page-bg" aria-hidden="true">
      <img
        className="page-bg__img"
        src={stadiumJpg}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}
