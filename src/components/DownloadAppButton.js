// ✅ DownloadAppButton.js
import React, { useEffect, useState } from "react";

const DownloadAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      console.log("📦 beforeinstallprompt event fired"); // ✅ Debug log
      e.preventDefault(); // Prevent mini-infobar auto popup
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // ✅ Optional: log install event (if user has installed it)
    window.addEventListener("appinstalled", () => {
      console.log("✅ App successfully installed");
      setIsVisible(false); // Hide button after install
    });

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

  // ✅ Only show if eligible and not yet installed
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
