// ✅ CrickEdge Season Admin Control Panel
// ✅ STEP 7 – Season Module
// ✅ Admin Only Page

import React, { useEffect, useState } from "react";
import "./CrickedgeSeasonAdmin.css";

const API_URL =
  "https://cricket-scoreboard-backend.onrender.com/api/crickedge-season";

const CrickedgeSeasonAdmin = () => {

  // ===== STATE =====

  const [seasonName, setSeasonName] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [matchType, setMatchType] = useState("ALL");

  const [activeSeason, setActiveSeason] = useState(null);
  const [allSeasons, setAllSeasons] = useState([]);

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // ===== LOAD DATA =====

  const loadSeasonData = async () => {

    try {

      const activeRes =
        await fetch(API_URL + "/active");

      const activeJson =
        await activeRes.json();

      setActiveSeason(activeJson);

      const allRes =
        await fetch(API_URL + "/all");

      const allJson =
        await allRes.json();

      setAllSeasons(allJson);

    }
    catch (err) {

      console.log("Season Load Error", err);

    }

  };

  useEffect(() => {

    loadSeasonData();

  }, []);

  // ===== CREATE SEASON =====

  const handleCreateSeason = async () => {

    if (!seasonName || !tournamentName) {
      alert("Enter Season Name and Tournament");
      return;
    }

    try {

      await fetch(API_URL + "/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          season_name: seasonName,
          tournament_name: tournamentName,
          match_type: matchType
        })
      });

      alert("Season Created");

      setSeasonName("");
      setTournamentName("");

      loadSeasonData();

    }
    catch {

      alert("Season Creation Failed");

    }

  };

  // ===== DELETE SEASON =====

  const handleDeleteSeason = async (id) => {

    if (!window.confirm("Delete Season?"))
      return;

    await fetch(API_URL + "/delete/" + id, {
      method: "DELETE"
    });

    loadSeasonData();

  };

  // ===== ADMIN PROTECTION =====

  if (!isAdmin) {

    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Admin Access Only
      </div>
    );

  }

  // ===== UI =====

  return (

    <div className="seasonAdminContainer">

      <h2>🏆 CrickEdge Season Control Panel</h2>

      {/* ===== CREATE SEASON ===== */}

      <div className="seasonBox">

        <h3>Create CrickEdge Season</h3>

        <div className="formRow">

          <label>Season Name</label>

          <input
            value={seasonName}
            onChange={(e) =>
              setSeasonName(e.target.value)
            }
            placeholder="Crickedge Season S01"
          />

        </div>

        <div className="formRow">

          <label>Tournament Name</label>

          <input
            value={tournamentName}
            onChange={(e) =>
              setTournamentName(e.target.value)
            }
            placeholder="Champions Trophy"
          />

        </div>

        <div className="formRow">

          <label>Match Type</label>

          <select
            value={matchType}
            onChange={(e) =>
              setMatchType(e.target.value)
            }
          >
            <option value="ALL">ALL</option>
            <option value="ODI">ODI</option>
            <option value="T20">T20</option>
            <option value="Test">Test</option>

          </select>

        </div>
        <div className="buttonRow">

          <button
            className="createBtn"
            onClick={handleCreateSeason}
          >
            Create Season
          </button>

          <button
            className="cancelBtn"
            onClick={() => {

              setSeasonName("");
              setTournamentName("");

            }}
          >
            Cancel
          </button>

        </div>

      </div>
      {/* ===== ACTIVE SEASON ===== */}

      <div className="seasonBox">

        <h3>Active Season</h3>

        {

          activeSeason ?

            <div className="activeBox">

              <div>
                Season:
                <b> {activeSeason.season_name}</b>
              </div>

              <div>
                Tournament:
                {activeSeason.tournament_name}
              </div>

              <div>
                Match Type:
                {activeSeason.match_type}
              </div>

              <div>
                Start Date:
                {activeSeason.start_date}
              </div>

            </div>

            :

            <div>No Active Season</div>
        }

      </div>

      {/* ===== SEASON HISTORY ===== */}

      <div className="seasonBox">

        <h3>Season History</h3>

        <table className="historyTable">

          <thead>

            <tr>
              <th>Season</th>
              <th>Tournament</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>


          <tbody>

            {

              allSeasons.map((s) => (

                <tr key={s.id}>

                  <td>{s.season_name}</td>

                  <td>{s.tournament_name}</td>

                  <td>{s.status}</td>

                  <td>

                    <button
                      className="deleteBtn"
                      onClick={() =>
                        handleDeleteSeason(s.id)
                      }
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default CrickedgeSeasonAdmin;