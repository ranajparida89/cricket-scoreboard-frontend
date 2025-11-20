// src/components/SidePhotoWall.js
// Vertical cinematic player-photo wall for left / right edges on Home page

import React, { useEffect, useMemo, useState } from "react";
import "./SidePhotoWall.css";

// 🔁 IMPORTANT:
// Put your actual file names here that you copied into
// public/home-sidewall-photos/
//
// Example: if you have
//   C:\cricket-scoreboard-frontend\public\home-sidewall-photos\SACHIN.jpg
// then add "/home-sidewall-photos/SACHIN.jpg" in this array.
const SIDEWALL_PHOTOS = [
  "/home-sidewall-photos/player1.jpg",
  "/home-sidewall-photos/player2.jpg",
  "/home-sidewall-photos/player3.jpg",
  "/home-sidewall-photos/player4.jpg",
];

const SidePhotoWall = ({ side = "left", intervalMs = 8000 }) => {
  // safety: clean list
  const photos = useMemo(
    () => SIDEWALL_PHOTOS.filter(Boolean),
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Mark mounted to avoid any weird first-paint flicker
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Preload all images for smooth transitions
  useEffect(() => {
    if (!photos.length) return;
    photos.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [photos]);

  // Interval to change photos
  useEffect(() => {
    if (photos.length < 2) return;

    const id = setInterval(() => {
      setCurrentIndex((prev) => {
        if (photos.length < 2) return prev;

        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * photos.length);
        }

        setPreviousIndex(prev);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [photos, intervalMs]);

  if (!photos.length) return null;

  return (
    <div
      className={`sidewall sidewall-${side} ${
        hasMounted ? "sidewall-mounted" : ""
      }`}
    >
      {photos.map((src, idx) => {
        const isActive = idx === currentIndex;
        const isPrev = idx === previousIndex;

        const classes = [
          "sidewall-image-layer",
          isActive ? "active" : "",
          isPrev ? "previous" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={idx}
            className={classes}
            style={{ backgroundImage: `url(${src})` }}
          />
        );
      })}
    </div>
  );
};

export default SidePhotoWall;
