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
          background: transparent;     /* 100% transparent */
          border: 0;
          padding: 8px 12px;           /* slim */
          display: flex;
          justify-content: center;
        }
        .ce-footer__content{
          width: 100%;
          max-width: 960px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }
        .ce-footer__logo{
          width: 110px;
          max-width: 60vw;
          height: auto;
          filter: drop-shadow(0 0 10px rgba(255,184,0,.28));
        }
        .ce-footer__copy{
          color: #e7eef6;
          font-size: .95rem;
          letter-spacing: .2px;
        }
        .ce-footer__brand{
          color: #ffd86b;
          font-weight: 700;
        }
        @media (max-width: 640px){
          .ce-footer__logo{ width: 92px; }
          .ce-footer__copy{ font-size: .9rem; }
          .ce-footer{ padding: 6px 10px; }
        }
      `}</style>
    </footer>
  );
}
