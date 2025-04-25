import React from "react";
import SidebarMenu from "./SidebarMenu";
import "./SidebarMenu.css";

const PlayerRouteWrapper = ({ children }) => {
  return (
    <div className="d-flex">
      <SidebarMenu /> {/* ✅ Sidebar you already made */}
      <div style={{ marginLeft: "220px", padding: "20px", width: "100%" }}>
        {children} {/* Player-specific content like AddPlayers etc */}
      </div>
    </div>
  );
};

export default PlayerRouteWrapper;
