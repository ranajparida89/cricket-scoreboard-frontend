// ✅ DownloadAppButton.js
import React, { useEffect, useState } from "react";

const DownloadAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Prevent auto-popup
      setDeferredPrompt(e); // Save the event
      setIsVisible(true);   // Show the button
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // Show the native install prompt

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("✅ User accepted the install prompt");
    } else {
      console.log("❌ User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="btn btn-success"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1000,
        fontWeight: "bold"
      }}
    >
      📥 Download App
    </button>
  );
};

export default DownloadAppButton;
