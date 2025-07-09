// src/components/Footer.jsx

import React from "react";

export default function Footer() {
  return (
    <footer className="crickedge-footer">
      <div className="footer-logo-wrap">
        <img
          src="/logo/crickedge-footer-logo.png"
          alt="CrickEdge Logo"
          className="footer-logo-img"
        />
      </div>
      <div className="footer-copy">
        © 2025 <span className="crickedge-name">CrickEdge</span>
      </div>
      {/* Optional: slogan */}
      {/* <div className="footer-slogan">Edge of Every Innings</div> */}
      <style>{`
        .crickedge-footer {
          width: 100vw;
          background: #191d24;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 0 16px 0;
          color: #fafafa;
          font-family: 'Montserrat', 'Roboto', Arial, sans-serif;
          position: relative;
        }
        .footer-logo-wrap {
          display: flex;
          justify-content: center;
        }
        .footer-logo-img {
          width: 210px;
          max-width: 85vw;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 30px #ffb80066);
        }
        .footer-copy {
          font-size: 1.15em;
          font-weight: 500;
          letter-spacing: 1.5px;
          color: #FFD700;
          text-shadow: 0 1px 6px #000a;
          margin-bottom: 0.5em;
        }
        .crickedge-name {
          font-weight: bold;
          color: #ffe066;
          text-shadow: 0 1px 4px #333c;
        }
        @media (max-width: 600px) {
          .footer-logo-img { width: 150px; }
          .footer-copy { font-size: 0.98em; }
        }
      `}</style>
    </footer>
  );
}
