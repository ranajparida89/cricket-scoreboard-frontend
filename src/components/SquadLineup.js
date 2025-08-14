// src/components/SquadLineup.js
// CrickEdge — Team-wise Squads + Drag-and-drop Lineup builder (Pro)
// - Unlimited squad, 11 (max 12) in lineup
// - Per-format duplicate allowed across formats; not allowed inside same lineup
// - Captain / Vice-Captain enforce 1 each
// - Suggestions + validation + toasts
// - Clean UI + sticky save bar

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "react-beautiful-dnd";
import "./SquadLineup.css";

/* ---------- Config ---------- */
const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";
// If your real endpoints differ, just adjust these helpers.
const api = {
  // players by team+format
  fetchPlayers: (team, format) =>
    axios
      .get(`${API_BASE}/players`, { params: { team_name: team, lineup_type: format } })
      .then((r) => r.data || []),

  // create player row in players (a Squad member)
  createPlayer: (payload) =>
    axios.post(`${API_BASE}/players`, payload).then((r) => r.data),

  updatePlayer: (id, payload) =>
    axios.put(`${API_BASE}/players/${id}`, payload).then((r) => r.data),

  deletePlayer: (id) =>
    axios.delete(`${API_BASE}/players/${id}`),

  // lineup get/save
  getLineup: (team, format) =>
    axios
      .get(`${API_BASE}/lineup`, { params: { team_name: team, lineup_type: format } })
      .then((r) => r.data || { lineup: [], captain_id: null, vice_id: null }),

  saveLineup: (payload) =>
    axios.post(`${API_BASE}/lineup`, payload).then((r) => r.data),

  // suggestions: by partial name inside current team across formats
  suggest: (team, q) =>
    axios
      .get(`${API_BASE}/players/suggest`, { params: { team_name: team, q } })
      .then((r) => r.data || []),
};

const FORMATS = ["ODI", "T20", "TEST"];
const DEFAULT_TEAMS = ["India", "Australia", "England", "New Zealand", "Pakistan", "South Africa", "Sri Lanka", "Bangladesh", "Afghanistan"];

const MAX_LINEUP = 12;
const MIN_LINEUP = 11;

const ci = (s) => (s || "").trim().toLowerCase();
const ciEq = (a, b) => ci(a) === ci(b);

/* ---------- tiny toast ---------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (message, type = "info", ttl = 2600) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), ttl);
  };
  return { toasts, push, close: (id) => setToasts((p) => p.filter((t) => t.id !== id)) };
}
const Toasts = ({ list, onClose }) => (
  <div className="sq-toasts">
    {list.map((t) => (
      <div key={t.id} className={`sq-toast ${t.type}`} onClick={() => onClose(t.id)}>
        {t.message}
      </div>
    ))}
  </div>
);

/* ---------- Component ---------- */
export default function SquadLineup({ isAdmin = true }) {
  /* team/format */
  const [teams, setTeams] = useState(DEFAULT_TEAMS);
  const [team, setTeam] = useState("India");
  const [format, setFormat] = useState("ODI");

  /* server data */
  const [squad, setSquad] = useState([]);         // players[] for this team+format
  const [lineup, setLineup] = useState([]);       // [{player_id, order_no, is_twelfth, obj}]
  const [captainId, setCaptainId] = useState(null);
  const [viceId, setViceId] = useState(null);

  /* UI state */
  const [search, setSearch] = useState("");
  const [addName, setAddName] = useState("");
  const [role, setRole] = useState("Batsman");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingKind, setBowlingKind] = useState("");
  const [bowlingArm, setBowlingArm] = useState("");
  const [paceType, setPaceType] = useState("");
  const [spinType, setSpinType] = useState("");
  const [addNote, setAddNote] = useState("");     // server message when duplicate 23505, etc.
  const [suggests, setSuggests] = useState([]);

  const { toasts, push, close } = useToasts();

  /* helpers */
  const buildBowlingType = () => {
    if (!bowlingKind) return "";
    const arm = bowlingArm ? `${bowlingArm} ` : "";
    if (bowlingKind === "Pace" && paceType) return `${arm}${paceType}`.trim();
    if (bowlingKind === "Spin" && spinType) return `${arm}${spinType}`.trim();
    return "";
  };

  /* load squad + lineup when team/format change */
  useEffect(() => {
    (async () => {
      try {
        const [s, L] = await Promise.all([api.fetchPlayers(team, format), api.getLineup(team, format)]);
        setSquad(s || []);
        const items = (L.lineup || []).map((it, i) => ({
          player_id: it.player_id,
          order_no: it.order_no ?? i + 1,
          is_twelfth: !!it.is_twelfth,
          obj: {
            id: it.player_id,
            player_name: it.player_name,
            team_name: team,
            lineup_type: format,
            skill_type: it.skill_type,
            batting_style: it.batting_style,
            bowling_type: it.bowling_type,
            profile_url: it.profile_url,
          },
        }));
        setLineup(items);
        setCaptainId(L.captain_id || null);
        setViceId(L.vice_id || null);
      } catch (e) {
        console.error(e);
        push("Failed to load data", "error");
      }
    })();
  }, [team, format]);

  /* suggestions while typing name */
  useEffect(() => {
    const q = addName.trim();
    if (q.length < 2) {
      setSuggests([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const s = await api.suggest(team, q);
        if (alive) setSuggests(s);
      } catch {
        if (alive) setSuggests([]);
      }
    })();
    return () => (alive = false);
  }, [addName, team]);

  /* hide from squad list when already chosen in current lineup */
  const listForSquad = useMemo(() => {
    const idsInLineup = new Set(lineup.map((x) => x.player_id));
    const q = ci(search);
    return (squad || [])
      .filter((p) => !idsInLineup.has(p.id))
      .filter((p) => !q || ci(p.player_name).includes(q))
      .sort((a, b) => a.player_name.localeCompare(b.player_name));
  }, [squad, lineup, search]);

  const lineupFiltered = useMemo(
    () => lineup.slice().sort((a, b) => a.order_no - b.order_no),
    [lineup]
  );

  /* quick composition hints */
  const comp = useMemo(() => {
    const wk = lineupFiltered.filter((x) => /wicket/i.test(x.obj.skill_type || "")).length;
    const ar = lineupFiltered.filter((x) => /all\s*rounder/i.test(x.obj.skill_type || "")).length;
    const bowl = lineupFiltered.filter((x) => /bowl/i.test(x.obj.skill_type || "")).length;
    const bat = lineupFiltered.length - bowl - ar - wk;
    return { wk, ar, bowl, bat };
  }, [lineupFiltered]);

  /* add to squad (unlimited; DB index will reject same name inside same team+format) */
  const onAddToSquad = async () => {
    const name = addName.trim();
    if (!name) return;

    try {
      const created = await api.createPlayer({
        player_name: name,
        team_name: team,
        lineup_type: format,
        skill_type: role,
        batting_style: battingStyle || "",
        bowling_type: buildBowlingType(),
      });
      setSquad((prev) => [...prev, created]);
      setAddName("");
      setAddNote("");
      setSuggests([]);
      setBattingStyle("");
      setBowlingKind("");
      setBowlingArm("");
      setPaceType("");
      setSpinType("");
      push(`Added ${created.player_name} to ${team} ${format} squad`, "success");
    } catch (e) {
      const msg =
        e?.response?.status === 409 || e?.response?.status === 23505
          ? "That name already exists in this squad."
          : e?.response?.data?.error || "Failed to add";
      setAddNote(msg);
      push(msg, "error");
    }
  };

  /* edit/delete from squad list */
  const onDeletePlayer = async (id) => {
    if (!window.confirm("Delete this player from the squad?")) return;
    try {
      await api.deletePlayer(id);
      setSquad((p) => p.filter((x) => x.id !== id));
      // also remove from lineup if present
      setLineup((p) => p.filter((x) => x.player_id !== id).map((x, i) => ({
        ...x, order_no: i + 1, is_twelfth: i === 11
      })));
      if (captainId === id) setCaptainId(null);
      if (viceId === id) setViceId(null);
      push("Deleted", "success");
    } catch {
      push("Delete failed", "error");
    }
  };

  /* drag rules */
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const src = source.droppableId;
    const dst = destination.droppableId;

    // Squad -> Lineup
    if (src === "squad" && dst === "lineup") {
      const srcList = listForSquad;
      const p = srcList[source.index];
      if (!p) return;

      if (lineupFiltered.length >= MAX_LINEUP) {
        push(`Max ${MAX_LINEUP} players allowed in lineup`, "error");
        return;
      }
      // deny duplicate by id OR by CI name
      if (
        lineupFiltered.some(
          (x) => x.player_id === p.id || ciEq(x.obj.player_name, p.player_name)
        )
      ) {
        push("Already in lineup", "info");
        return;
      }
      const newItem = {
        player_id: p.id,
        order_no: lineupFiltered.length + 1,
        is_twelfth: lineupFiltered.length + 1 === 12,
        obj: p,
      };
      setLineup((prev) => [...prev, newItem]);
      return;
    }

    // Lineup -> Squad (remove)
    if (src === "lineup" && dst === "squad") {
      const items = Array.from(lineupFiltered);
      items.splice(source.index, 1);
      const reseq = items.map((x, i) => ({
        ...x,
        order_no: i + 1,
        is_twelfth: i === 11,
      }));
      // clear C/VC if removed
      const removed = lineupFiltered[source.index];
      if (removed?.player_id === captainId) setCaptainId(null);
      if (removed?.player_id === viceId) setViceId(null);
      setLineup(reseq);
      return;
    }

    // Lineup re-order
    if (src === "lineup" && dst === "lineup") {
      const items = Array.from(lineupFiltered);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      setLineup(
        items.map((x, i) => ({
          ...x,
          order_no: i + 1,
          is_twelfth: i === 11,
        }))
      );
    }
  };

  /* save lineup */
  const onSave = async () => {
    if (lineupFiltered.length < MIN_LINEUP) {
      push(`At least ${MIN_LINEUP} players required`, "error");
      return;
    }
    if (!captainId || !viceId) {
      push("Pick one Captain and one Vice-captain", "error");
      return;
    }
    if (captainId === viceId) {
      push("Captain and Vice-captain must be different", "error");
      return;
    }
    try {
      await api.saveLineup({
        team_name: team,
        lineup_type: format,
        captain_player_id: captainId,
        vice_captain_player_id: viceId,
        players: lineupFiltered.map((x) => ({
          player_id: x.player_id,
          order_no: x.order_no,
          is_twelfth: !!x.is_twelfth,
        })),
      });
      push("Lineup saved", "success");
    } catch (e) {
      push(e?.response?.data?.error || "Failed to save lineup", "error");
    }
  };

  /* small UI helpers */
  const skillIcon = (s) => {
    const k = (s || "").toLowerCase();
    if (k.includes("wicket")) return "🧤";
    if (k.includes("all")) return "🏏🔴";
    if (k.includes("bowl")) return "🔴";
    return "🏏";
  };

  /* presence flags to annotate suggestions */
  const presence = useMemo(() => {
    const namesInSquad = new Set((squad || []).map((p) => ci(p.player_name)));
    const namesInLineup = new Set(lineupFiltered.map((x) => ci(x.obj.player_name)));
    return { namesInSquad, namesInLineup };
  }, [squad, lineupFiltered]);

  return (
    <div className="sq-wrap sq-full">
      <Toasts list={toasts} onClose={close} />

      {/* Header */}
      <header className="sq-header">
        <div className="sq-team-tabs">
          <div className="sq-team-select">
            <select className="sq-select" value={team} onChange={(e) => setTeam(e.target.value)}>
              {teams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="sq-format-tabs">
            {FORMATS.map((f) => (
              <button
                key={f}
                className={`sq-tab ${format === f ? "active" : ""}`}
                onClick={() => setFormat(f)}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Squad */}
        <div className="sq-addbar">
          <div className="sq-add-left">
            <input
              className="sq-input"
              placeholder={`Add to ${team} ${format} squad… (type to see suggestions)`}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
            />
            {!!suggests.length && (
              <div className="sq-suggest">
                {suggests.map((s) => {
                  const key = ci(s.name || s.player_name || "");
                  const text = s.name || s.player_name;
                  const inSquad = presence.namesInSquad.has(key);
                  const inLineup = presence.namesInLineup.has(key);
                  return (
                    <div
                      key={`${text}-${s.team || "t"}`}
                      className="sq-suggest-item"
                      onClick={() => setAddName(text)}
                      title={`Found in ${s.team || team}`}
                    >
                      <span>{text}</span>
                      <span className="sq-suggest-note">
                        {inSquad && <span>• in Squad</span>}
                        {inLineup && <span style={{ marginLeft: 6 }}>• in Line-up</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {!!addNote && <div className="sq-note">{addNote}</div>}
          </div>

          <select className="sq-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Batsman</option>
            <option>Bowler</option>
            <option>All Rounder</option>
            <option>Wicketkeeper/Batsman</option>
          </select>

          {/* batting/bowling quick fields */}
          <select className="sq-role" value={battingStyle} onChange={(e) => setBattingStyle(e.target.value)}>
            <option value="">Batting…</option>
            <option>Right-hand Bat</option>
            <option>Left-hand Bat</option>
          </select>

          <select className="sq-role" value={bowlingKind} onChange={(e) => { setBowlingKind(e.target.value); setPaceType(""); setSpinType(""); }}>
            <option value="">Bowl…</option>
            <option>Pace</option>
            <option>Spin</option>
          </select>

          <select className="sq-role" value={bowlingArm} onChange={(e) => setBowlingArm(e.target.value)}>
            <option value="">Arm…</option>
            <option>Right-arm</option>
            <option>Left-arm</option>
          </select>

          {bowlingKind === "Pace" ? (
            <select className="sq-role" value={paceType} onChange={(e) => setPaceType(e.target.value)}>
              <option value="">Type…</option>
              <option>Fast</option>
              <option>Medium Fast</option>
            </select>
          ) : bowlingKind === "Spin" ? (
            <select className="sq-role" value={spinType} onChange={(e) => setSpinType(e.target.value)}>
              <option value="">Spin…</option>
              <option>Off Spin</option>
              <option>Leg Spin</option>
              <option>Left-arm Orthodox</option>
              <option>Left-arm Wrist Spin</option>
            </select>
          ) : (
            <select className="sq-role" disabled><option>Type…</option></select>
          )}

          <button className="sq-btn" onClick={onAddToSquad} type="button">Add to Squad</button>
        </div>
      </header>

      {/* Search + quick composition */}
      <div className="sq-filters">
        <input
          className="sq-input"
          placeholder="Search squad…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="sq-comp">
          <span className="sq-badge">Bat: {comp.bat}</span>
          <span className="sq-badge">AR: {comp.ar}</span>
          <span className="sq-badge">Bowl: {comp.bowl}</span>
          <span className="sq-badge">WK: {comp.wk}</span>
        </div>
      </div>

      {/* Squad + Lineup board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="quad-grid">
          {/* Squad */}
          <Droppable droppableId="squad">
            {(provided) => (
              <div className="sq-panel" ref={provided.innerRef} {...provided.droppableProps}>
                <div className="sq-panel-title">🧢 Squad — {team} {format} ({squad.length})</div>
                {listForSquad.map((p, idx) => (
                  <Draggable key={`p-${p.id}`} draggableId={`p-${p.id}`} index={idx}>
                    {(prov) => (
                      <div className="sq-card"
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                      >
                        <div className="sq-card-left">
                          <span className="sq-ico">{skillIcon(p.skill_type)}</span>
                          <div>
                            <div className="sq-name">{p.player_name}</div>
                            <div className="sq-sub">
                              {p.batting_style || "—"} • {p.bowling_type || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="sq-actions">
                          {isAdmin && (
                            <button className="sq-icon-btn danger" title="Delete" onClick={() => onDeletePlayer(p.id)} type="button">🗑️</button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {!listForSquad.length && (
                  <div className="sq-empty">
                    All chosen players are currently in the Line-up. Add more to the squad or drag back from Line-up.
                  </div>
                )}
              </div>
            )}
          </Droppable>

          {/* Lineup */}
          <Droppable droppableId="lineup">
            {(provided) => (
              <div className="sq-panel lineup" ref={provided.innerRef} {...provided.droppableProps}>
                <div className="sq-panel-title">🎯 Line-up ({lineupFiltered.length}/{MAX_LINEUP})</div>

                {lineupFiltered.map((x, idx) => (
                  <Draggable key={`l-${x.player_id}`} draggableId={`l-${x.player_id}`} index={idx}>
                    {(prov) => (
                      <div className="sq-card"
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                      >
                        <div className="sq-card-left">
                          <span className="sq-order">{idx + 1}</span>
                          <span className="sq-ico">{skillIcon(x.obj.skill_type)}</span>
                          <div className="sq-name">{x.obj.player_name}</div>
                          {idx === 11 && <span className="sq-tag">12th</span>}
                          {x.player_id === captainId && <span className="sq-tag gold">C</span>}
                          {x.player_id === viceId && <span className="sq-tag teal">VC</span>}
                        </div>
                        <div className="sq-actions">
                          <button
                            className={`sq-chip ${x.player_id === captainId ? "on" : ""}`}
                            title="Set Captain"
                            onClick={() => {
                              if (x.player_id === viceId) setViceId(null);
                              setCaptainId((prev) => (prev === x.player_id ? null : x.player_id));
                            }}
                            type="button"
                          >
                            C
                          </button>
                          <button
                            className={`sq-chip ${x.player_id === viceId ? "on" : ""}`}
                            title="Set Vice-captain"
                            onClick={() => {
                              if (x.player_id === captainId) setCaptainId(null);
                              setViceId((prev) => (prev === x.player_id ? null : x.player_id));
                            }}
                            type="button"
                          >
                            VC
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {!lineupFiltered.length && (
                  <div className="sq-empty">Drag from Squad to build XI (max 12; one 12th).</div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Save bar */}
      <div className="sq-savebar">
        <div>
          <strong>{lineupFiltered.length}</strong> selected • C:
          {" "}
          {captainId ? (squad.find((p) => p.id === captainId)?.player_name || "—") : "—"}
          {"  "}• VC:
          {" "}
          {viceId ? (squad.find((p) => p.id === viceId)?.player_name || "—") : "—"}
        </div>
        <button className="sq-btn primary" onClick={onSave} type="button">Save Line-up</button>
      </div>
    </div>
  );
}
