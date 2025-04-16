export const playSound = (type = "click") => {
  let soundPath;

  if (type === "celebration") {
    soundPath = "/sounds/celebration.mp3"; // ✅ NEW: Celebration sound added
  } else if (type === "hover") {
    soundPath = "/sounds/hover_sound.mp3";
  } else {
    soundPath = "/sounds/click_sound.mp3";
  }

  const audio = new Audio(soundPath);
  audio.volume = 0.5;
  audio.play().catch((e) => {
    // Ignore autoplay policy errors
    console.warn("Sound play blocked or failed:", e);
  });
};
