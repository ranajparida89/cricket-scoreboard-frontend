// src/components/SidePhotoWall.js
// Vertical cinematic player-photo wall for left / right edges on Home page

import React, { useEffect, useMemo, useState } from "react";
import "./SidePhotoWall.css";

// We assume files in:
//   public/home-sidewall-photos/01.jpg
//   public/home-sidewall-photos/02.jpg
//   ...
//   public/home-sidewall-photos/33.jpg
//
// If you later add more, just increase 33 to your max number.
const SIDEWALL_PHOTOS = Array.from({ length: 33 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0"); // 1 -> 01, 2 -> 02 ...
  return `/home-sidewall-photos/${num}.jpg`;
});

const SidePhotoWall = ({ side = "left", intervalMs = 8000 }) => {
  const photos = useMemo(() => SIDEWALL_PHOTOS.filter(Boolean), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);

  // avoid first-paint flicker
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
