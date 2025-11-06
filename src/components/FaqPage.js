// src/components/FaqPage.js
import React, { useMemo, useState } from "react";
import "./FaqPage.css";

const FaqPage = () => {
  // ===== MASTER FAQ DATA =====
  const faqSections = [
    {
      id: "getting-started",
      category: "Getting Started",
      items: [
        {
          q: "What is CrickEdge?",
          a: "CrickEdge is a real-time cricket scoreboard and analytics web app. It lets organizers record results, teams see standings, and fans explore insights in one place."
        },
        {
          q: "Who is CrickEdge for?",
          a: "For tournament organizers, board admins, captains, players, and fans who want structured cricket data instead of scattered spreadsheets."
        },
        {
          q: "Is CrickEdge free to use?",
          a: "Yes. Viewing is free. Some match / board actions may be restricted to admins so that official data isn’t changed accidentally."
        },
        {
          q: "Do I need an account to view data?",
          a: "No. You sign in only if you submit, manage, or access protected admin panels."
        }
      ]
    },
    {
      id: "match-management",
      category: "Match Management",
      items: [
        {
          q: "How do I submit a new match result?",
          a: "Go to Add Match → select format → pick the two teams → enter runs, wickets, overs and the winner → save. The leaderboard will refresh instantly."
        },
        {
          q: "What match formats are supported?",
          a: "T20, ODI and Test. Each format is calculated separately so you can see performance per format."
        },
        {
          q: "What if a team is all-out early?",
          a: "CrickEdge uses ICC-style NRR logic — the full quota of overs is considered for the team that got all-out early."
        },
        {
          q: "Can I edit or delete a match?",
          a: "Only admins or privileged users can edit / delete, to protect the tournament table."
        }
      ]
    },
    {
      id: "leaderboards",
      category: "Leaderboards & NRR",
      items: [
        {
          q: "How does CrickEdge calculate NRR?",
          a: "NRR = (Total runs scored ÷ overs faced) – (Total runs conceded ÷ overs bowled). Ball parts are converted to decimals, e.g. 19.3 → 19.5."
        },
        {
          q: "How fast are leaderboards updated?",
          a: "Immediately after a valid match is saved."
        },
        {
          q: "What if two teams have the same NRR?",
          a: "Secondary tie-breakers like wins or head-to-head can be considered, depending on the tournament rules."
        },
        {
          q: "Can I view rankings per format?",
          a: "Yes — the Ranking pages let you view ODI, T20 and Test separately."
        }
      ]
    },
    {
      id: "teams-boards",
      category: "Teams & Boards",
      items: [
        {
          q: "What is a Board in CrickEdge?",
          a: "A board is an organizing unit (club / association / tournament owner) that owns teams, matches and analytics."
        },
        {
          q: "Can I create a new board?",
          a: "Yes, if your login has admin rights. This keeps the list of boards clean."
        },
        {
          q: "How many teams can be added to a board?",
          a: "Multiple teams per board are supported — ideal for clubs running multiple squads."
        },
        {
          q: "Can I compare boards?",
          a: "Yes. Board Analytics shows multi-board scorecards, charts and crown timeline."
        }
      ]
    },
    {
      id: "player-analytics",
      category: "Player Analytics",
      items: [
        {
          q: "How are player ratings stored?",
          a: "Each match contributes to batting, bowling and all-round buckets. CrickEdge then aggregates these to show total rating."
        },
        {
          q: "What is an All-Round Performer?",
          a: "A player whose combined score (batting + bowling + all-rounder) is the highest for that skill group / period. These are shown in highlights."
        },
        {
          q: "Can I see which team a player belongs to?",
          a: "Yes. Player records keep team and board mapping so you always know the source team."
        }
      ]
    },
    {
      id: "install-access",
      category: "Installation & Access",
      items: [
        {
          q: "Can I install CrickEdge like an app?",
          a: "Yes. It's a PWA — click Get App (desktop) or use Add to Home Screen (mobile)."
        },
        {
          q: "Do I get updates automatically?",
          a: "Yes. When a new build is pushed you may see an update prompt; click Update to reload with the latest features."
        },
        {
          q: "What browsers are supported?",
          a: "Latest Chrome, Edge and Firefox are recommended. Safari works, though install prompts can look different."
        }
      ]
    },
    {
      id: "technical",
      category: "Technical & Data",
      items: [
        {
          q: "What tech does CrickEdge use?",
          a: "React for the UI, Node/Express for APIs, PostgreSQL for data, deployed on modern cloud hosting."
        },
        {
          q: "Is data secure?",
          a: "Admin-only actions are hidden for normal users. Mutating operations are validated server-side."
        },
        {
          q: "Is it real-time?",
          a: "Yes — dashboards and analytics pull fresh data right after submission."
        }
      ]
    },
    {
      id: "support",
      category: "Developer & Support",
      items: [
        {
          q: "Who built CrickEdge?",
          a: "CrickEdge was built end-to-end by Ranaj Parida."
        },
        {
          q: "How can I report a problem?",
          a: "Use the Contact / Feedback page and include: format, teams, date and what went wrong."
        },
        {
          q: "Can I request features?",
          a: "Yes. Suggestions around tournament automation, AI insights and mobile friendliness are welcome."
        }
      ]
    }
  ];

  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState("");
  const [openKey, setOpenKey] = useState(null);
  const [activeSection, setActiveSection] = useState(faqSections[0].id);

  // ===== FILTERING =====
  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return faqSections;
    return faqSections
      .map((section) => {
        const filteredItems = section.items.filter(
          (item) =>
            item.q.toLowerCase().includes(term) ||
            item.a.toLowerCase().includes(term)
        );
        if (!filteredItems.length) return null;
        return { ...section, items: filteredItems };
      })
      .filter(Boolean);
  }, [searchTerm, faqSections]);

  const handleToggle = (key) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="ce-faq-shell">
      {/* sidebar */}
      <aside className="ce-faq-sidebar">
        <div className="ce-faq-sidebar-title">FAQ Sections</div>
        <ul>
          {faqSections.map((s) => (
            <li
              key={s.id}
              className={s.id === activeSection ? "active" : ""}
              onClick={() => {
                setActiveSection(s.id);
                setOpenKey(null);
                setSearchTerm("");
              }}
            >
              {s.category}
            </li>
          ))}
        </ul>
      </aside>

      {/* main panel */}
      <main className="ce-faq-page">
        <div className="ce-faq-header">
          <div className="ce-faq-pill">❓ FAQ</div>
          <h1>CrickEdge Help Center</h1>
          <p>
            Everything about matches, boards, leaderboards, NRR, installation
            and admin access — in one place.
          </p>
          <div className="faq-search-wrap">
            <input
              type="text"
              placeholder="Search in FAQ… (e.g. NRR, match edit, install, board)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="faq-search-input"
            />
          </div>
        </div>

        {/* list of sections (filtered) */}
        {filteredSections.map((section, sIdx) => (
          <section
            key={section.id}
            className={`faq-section-block ${
              searchTerm ? "expanded" : section.id === activeSection ? "show" : "hide"
            }`}
          >
            <h2 className="faq-section-title">
              <span className="bar" />
              {sIdx + 1}. {section.category}
            </h2>

            <div className="faq-grid">
              {section.items.map((item, iIdx) => {
                const key = `${section.id}-${iIdx}`;
                const isOpen = openKey === key;
                return (
                  <div key={key} className={`faq-item ${isOpen ? "open" : ""}`}>
                    <button
                      type="button"
                      className="faq-trigger"
                      onClick={() => handleToggle(key)}
                    >
                      <span className="faq-icon" aria-hidden="true">
                        {isOpen ? "−" : "+"}
                      </span>
                      <span className="faq-question">{item.q}</span>
                    </button>
                    <div
                      className="faq-answer-wrap"
                      style={{ maxHeight: isOpen ? "400px" : "0px" }}
                    >
                      <p className="faq-answer">{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filteredSections.length === 0 && (
          <p className="no-results">
            No FAQ matched your search. Try a broader word like “match” or
            “leaderboard”.
          </p>
        )}
      </main>
    </div>
  );
};

export default FaqPage;
