// src/components/PageWrapper.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

const PageWrapper = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="container mt-4 position-relative">
      {/* ❌ Close Button */}
      <Button
        variant="outline-light"
        size="sm"
        className="position-absolute top-0 end-0 mt-2 me-2"
        onClick={() => navigate("/")}
        title="Close and return to home"
      >
        ❌
      </Button>

      {/* Render the page inside */}
      <div className="mt-4 pt-2">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
