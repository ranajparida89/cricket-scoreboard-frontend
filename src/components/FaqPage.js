// src/components/FaqPage.js
import React, { useMemo, useState } from "react";
import "./FaqPage.css";

const FaqPage = () => {
  // ===== MASTER FAQ DATA =====
  const faqSections = [
    {
      category: "1. Getting Started",
      items: [
        {
          q: "What is CrickEdge?",
          a: "CrickEdge is a real-time cricket analytics and scoreboard platform. It lets organizers record results, teams view standings and fans explore insights — all in a modern web experience."
        },
        {
          q: "Who is CrickEdge for?",
          a: "For tournament organizers, board admins, team captains, players and fans who want structured cricket data instead of scattered sheets."
        },
        {
          q: "Is CrickEdge free to use?",
          a: "Yes. Viewing data and analytics is free. Some write actions may be restricted to admins for safety."
        },
        {
          q: "Do I need an account to view data?",
          a: "No. You only need an account if you submit or manage matches/boards."
        }
      ]
    },
    {
      category: "2. Match Management",
      items: [
        {
          q: "How do I submit a new match result?",
          a: "Go to the match submission page, pick the format, select both teams, enter runs/wickets/overs/winner and save. CrickEdge will recalc leaderboards instantly."
        },
        {
          q: "What match formats are supported?",
          a: "T20 (20 overs), ODI (50 overs) and Test. Each is handled separately in analytics."
        },
        {
          q: "What if a team is all-out early?",
          a: "CrickEdge applies ICC-style logic — the full quota of overs for that format is considered for NRR."
        },
        {
          q: "Can I edit or delete a match?",
          a: "Only admins or privileged users can edit/delete, to avoid tampering with official results."
        }
      ]
    },
    {
      category: "3. Leaderboards & NRR",
      items: [
        {
          q: "How does CrickEdge calculate NRR?",
          a: "NRR = (Total Runs Scored ÷ Overs Faced) – (Total Runs Conceded ÷ Overs Bowled). Overs with balls are converted to decimal (19.3 → 19.5)."
        },
        {
          q: "How fast are leaderboards updated?",
          a: "Immediately after a valid match result is saved."
        },
        {
          q: "What if two teams have the same NRR?",
          a: "Secondary tie-breakers like wins or head-to-head can be applied — this keeps tables fair."
        },
        {
          q: "Can I view rankings per format?",
          a: "Yes — ODI, T20 and Test can be viewed separately."
        }
      ]
    },
    {
      category: "4. Teams & Boards",
      items: [
        {
          q: "What is a Board in CrickEdge?",
          a: "A board is an organizing unit (club, association, tournament owner) with its own teams, matches and analytics."
        },
        {
          q: "Can I create a new board?",
          a: "Yes, if your account has admin permission. This is to keep the structure tidy."
        },
        {
          q: "How many teams can be added to a board?",
          a: "There’s no strict limit — multiple teams per board are supported."
        },
        {
          q: "Can I compare boards?",
          a: "Yes. Board Analytics shows multi-board comparisons with charts and leadership timeline."
        }
      ]
    },
    {
      category: "5. Player Analytics",
      items: [
        {
          q: "How are player ratings stored?",
          a: "Every match updates batting, bowling and all-round components for the player, and CrickEdge aggregates them."
        },
        {
          q: "What is an All Round Performer?",
          a: "The player whose combined rating (batting + bowling + all-rounder) is the best inside that category/time. These are highlighted on the homepage."
        },
        {
          q: "Can I see which team a player belongs to?",
          a: "Yes — player records keep team and board mapping."
        }
      ]
    },
    {
      category: "6. Installation & Access",
      items: [
        {
          q: "Can I install CrickEdge like an app?",
          a: "Yes. CrickEdge is a PWA — install from browser (desktop) or 'Add to home screen' (mobile)."
        },
        {
          q: "Do I get updates automatically?",
          a: "Yes. When a new build is deployed, you may see a refresh prompt — click it to load the latest UI."
        },
        {
          q: "What browsers are supported?",
          a: "Latest Chrome, Edge and Firefox give the best experience. Safari works too but install prompts may differ."
        }
      ]
    },
    {
      category: "7. Technical & Data",
      items: [
        {
          q: "What stack does CrickEdge use?",
          a: "React (frontend), Node/Express (backend), PostgreSQL (database), hosted on modern cloud platforms."
        },
        {
          q: "Is data secure?",
          a: "Write operations are authenticated and admin-only actions are hidden for normal users."
        },
        {
          q: "Is it real-time?",
          a: "Yes — once you submit a match, leaderboards and analytics pull the latest numbers."
        }
      ]
    },
    {
      category: "8. Developer & Support",
      items: [
        {
          q: "Who built CrickEdge?",
          a: "CrickEdge was built end-to-end by Ranaj Parida."
        },
        {
          q: "How can I report a problem?",
          a: "Use the in-app feedback/contact path (if enabled) or reach out to the site owner with match, teams and date."
        },
        {
          q: "Can I request features?",
          a: "Yes — feature suggestions are welcome, especially around tournament automation and AI insights."
        }
      ]
    }
  ];

  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState("");
  const [openMap, setOpenMap] = useState({}); // { "sectionIndex-itemIndex": true }

  // ===== FILTERED VIEW =====
  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return faqSections;
    return faqSections
      .map((section) => {
        const filteredItems = section.items.filter((item) => {
          return (
            item.q.toLowerCase().includes(term) ||
            item.a.toLowerCase().includes(term)
          );
        });
        if (filteredItems.length === 0) return null;
        return { ...section, items: filteredItems };
      })
      .filter(Boolean);
  }, [searchTerm, faqSections]);

  // ===== HANDLERS =====
  const handleToggle = (key) => {
    setOpenMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="ce-faq-page">
      <h1>❓ CrickEdge FAQ</h1>
      <p className="intro">
        Find answers about scoring, boards, player analytics, NRR and how to
        use CrickEdge if you’re an organizer or a first-time visitor.
      </p>

      {/* search bar */}
      <div className="faq-search-wrap">
        <input
          type="text"
          placeholder="Search in FAQ… (try: NRR, match edit, install, board)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="faq-search-input"
        />
      </div>

      {filteredSections.length === 0 ? (
        <p className="no-results">
          No FAQ matched your search. Try a different keyword.
        </p>
      ) : (
        filteredSections.map((section, sIdx) => (
          <div key={section.category} className="faq-section">
            <h2>{section.category}</h2>
            {section.items.map((item, iIdx) => {
              const key = `${sIdx}-${iIdx}`;
              const isOpen = !!openMap[key];
              return (
                <div key={key} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="faq-trigger"
                    onClick={() => handleToggle(key)}
                  >
                    <span className="faq-icon" aria-hidden="true">
                      {isOpen ? "➖" : "➕"}
                    </span>
                    <span className="faq-question">{item.q}</span>
                  </button>
                  {isOpen && <p className="faq-answer">{item.a}</p>}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};

export default FaqPage;
