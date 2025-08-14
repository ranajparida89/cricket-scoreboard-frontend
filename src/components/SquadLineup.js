// ✅ src/components/SquadLineup.js
// ✅ 14-Aug-2025 — Team-wise + Format-wise Squad & Lineup builder with DnD + Rive animations
// Uses helpers from src/services/api.js: fetchPlayers, suggestPlayers, createPlayer, updatePlayer, deletePlayer, getLineup, saveLineup

import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  fetchPlayers,
  suggestPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getLineup,
  saveLineup,
} from "../services/api";
import "./SquadLineup.css";

/* ──────────────────────────────────────────────────────────────────────────
   Rive minimal wrapper (safe, lazy, respects reduced motion)
   ────────────────────────────────────────────────────────────────────────── */
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

function RiveSlot({ src, className = "", autoplay = true }) {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const { RiveComponent } = useRive({
    src,
    autoplay: autoplay && !prefersReduced,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  if (!src) return null; // no asset yet (safe)
  return (
    <div className={className} aria-hidden="true">
      {RiveComponent ? <RiveComponent /> : null}
    </div>
  );
}

const TEAMS = [
  "India",
  "Australia",
  "England",
  "New Zealand",
  "Pakistan",
  "South Africa",
  "Sri Lanka",
  "Bangladesh",
  "Afghanistan",
];
const FORMATS = ["ODI", "T20", "TEST"];
const MAX_LINEUP = 12;
const MIN_LINEUP = 11;

const ci = (s) => (s || "").trim().toLowerCase();
const ciEq = (a, b) => ci(a) === ci(b);
const roleIcon = (p) => {
  const role = (p?.skill_type || "").toLowerCase();
  if (role.includes("wicket")) return "🧤";
  if (role.includes("all")) return "🔀";
  if (role.includes("bowler")) return "🎯";
  if (role.includes("bat")) return "🥇";
  return "🏏";
};

export default function SquadLineup({ isAdmin = true }) {
  const [team, setTeam] = useState("India");
  const [format, setFormat] = useState("ODI");

  const [squad, setSquad] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceId, setViceId] = useState(null);

  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("Batsman");
  const [suggests, setSuggests] = useState([]);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  // Rive assets (lazy import so missing files don't break the build)
  const [riv, setRiv] = useState({ empty: null, success: null, glow: null });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const empty = (await import("../assets/rive/empty_lineup.riv")).default;
        const success = (await import("../assets/rive/save_success.riv")).default;
        // optional:
        let glow = null;
        try {
          glow = (await import("../assets/rive/drop_glow.riv")).default;
        } catch { /* optional file might not exist */ }
        if (alive) setRiv({ empty, success, glow });
      } catch {
        // If you haven't added any .riv files yet, that's OK.
        if (alive) setRiv({ empty: null, success: null, glow: null });
      }
    })();
    return () => { alive = false; };
  }, []);

  const [showSaveCongrats, setShowSaveCongrats] = useState(false);

  // Load Squad + existing Lineup
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchPlayers(team, format);
        if (!active) return;
        setSquad(list);

        const L = await getLineup(team, format);
        if (!active) return;

        if (L?.lineup?.length) {
          const enriched = L.lineup.map((it, i) => ({
            player_id: it.player_id,
            order_no: it.order_no ?? i + 1,
            is_twelfth: !!it.is_twelfth,
            obj: {
              id: it.player_id,
              player_name: it.player_name,
              skill_type: it.skill_type,
              batting_style: it.batting_style,
              bowling_type: it.bowling_type,
              profile_url: it.profile_url,
            },
          }));
          setLineup(enriched);
          setCaptainId(L.captain_id || null);
          setViceId(L.vice_id || null);
        } else {
          setLineup([]);
          setCaptainId(null);
          setViceId(null);
        }
      } catch (e) {
        console.error("Load squad/lineup failed", e);
      }
    })();
    return () => { active = false; };
  }, [team, format]);

  // Suggestions for Add Player
  useEffect(() => {
    let mounted = true;
    (async () => {
      const q = addName.trim();
      if (q.length < 2) { setSuggests([]); return; }
      try {
        const s = await suggestPlayers(team, q);
        if (mounted) setSuggests(s || []);
      } catch {
        if (mounted) setSuggests([]);
      }
    })();
    return () => { mounted = false; };
  }, [addName, team]);

  const inLineup = (pid) => lineup.some((x) => x.player_id === pid);

  const availableSquad = useMemo(() => {
    const searchLc = ci(search);
    return squad
      .filter((p) => !inLineup(p.id))
      .filter((p) => (filterRole === "ALL" ? true : ci(p.skill_type) === ci(filterRole)))
      .filter((p) => !searchLc || ci(p.player_name).includes(searchLc))
      .sort((a, b) => a.player_name.localeCompare(b.player_name));
  }, [squad, lineup, search, filterRole]);

  // DnD
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Reorder in lineup
    if (source.droppableId === "lineup" && destination.droppableId === "lineup") {
      const items = Array.from(lineup);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      const reseq = items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 }));
      setLineup(reseq);
      return;
    }

    // Squad → Lineup
    if (source.droppableId === "squad" && destination.droppableId === "lineup") {
      if (lineup.length >= MAX_LINEUP) { alert(`Max ${MAX_LINEUP} players allowed in lineup`); return; }
      const player = availableSquad[source.index];
      if (!player || inLineup(player.id)) return;
      const newItem = {
        player_id: player.id,
        order_no: lineup.length + 1,
        is_twelfth: lineup.length + 1 === 12,
        obj: player,
      };
      setLineup([...lineup, newItem]);
      return;
    }

    // Lineup → Squad (remove)
    if (source.droppableId === "lineup" && destination.droppableId === "squad") {
      const items = Array.from(lineup);
      const [removed] = items.splice(source.index, 1);
      if (removed?.player_id === captainId) setCaptainId(null);
      if (removed?.player_id === viceId) setViceId(null);
      const reseq = items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 }));
      setLineup(reseq);
    }
  };

  // Add / Edit / Delete
  const onAddPlayer = async () => {
    const name = addName.trim();
    if (!name) return;
    if (squad.some((p) => ciEq(p.player_name, name))) { alert("Player already exists in this team's squad"); return; }
    try {
      const created = await createPlayer({
        player_name: name, team_name: team, lineup_type: format, skill_type: addRole,
      });
      setSquad((prev) => [...prev, created].sort((a, b) => a.player_name.localeCompare(b.player_name)));
      setAddName(""); setSuggests([]);
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to add player");
    }
  };

  const doUpdatePlayer = async () => {
    if (!editing) return;
    try {
      const upd = await updatePlayer(editing.id, {
        player_name: editing.player_name,
        team_name: editing.team_name,
        lineup_type: editing.lineup_type,
        skill_type: editing.skill_type,
        batting_style: editing.batting_style,
        bowling_type: editing.bowling_type,
        profile_url: editing.profile_url,
      });
      setSquad((prev) =>
        prev.map((p) => (p.id === upd.id ? upd : p)).sort((a, b) => a.player_name.localeCompare(b.player_name))
      );
      setLineup((prev) =>
        prev.map((x) => (x.player_id === upd.id ? { ...x, obj: { ...x.obj, ...upd } } : x))
      );
      setEditing(null);
    } catch (e) { alert(e?.response?.data?.error || "Update failed"); }
  };

  const doDeletePlayer = async (pid) => {
    if (!window.confirm("Delete this player from the squad?")) return;
    try {
      await deletePlayer(pid);
      setSquad((prev) => prev.filter((p) => p.id !== pid));
      setLineup((prev) => {
        const items = prev.filter((x) => x.player_id !== pid);
        return items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 }));
      });
      if (captainId === pid) setCaptainId(null);
      if (viceId === pid) setViceId(null);
    } catch { alert("Failed to delete player"); }
  };

  // C / VC
  const toggleCaptain = (pid) => { if (pid === viceId) setViceId(null); setCaptainId((prev) => (prev === pid ? null : pid)); };
  const toggleVice = (pid) => { if (pid === captainId) setCaptainId(null); setViceId((prev) => (prev === pid ? null : pid)); };

  // Save lineup
  const doSave = async () => {
    if (lineup.length < MIN_LINEUP) return alert(`At least ${MIN_LINEUP} players required`);
    if (!captainId || !viceId) return alert("Select exactly one Captain and one Vice-captain");
    if (captainId === viceId) return alert("Captain and Vice-captain must be different");
    const payload = {
      team_name: team,
      lineup_type: format,
      captain_player_id: captainId,
      vice_captain_player_id: viceId,
      players: lineup.map((x) => ({ player_id: x.player_id, order_no: x.order_no, is_twelfth: !!x.is_twelfth })),
    };
    try {
      await saveLineup(payload);
      setShowSaveCongrats(true);
      setTimeout(() => setShowSaveCongrats(false), 1400);
    } catch (e) { alert(e?.response?.data?.error || "Failed to save lineup"); }
  };

  return (
    <div className="sq-wrap">
      {/* Header */}
      <header className="sq-header">
        <div className="sq-team-tabs">
          <select value={team} onChange={(e) => setTeam(e.target.value)} className="sq-select">
            {TEAMS.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <div className="sq-format-tabs">
            {FORMATS.map((f) => (
              <button key={f} className={`sq-tab ${format === f ? "active" : ""}`} onClick={() => setFormat(f)} type="button">
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="sq-addbar">
          <div className="sq-add-left">
            <input
              className="sq-input"
              placeholder="Add player to squad… (type to see suggestions)"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
            />
            {!!suggests.length && (
              <div className="sq-suggest">
                {suggests.map((s) => (
                  <div
                    key={`${s.name}-${s.team}`}
                    className={`sq-suggest-item ${ci(s.team) === ci(team) ? "exists" : ""}`}
                    onClick={() => setAddName(s.name)}
                    title={ci(s.team) === ci(team) ? "Already in this team's squad" : `Found in ${s.team}`}
                  >
                    {s.name}{ci(s.team) === ci(team) && <span className="sq-suggest-note"> • already in squad</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <select className="sq-role" value={addRole} onChange={(e) => setAddRole(e.target.value)}>
            <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicketkeeper/Batsman</option>
          </select>
          <button className="sq-btn" onClick={onAddPlayer} type="button">Add</button>
        </div>
      </header>

      {/* Filters */}
      <div className="sq-filters">
        <input className="sq-input" placeholder="Search squad…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="sq-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="Batsman">Batsman</option>
          <option value="Bowler">Bowler</option>
          <option value="All Rounder">All Rounder</option>
          <option value="Wicketkeeper/Batsman">Wicketkeeper/Batsman</option>
        </select>
      </div>

      {/* DnD Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="sq-cols">
          {/* Squad */}
          <Droppable droppableId="squad">
            {(provided) => (
              <div className="sq-panel" ref={provided.innerRef} {...provided.droppableProps}>
                <div className="sq-panel-title">🧢 Squad (unlimited)</div>
                {availableSquad.map((p, idx) => (
                  <Draggable key={`s-${p.id}`} draggableId={`s-${p.id}`} index={idx}>
                    {(prov) => (
                      <div className="sq-card" ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <div className="sq-card-left">
                          <span className="sq-ico">{roleIcon(p)}</span>
                          <div>
                            <div className="sq-name">{p.player_name}</div>
                            <div className="sq-sub">{p.batting_style || "—"} • {p.bowling_type || "—"}</div>
                          </div>
                        </div>
                        <div className="sq-actions">
                          <button className="sq-icon-btn" title="Edit" onClick={() => setEditing(p)} type="button">✏️</button>
                          {isAdmin && (
                            <button className="sq-icon-btn danger" title="Delete" onClick={() => doDeletePlayer(p.id)} type="button">🗑️</button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {!availableSquad.length && <div className="sq-empty">All squad players are currently in lineup or filtered out.</div>}
              </div>
            )}
          </Droppable>

          {/* Lineup */}
          <Droppable droppableId="lineup">
            {(provided, snapshot) => (
              <div className="sq-panel lineup" ref={provided.innerRef} {...provided.droppableProps}>
                {/* Optional glow ONLY while dragging over, if you added the file */}
                {snapshot.isDraggingOver && riv.glow && (
                  <div className="sq-drop-glow">
                    <RiveSlot src={riv.glow} className="sq-rive on" />
                  </div>
                )}

                <div className="sq-panel-title">🎯 Lineup ({lineup.length}/{MAX_LINEUP})</div>

                {lineup.map((x, idx) => (
                  <Draggable key={`l-${x.player_id}`} draggableId={`l-${x.player_id}`} index={idx}>
                    {(prov) => (
                      <div className="sq-card" ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <div className="sq-card-left">
                          <span className="sq-order">{idx + 1}</span>
                          <span className="sq-ico">{roleIcon(x.obj)}</span>
                          <div className="sq-name">{x.obj.player_name}</div>
                          {idx === 11 && <span className="sq-tag">12th</span>}
                          {x.player_id === captainId && <span className="sq-tag gold">C</span>}
                          {x.player_id === viceId && <span className="sq-tag teal">VC</span>}
                        </div>
                        <div className="sq-actions">
                          <button className={`sq-chip ${x.player_id === captainId ? "on" : ""}`} onClick={() => toggleCaptain(x.player_id)} title="Set Captain" type="button">C</button>
                          <button className={`sq-chip ${x.player_id === viceId ? "on" : ""}`} onClick={() => toggleVice(x.player_id)} title="Set Vice-captain" type="button">VC</button>
                          <button className="sq-icon-btn" title="Remove from lineup" onClick={() => {
                            const items = lineup.filter((it) => it.player_id !== x.player_id);
                            if (x.player_id === captainId) setCaptainId(null);
                            if (x.player_id === viceId) setViceId(null);
                            const reseq = items.map((p, i) => ({ ...p, order_no: i + 1, is_twelfth: i === 11 }));
                            setLineup(reseq);
                          }} type="button">➖</button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}

                {!lineup.length && (
                  <div className="sq-empty-anim">
                    <RiveSlot src={riv.empty} className="sq-rive" />
                    <div className="sq-empty">Drag players here to build XI (max 12; one 12th allowed).</div>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Sticky Save Bar */}
      <div className="sq-savebar">
        <div>
          <strong>{lineup.length}</strong> selected •{" "}
          C: {captainId ? (squad.find((p) => p.id === captainId)?.player_name || "—") : "—"} •{" "}
          VC: {viceId ? (squad.find((p) => p.id === viceId)?.player_name || "—") : "—"}
        </div>
        <button className="sq-btn primary" onClick={doSave} type="button">Save Lineup</button>
      </div>

      {/* Save success overlay (brief) */}
      {showSaveCongrats && (
        <div className="sq-rive-overlay">
          <RiveSlot src={riv.success} className="sq-rive-center" />
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="sq-modal" role="dialog" aria-modal="true">
          <div className="sq-modal-card">
            <div className="sq-modal-title">Edit Player</div>

            <label className="sq-lab">Name</label>
            <input className="sq-input" value={editing.player_name || ""} onChange={(e) => setEditing({ ...editing, player_name: e.target.value })} />

            <label className="sq-lab">Role</label>
            <select className="sq-input" value={editing.skill_type || "Batsman"} onChange={(e) => setEditing({ ...editing, skill_type: e.target.value })}>
              <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicketkeeper/Batsman</option>
            </select>

            <label className="sq-lab">Batting Style</label>
            <input className="sq-input" value={editing.batting_style || ""} onChange={(e) => setEditing({ ...editing, batting_style: e.target.value })} />

            <label className="sq-lab">Bowling Type</label>
            <input className="sq-input" value={editing.bowling_type || ""} onChange={(e) => setEditing({ ...editing, bowling_type: e.target.value })} />

            <div className="sq-modal-actions">
              <button className="sq-btn" onClick={() => setEditing(null)} type="button">Cancel</button>
              <button className="sq-btn primary" onClick={doUpdatePlayer} type="button">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
