// ✅ src/components/ProtectedRoute.js
// ✅ [Ranaj Parida - 22-Apr-2025 | Restrict access for unregistered users]

import React from "react";

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return (
      <div className="container mt-5 text-center text-warning">
        <h4>🚫 Please log in to access this page.</h4>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
