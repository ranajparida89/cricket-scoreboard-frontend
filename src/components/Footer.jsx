import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="crickedge-footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-logo-wrap">
          <img
            src="/logo/crickedge-footer-logo.png"
            alt="CrickEdge"
            className="footer-logo-img"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="footer-copy">
          © {year} <span className="crickedge-name">CrickEdge</span> · All rights reserved.
        </div>
      </div>

      <style>{`
        /* Wrapper */
        .crickedge-footer{
          background: linear-gradient(180deg, #0f1722, #0b1320);
          border-top: 1px solid rgba(255,255,255,.06);
          padding: 14px 0;                 /* comfortable but compact */
          display: flex;
          justify-content: center;
          width: 100%;
        }

        /* Responsive container (desktop: row, mobile: column) */
        .footer-content{
          width: 100%;
          max-width: 1200px;                /* full-width container feel */
          padding: 0 16px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;   /* row on desktop */
          gap: 12px;
          text-align: left;
        }

        .footer-logo-wrap{
          display: flex;
          align-items: center;
        }

        .footer-logo-img{
          width: 120px;
          height: auto;
          filter: drop-shadow(0 0 10px rgba(255,184,0,.35));
        }

        .footer-copy{
          color: #eaf2ff;
          font-size: 0.95rem;
          letter-spacing: .4px;
          opacity: .95;
        }

        .crickedge-name{
          font-weight: 800;
          color: #ffe38f;
          text-shadow: 0 1px 4px rgba(0,0,0,.25);
        }

        /* Mobile/tables: stack vertically & center */
        @media (max-width: 768px){
          .footer-content{
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 8px;
          }
          .footer-logo-img{ width: 92px; }
          .footer-copy{ font-size: 0.9rem; }
        }

        /* Very small phones */
        @media (max-width: 380px){
          .footer-logo-img{ width: 84px; }
          .footer-copy{ font-size: 0.88rem; }
        }
      `}</style>
    </footer>
  );
}
