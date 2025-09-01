// src/components/Footer.js
import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ce-footer" role="contentinfo">
      <div className="ce-footer__content">
        <img
          src="/logo/crickedge-footer-logo.png"
          alt="CrickEdge"
          className="ce-footer__logo"
          loading="lazy"
        />

        <div className="ce-footer__copy">
          © {year} <span className="ce-footer__brand">CrickEdge</span>
        </div>
      </div>

      <style>{`
        .ce-footer{
          background: linear-gradient(180deg,#0f1720,#0b1420);
          border-top: 1px solid rgba(255,255,255,.06);
          padding: 16px 12px 18px;
          display: flex;
          justify-content: center;
        }
        .ce-footer__content{
          width: 100%;
          max-width: 960px;
          display: flex;
          flex-direction: column;     /* always stacked & centered */
          align-items: center;
          text-align: center;
          gap: 6px;
        }
        .ce-footer__logo{
          width: 128px;
          max-width: 60vw;
          height: auto;
          filter: drop-shadow(0 0 10px rgba(255,184,0,.35));
        }
        .ce-footer__copy{
          color: #dfe7ef;
          font-size: 0.95rem;
          letter-spacing: .2px;
        }
        .ce-footer__brand{
          color: #ffd86b;
          font-weight: 700;
        }
        @media (max-width: 640px){
          .ce-footer__logo{ width: 96px; }
          .ce-footer__copy{ font-size: 0.9rem; }
        }
      `}</style>
    </footer>
  );
}
