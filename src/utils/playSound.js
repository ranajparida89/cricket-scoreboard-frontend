// ✅ [Ranaj Parida | 16-April-2025] playSound utility for click and hover

export const playSound = (type = "click") => {
    const soundPath = type === "hover" ? "/sounds/hover_sound.mp3" : "/sounds/click_sound.mp3";
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch((e) => {
      // Ignore autoplay policy errors
      console.warn("Sound play blocked or failed:", e);
    });
  };
  