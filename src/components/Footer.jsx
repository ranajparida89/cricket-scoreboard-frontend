import React from "react";

export default function Footer() {
  return (
    <footer className="crickedge-footer">
      <div className="footer-content">
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
        {/* <div className="footer-slogan">Edge of Every Innings</div> */}
      </div>
      <style>{`
        .crickedge-footer {
          background: #191d24;
          padding: 16px 0 12px 0;    /* much less vertical padding */
          display: flex;
          justify-content: center;
        }
        .footer-content {
          width: 100%;
          max-width: 340px;  /* Makes the whole footer narrow! */
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .footer-logo-wrap {
          display: flex;
          justify-content: center;
        }
        .footer-logo-img {
          width: 120px;
          max-width: 90vw;
          margin-bottom: 7px;
          filter: drop-shadow(0 0 18px #ffb80066);
        }
        .footer-copy {
          font-size: 1.05em;
          font-weight: 500;
          letter-spacing: 1.5px;
          color: #FFD700;
          text-shadow: 0 1px 6px #000a;
        }
        .crickedge-name {
          font-weight: bold;
          color: #ffe066;
          text-shadow: 0 1px 4px #333c;
        }
        @media (max-width: 600px) {
          .footer-logo-img { width: 82px; }
          .footer-content { max-width: 98vw; }
          .footer-copy { font-size: 0.92em; }
        }
      `}</style>
    </footer>
  );
}
