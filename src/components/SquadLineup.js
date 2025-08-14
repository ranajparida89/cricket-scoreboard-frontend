// ✅ src/components/SquadLineup.js
// Team-wise + Format-wise Squad & Lineup with DnD + Rive + Toasts + Help dialog
// + Role-aware forms + Import/copy players across formats + Full-width layout

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

/* Rive */
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
  if (!src) return null;
  return <div className={className} aria-hidden="true">{RiveComponent ? <RiveComponent /> : null}</div>;
}

/* Helpers */
const DEFAULT_TEAMS = ["India","Australia","England","New Zealand","Pakistan","South Africa","Sri Lanka","Bangladesh","Afghanistan"];
const FORMATS = ["ODI","T20","TEST"];
const MAX_LINEUP = 12;
const MIN_LINEUP = 11;

const ci = (s) => (s || "").trim().toLowerCase();
const ciEq = (a, b) => ci(a) === ci(b);
const sigOf = (team, format, lineup, c, v) =>
  JSON.stringify({ team, format, c, v, arr: lineup.map((x) => [x.player_id, x.order_no, !!x.is_twelfth]) });

/* Icons */
const iconFor = (p) => {
  const role = (p?.skill_type || "").toLowerCase();
  if (role.includes("wicket")) return "🧤🏏";
  if (role.includes("all")) return "🏏🔴";
  if (role.includes("bowl")) return "🔴";
  return "🏏";
};

/* Toasts */
function Toasts({ toasts, onClose }) {
  return (
    <div className="sq-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`sq-toast ${t.type || "info"}`} onClick={() => onClose(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* Role-aware field group (Add + Edit) */
function RoleFields({ role, values, setValues }) {
  const set = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));

  const showBatting = ["batsman", "wicketkeeper/batsman", "all rounder"].includes((role || "").toLowerCase());
  const showBowling = ["bowler", "all rounder"].includes((role || "").toLowerCase());

  return (
    <div className="sq-role-fields">
      {showBatting && (
        <>
          <label className="sq-lab">Batting Style</label>
          <div className="sq-grid-2">
            <select className="sq-input" value={values.batting_style || ""} onChange={(e) => set("batting_style", e.target.value)}>
              <option value="">Select…</option>
              <option>Right-hand Bat</option>
              <option>Left-hand Bat</option>
            </select>
            {String(role).toLowerCase() === "all rounder" && (
              <select
                className="sq-input"
                value={values.allrounder_type || ""}
                onChange={(e) => set("allrounder_type", e.target.value)}
                title="Allrounder Type"
              >
                <option value="">Allrounder Type…</option>
                <option>Batting Allrounder</option>
                <option>Bowling Allrounder</option>
                <option>Genuine Allrounder</option>
              </select>
            )}
          </div>
        </>
      )}

      {showBowling && (
        <>
          <label className="sq-lab">Bowling</label>
          <div className="sq-grid-3">
            <select className="sq-input" value={values.bowl_kind || ""} onChange={(e) => set("bowl_kind", e.target.value)}>
              <option value="">Select Kind…</option>
              <option>Pace</option>
              <option>Spin</option>
            </select>

            <select className="sq-input" value={values.bowl_arm || ""} onChange={(e) => set("bowl_arm", e.target.value)} disabled={!values.bowl_kind}>
              <option value="">Arm…</option>
              <option>Right-arm</option>
              <option>Left-arm</option>
            </select>

            {values.bowl_kind === "Pace" ? (
              <select className="sq-input" value={values.pace_type || ""} onChange={(e) => set("pace_type", e.target.value)}>
                <option value="">Type…</option>
                <option>Fast</option>
                <option>Medium Fast</option>
              </select>
            ) : values.bowl_kind === "Spin" ? (
              <select className="sq-input" value={values.spin_type || ""} onChange={(e) => set("spin_type", e.target.value)}>
                <option value="">Spin…</option>
                <option>Off Spin</option>
                <option>Leg Spin</option>
                <option>Left-arm Orthodox</option>
                <option>Left-arm Wrist Spin</option>
              </select>
            ) : (
              <select className="sq-input" disabled><option>Type…</option></select>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* Build bowling_type string */
function buildBowlingType(vals) {
  if (!vals?.bowl_kind) return "";
  const arm = vals.bowl_arm ? `${vals.bowl_arm} ` : "";
  if (vals.bowl_kind === "Pace" && vals.pace_type) return `${arm}${vals.pace_type}`.trim();
  if (vals.bowl_kind === "Spin" && vals.spin_type) return `${arm}${vals.spin_type}`.trim();
  return "";
}

export default function SquadLineup({ isAdmin = true }) {
  /* Teams */
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem("crickedge_teams");
    return saved ? JSON.parse(saved) : DEFAULT_TEAMS;
  });
  const [team, setTeam] = useState(teams[0] || "India");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  /* Data */
  const [format, setFormat] = useState("ODI");
  const [squad, setSquad] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceId, setViceId] = useState(null);
  const [lastSavedSig, setLastSavedSig] = useState(null);

  /* Add/Edit state */
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("Batsman");
  const [addVals, setAddVals] = useState({ batting_style: "", bowl_kind: "", bowl_arm: "", pace_type: "", spin_type: "", allrounder_type: "" });

  const [editing, setEditing] = useState(null);
  const [editVals, setEditVals] = useState({});

  const [suggests, setSuggests] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  const [justAddedId, setJustAddedId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const pushToast = (message, type = "info", ttl = 2600) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), ttl);
  };

  /* Help dialog */
  const [showHelp, setShowHelp] = useState(false);

  /* Import/copy modals */
  const [showImport, setShowImport] = useState(false);
  const [importFromFormat, setImportFromFormat] = useState("ODI");
  const [importList, setImportList] = useState([]);
  const [importPick, setImportPick] = useState(new Set());
  const [importLoading, setImportLoading] = useState(false);

  const [copyFromPlayer, setCopyFromPlayer] = useState(null);
  const [copyTargets, setCopyTargets] = useState(new Set());
  const [copyExists, setCopyExists] = useState({});
  const [copyLoading, setCopyLoading] = useState(false);

  /* Rive */
  const [riv, setRiv] = useState({ empty: null, success: null, glow: null });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const empty = (await import("../assets/rive/empty_lineup.riv")).default;
        const success = (await import("../assets/rive/save_success.riv")).default;
        let glow = null;
        try { glow = (await import("../assets/rive/drop_glow.riv")).default; } catch {}
        if (alive) setRiv({ empty, success, glow });
      } catch { if (alive) setRiv({ empty: null, success: null, glow: null }); }
    })();
    return () => { alive = false; };
  }, []);
  const [showSaveCongrats, setShowSaveCongrats] = useState(false);

  /* Load squad + lineup */
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
          setLastSavedSig(sigOf(team, format, enriched, L.captain_id || null, L.vice_id || null));
        } else {
          setLineup([]); setCaptainId(null); setViceId(null);
          setLastSavedSig(sigOf(team, format, [], null, null));
        }
      } catch (e) {
        console.error("Load squad/lineup failed", e);
        setLineup([]); setCaptainId(null); setViceId(null);
        setLastSavedSig(sigOf(team, format, [], null, null));
      }
    })();
    return () => { active = false; };
  }, [team, format]);

  /* Suggestions */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const q = addName.trim();
      if (q.length < 2) { setSuggests([]); return; }
      try { const s = await suggestPlayers(team, q); if (mounted) setSuggests(s || []); }
      catch { if (mounted) setSuggests([]); }
    })();
    return () => { mounted = false; };
  }, [addName, team]);

  /* Filters */
  const inLineup = (pid) => lineup.some((x) => x.player_id === pid);
  const availableSquad = useMemo(() => {
    const searchLc = ci(search);
    return squad
      .filter((p) => !inLineup(p.id))
      .filter((p) => (filterRole === "ALL" ? true : ci(p.skill_type) === ci(filterRole)))
      .filter((p) => !searchLc || ci(p.player_name).includes(searchLc))
      .sort((a, b) => a.player_name.localeCompare(b.player_name));
  }, [squad, lineup, search, filterRole]);

  /* DnD */
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === "lineup" && destination.droppableId === "lineup") {
      const items = Array.from(lineup);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      const reseq = items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 }));
      setLineup(reseq);
      return;
    }

    if (source.droppableId === "squad" && destination.droppableId === "lineup") {
      if (lineup.length >= MAX_LINEUP) { pushToast(`Max ${MAX_LINEUP} players allowed in lineup`, "error"); return; }
      const player = availableSquad[source.index];
      if (!player || inLineup(player.id)) return;
      const newItem = { player_id: player.id, order_no: lineup.length + 1, is_twelfth: lineup.length + 1 === 12, obj: player };
      setLineup([...lineup, newItem]);
      setJustAddedId(player.id);
      setTimeout(() => setJustAddedId(null), 900);
      return;
    }

    if (source.droppableId === "lineup" && destination.droppableId === "squad") {
      const items = Array.from(lineup);
      const [removed] = items.splice(source.index, 1);
      if (removed?.player_id === captainId) setCaptainId(null);
      if (removed?.player_id === viceId) setViceId(null);
      const reseq = items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 }));
      setLineup(reseq);
    }
  };

  /* Add */
  const onAddPlayer = async () => {
    const name = addName.trim();
    if (!name) return;
    if (squad.some((p) => ciEq(p.player_name, name))) { pushToast("Player already exists in this format's squad", "error"); return; }

    const bowling_type = buildBowlingType(addVals);
    const skillTypeOut =
      addRole === "All Rounder" && addVals.allrounder_type
        ? `All Rounder (${addVals.allrounder_type})`
        : addRole;

    try {
      const created = await createPlayer({
        player_name: name,
        team_name: team,
        lineup_type: format,
        skill_type: skillTypeOut,
        batting_style: addVals.batting_style || "",
        bowling_type,
      });
      setSquad((prev) => [...prev, created].sort((a, b) => a.player_name.localeCompare(b.player_name)));
      setAddName(""); setSuggests([]);
      setAddVals({ batting_style: "", bowl_kind: "", bowl_arm: "", pace_type: "", spin_type: "", allrounder_type: "" });
      setJustAddedId(created.id);
      setTimeout(() => setJustAddedId(null), 900);
      pushToast(`Added ${created.player_name} to ${team} (${format})`, "success");
    } catch (e) { pushToast(e?.response?.data?.error || "Failed to add player", "error"); }
  };

  /* Edit */
  const openEdit = (p) => {
    setEditing(p);
    const vals = { batting_style: p.batting_style || "", bowl_kind: "", bowl_arm: "", pace_type: "", spin_type: "", allrounder_type: "" };
    if ((p.skill_type || "").toLowerCase().startsWith("all rounder (batting")) vals.allrounder_type = "Batting Allrounder";
    else if ((p.skill_type || "").toLowerCase().startsWith("all rounder (bowling")) vals.allrounder_type = "Bowling Allrounder";
    else if ((p.skill_type || "").toLowerCase().startsWith("all rounder (genuine")) vals.allrounder_type = "Genuine Allrounder";

    const bt = p.bowling_type || "";
    if (bt) {
      const isPace = /Fast/i.test(bt);
      vals.bowl_kind = isPace ? "Pace" : "Spin";
      vals.bowl_arm = /Left-arm/i.test(bt) ? "Left-arm" : /Right-arm/i.test(bt) ? "Right-arm" : "";
      if (isPace) vals.pace_type = /Medium/i.test(bt) ? "Medium Fast" : "Fast";
      else {
        if (/Off Spin/i.test(bt)) vals.spin_type = "Off Spin";
        else if (/Leg Spin/i.test(bt)) vals.spin_type = "Leg Spin";
        else if (/Left-arm Orthodox/i.test(bt)) vals.spin_type = "Left-arm Orthodox";
        else if (/Left-arm Wrist Spin/i.test(bt)) vals.spin_type = "Left-arm Wrist Spin";
      }
    }
    setEditVals(vals);
  };

  const doUpdatePlayer = async () => {
    if (!editing) return;
    const bowling_type = buildBowlingType(editVals);
    const skillTypeOut =
      editing.skill_type?.startsWith("All Rounder")
        ? (editVals.allrounder_type ? `All Rounder (${editVals.allrounder_type})` : "All Rounder")
        : editing.skill_type;

    try {
      const upd = await updatePlayer(editing.id, {
        player_name: editing.player_name,
        team_name: editing.team_name,
        lineup_type: editing.lineup_type,
        skill_type: skillTypeOut,
        batting_style: editVals.batting_style || "",
        bowling_type,
        profile_url: editing.profile_url,
      });
      setSquad((prev) => prev.map((p) => (p.id === upd.id ? upd : p)).sort((a, b) => a.player_name.localeCompare(b.player_name)));
      setLineup((prev) => prev.map((x) => (x.player_id === upd.id ? { ...x, obj: { ...x.obj, ...upd } } : x)));
      setEditing(null);
      pushToast("Player updated", "success");
    } catch (e) { pushToast(e?.response?.data?.error || "Update failed", "error"); }
  };

  /* Delete */
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
      pushToast("Player deleted", "success");
    } catch { pushToast("Failed to delete player", "error"); }
  };

  /* C / VC */
  const toggleCaptain = (pid) => { if (pid === viceId) setViceId(null); setCaptainId((prev) => (prev === pid ? null : pid)); };
  const toggleVice = (pid) => { if (pid === captainId) setCaptainId(null); setViceId((prev) => (prev === pid ? null : pid)); };

  /* Save lineup */
  const doSave = async () => {
    const currentSig = sigOf(team, format, lineup, captainId, viceId);
    if (currentSig === lastSavedSig) { pushToast("Already saved. Make changes to save again.", "info"); return; }
    if (lineup.length < MIN_LINEUP) return pushToast(`At least ${MIN_LINEUP} players required`, "error");
    if (!captainId || !viceId) return pushToast("Pick one Captain and one Vice-captain", "error");
    if (captainId === viceId) return pushToast("Captain and Vice-captain must be different", "error");

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
      setLastSavedSig(currentSig);
      pushToast("Lineup saved", "success");
    } catch (e) { pushToast(e?.response?.data?.error || "Failed to save lineup", "error"); }
  };

  /* Team add */
  const addTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    if (teams.some((t) => ciEq(t, name))) { pushToast("Team already exists", "error"); return; }
    const next = [...teams, name].sort((a, b) => a.localeCompare(b));
    setTeams(next);
    localStorage.setItem("crickedge_teams", JSON.stringify(next));
    setTeam(name);
    setNewTeamName(""); setShowTeamModal(false);
    pushToast(`Team "${name}" added`, "success");
  };

  /* Import modal helpers */
  const openImport = () => {
    const others = FORMATS.filter((f) => f !== format);
    setImportFromFormat(others[0] || format);
    setImportPick(new Set());
    setShowImport(true);
  };

  useEffect(() => {
    if (!showImport) return;
    let alive = true;
    (async () => {
      try {
        setImportLoading(true);
        const list = await fetchPlayers(team, importFromFormat);
        if (!alive) return;
        // candidates = not already in current format (by name)
        const candidates = (list || []).filter(
          (src) => !squad.some((p) => ciEq(p.player_name, src.player_name))
        );
        setImportList(candidates);
      } finally {
        setImportLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [showImport, importFromFormat, team, squad]);

  const toggleImportPick = (id) => {
    setImportPick((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const doImportSelected = async () => {
    const picks = importList.filter((p) => importPick.has(p.id));
    if (!picks.length) return pushToast("Select at least one player to import", "error");
    try {
      await Promise.all(
        picks.map((p) =>
          createPlayer({
            player_name: p.player_name,
            team_name: team,
            lineup_type: format,
            skill_type: p.skill_type,
            batting_style: p.batting_style,
            bowling_type: p.bowling_type,
            profile_url: p.profile_url,
          })
        )
      );
      const list = await fetchPlayers(team, format);
      setSquad(list);
      setShowImport(false);
      setImportPick(new Set());
      pushToast(`Imported ${picks.length} player(s) from ${importFromFormat}`, "success");
    } catch (e) {
      pushToast(e?.response?.data?.error || "Import failed", "error");
    }
  };

  /* Copy-to modal helpers (per-player) */
  const openCopyTo = async (p) => {
    setCopyFromPlayer(p);
    setCopyTargets(new Set());
    setCopyExists({});
    try {
      setCopyLoading(true);
      const others = FORMATS.filter((f) => f !== p.lineup_type && f !== format ? true : f !== format);
      // check existence in each target format
      const lists = await Promise.all(others.map((f) => fetchPlayers(team, f)));
      const existMap = {};
      others.forEach((f, i) => {
        const list = lists[i] || [];
        existMap[f] = list.some((q) => ciEq(q.player_name, p.player_name));
      });
      setCopyExists(existMap);
    } finally {
      setCopyLoading(false);
    }
  };

  const toggleCopyTarget = (fmt) => {
    setCopyTargets((prev) => {
      const next = new Set(prev);
      next.has(fmt) ? next.delete(fmt) : next.add(fmt);
      return next;
    });
  };

  const doCopyPlayer = async () => {
    if (!copyFromPlayer) return;
    const targets = Array.from(copyTargets);
    if (!targets.length) return pushToast("Choose at least one target format", "error");
    try {
      setCopyLoading(true);
      for (const tf of targets) {
        // skip if already exists
        if (copyExists[tf]) continue;
        await createPlayer({
          player_name: copyFromPlayer.player_name,
          team_name: team,
          lineup_type: tf,
          skill_type: copyFromPlayer.skill_type,
          batting_style: copyFromPlayer.batting_style,
          bowling_type: copyFromPlayer.bowling_type,
          profile_url: copyFromPlayer.profile_url,
        });
      }
      pushToast("Player copied to selected format(s)", "success");
      setCopyFromPlayer(null);
      setCopyTargets(new Set());
      setCopyExists({});
    } catch (e) {
      pushToast(e?.response?.data?.error || "Copy failed", "error");
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <div className="sq-wrap sq-full">
      <Toasts toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <header className="sq-header">
        <div className="sq-team-tabs">
          <div className="sq-team-select">
            <select value={team} onChange={(e) => setTeam(e.target.value)} className="sq-select">
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="sq-icon-btn" title="Add Team" onClick={() => setShowTeamModal(true)} type="button">➕</button>
          </div>

          <div className="sq-format-tabs">
            {FORMATS.map((f) => (
              <button key={f} className={`sq-tab ${format === f ? "active" : ""}`} onClick={() => setFormat(f)} type="button">{f}</button>
            ))}
          </div>

          <button className="sq-icon-btn" title="Import players from another format" onClick={openImport} type="button">📥</button>
          <button className="sq-icon-btn info" title="How this page works" onClick={() => setShowHelp(true)} type="button">i</button>
        </div>

        <div className="sq-addbar">
          <div className="sq-add-left">
            <input className="sq-input" placeholder="Add player to squad… (type to see suggestions)" value={addName} onChange={(e) => setAddName(e.target.value)} />
            {!!suggests.length && (
              <div className="sq-suggest">
                {suggests.map((s) => (
                  <div key={`${s.name}-${s.team}`} className={`sq-suggest-item ${ci(s.team) === ci(team) ? "exists" : ""}`} onClick={() => setAddName(s.name)} title={ci(s.team) === ci(team) ? "Already in this team's squad" : `Found in ${s.team}`}>
                    {s.name}{ci(s.team) === ci(team) && <span className="sq-suggest-note"> • already in squad</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <select className="sq-role" value={addRole} onChange={(e) => setAddRole(e.target.value)}>
            <option>Batsman</option>
            <option>Bowler</option>
            <option>All Rounder</option>
            <option>Wicketkeeper/Batsman</option>
          </select>

          <button className="sq-btn" onClick={onAddPlayer} type="button">Add</button>
        </div>

        {/* Role-aware fields (Add) */}
        <RoleFields role={addRole} values={addVals} setValues={setAddVals} />
      </header>

      {/* Filters */}
      <div className="sq-filters">
        <input className="sq-input" placeholder="Search this squad by player name…" value={search} onChange={(e) => setSearch(e.target.value)} title="Search is for players in the selected team's squad" />
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
                      <div className={`sq-card ${justAddedId === p.id ? "flash-in" : ""}`} ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <div className="sq-card-left">
                          <span className="sq-ico">{iconFor(p)}</span>
                          <div>
                            <div className="sq-name">{p.player_name}</div>
                            <div className="sq-sub">{p.batting_style || "—"} • {p.bowling_type || "—"}</div>
                          </div>
                        </div>
                        <div className="sq-actions">
                          <button className="sq-icon-btn" title="Copy to other formats" onClick={() => openCopyTo({ ...p, lineup_type: format })} type="button">⇄</button>
                          <button className="sq-icon-btn" title="Edit" onClick={() => openEdit(p)} type="button">✏️</button>
                          {isAdmin && <button className="sq-icon-btn danger" title="Delete" onClick={() => doDeletePlayer(p.id)} type="button">🗑️</button>}
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
                {snapshot.isDraggingOver && riv.glow && (
                  <div className="sq-drop-glow"><RiveSlot src={riv.glow} className="sq-rive on" /></div>
                )}

                <div className="sq-panel-title">🎯 Lineup ({lineup.length}/{MAX_LINEUP})</div>

                {lineup.map((x, idx) => (
                  <Draggable key={`l-${x.player_id}`} draggableId={`l-${x.player_id}`} index={idx}>
                    {(prov) => (
                      <div className={`sq-card ${justAddedId === x.player_id ? "flash-in" : ""}`} ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <div className="sq-card-left">
                          <span className="sq-order">{idx + 1}</span>
                          <span className="sq-ico">{iconFor(x.obj)}</span>
                          <div className="sq-name">{x.obj.player_name}</div>
                          {idx === 11 && <span className="sq-tag">12th</span>}
                          {x.player_id === captainId && <span className="sq-tag gold">C</span>}
                          {x.player_id === viceId && <span className="sq-tag teal">VC</span>}
                        </div>
                        <div className="sq-actions">
                          <button className={`sq-chip ${x.player_id === captainId ? "on" : ""}`} onClick={() => toggleCaptain(x.player_id)} title="Set Captain" type="button">C</button>
                          <button className={`sq-chip ${x.player_id === viceId ? "on" : ""}`} onClick={() => toggleVice(x.player_id)} title="Set Vice-captain" type="button">VC</button>
                          <button className="sq-icon-btn" title="Copy to other formats" onClick={() => openCopyTo({ ...x.obj, lineup_type: format })} type="button">⇄</button>
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

      {/* Save bar */}
      <div className="sq-savebar">
        <div>
          <strong>{lineup.length}</strong> selected • C: {captainId ? (squad.find((p) => p.id === captainId)?.player_name || "—") : "—"} • VC: {viceId ? (squad.find((p) => p.id === viceId)?.player_name || "—") : "—"}
        </div>
        <button className="sq-btn primary" onClick={doSave} type="button">Save Lineup</button>
      </div>

      {/* Overlays */}
      {showSaveCongrats && <div className="sq-rive-overlay"><RiveSlot src={riv.success} className="sq-rive-center" /></div>}

      {/* Edit Modal */}
      {editing && (
        <div className="sq-modal" role="dialog" aria-modal="true">
          <div className="sq-modal-card">
            <div className="sq-modal-title">Edit Player</div>

            <label className="sq-lab">Name</label>
            <input className="sq-input" value={editing.player_name || ""} onChange={(e) => setEditing({ ...editing, player_name: e.target.value })} />

            <label className="sq-lab">Role</label>
            <select className="sq-input" value={editing.skill_type?.startsWith("All Rounder") ? "All Rounder" : editing.skill_type || "Batsman"} onChange={(e) => setEditing({ ...editing, skill_type: e.target.value })}>
              <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicketkeeper/Batsman</option>
            </select>

            <RoleFields role={editing.skill_type?.startsWith("All Rounder") ? "All Rounder" : editing.skill_type || "Batsman"} values={editVals} setValues={setEditVals} />

            <div className="sq-modal-actions">
              <button className="sq-btn" onClick={() => setEditing(null)} type="button">Cancel</button>
              <button className="sq-btn primary" onClick={doUpdatePlayer} type="button">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showTeamModal && (
        <div className="sq-modal" role="dialog" aria-modal="true">
          <div className="sq-modal-card">
            <div className="sq-modal-title">Add New Team</div>
            <label className="sq-lab">Team name</label>
            <input className="sq-input" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g., Ireland" />
            <div className="sq-modal-actions">
              <button className="sq-btn" onClick={() => setShowTeamModal(false)} type="button">Cancel</button>
              <button className="sq-btn primary" onClick={addTeam} type="button">Add Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="sq-modal" role="dialog" aria-modal="true" onClick={() => setShowImport(false)}>
          <div className="sq-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sq-modal-title">Import players from another format</div>
            <div className="sq-grid-2" style={{ marginBottom: 8 }}>
              <div />
              <select className="sq-input" value={importFromFormat} onChange={(e) => setImportFromFormat(e.target.value)}>
                {FORMATS.filter((f) => f !== format).map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="sq-listbox">
              {importLoading ? <div className="sq-empty">Loading…</div> :
                !importList.length ? <div className="sq-empty">Nothing to import — all players already exist in {format}.</div> :
                importList.map((p) => (
                  <label key={p.id} className="sq-row">
                    <input type="checkbox" checked={importPick.has(p.id)} onChange={() => toggleImportPick(p.id)} />
                    <span className="sq-row-name">{p.player_name}</span>
                    <span className="sq-row-sub">{p.batting_style || "—"} • {p.bowling_type || "—"}</span>
                  </label>
                ))}
            </div>
            <div className="sq-modal-actions">
              <button className="sq-btn" onClick={() => setShowImport(false)} type="button">Close</button>
              <button className="sq-btn primary" onClick={doImportSelected} type="button">Add Selected</button>
            </div>
          </div>
        </div>
      )}

      {/* Copy-to Modal */}
      {copyFromPlayer && (
        <div className="sq-modal" role="dialog" aria-modal="true" onClick={() => setCopyFromPlayer(null)}>
          <div className="sq-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sq-modal-title">Copy “{copyFromPlayer.player_name}” to…</div>
            <div className="sq-checks">
              {FORMATS.filter((f) => f !== format).map((f) => (
                <label key={f} className={`sq-check ${copyExists[f] ? "dim" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={copyExists[f]}
                    checked={copyTargets.has(f)}
                    onChange={() => toggleCopyTarget(f)}
                  />
                  <span>{f}</span>
                  {copyExists[f] && <span className="sq-badge">already in</span>}
                </label>
              ))}
            </div>
            <div className="sq-modal-actions">
              <button className="sq-btn" onClick={() => setCopyFromPlayer(null)} type="button">Cancel</button>
              <button className="sq-btn primary" onClick={doCopyPlayer} disabled={copyLoading} type="button">Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="sq-modal" role="dialog" aria-modal="true" onClick={() => setShowHelp(false)}>
          <div className="sq-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sq-modal-title">How Squad & Lineup Builder Works</div>
            <ul className="sq-help-list">
              <li><b>Team & Format</b> — pick a team and ODI/T20/TEST. You can <i>Add Team</i> if it doesn’t exist.</li>
              <li><b>Add Player</b> — type the name; suggestions show existing players. Choose role; the form asks for batting/bowling specifics.</li>
              <li><b>Reuse across formats</b> — click <b>📥 Import</b> (bulk) or use <b>⇄ Copy to…</b> on a player card.</li>
              <li><b>Search Squad</b> — filters players in this team’s current-format squad.</li>
              <li><b>Build Lineup</b> — drag Squad → Lineup, reorder inside Lineup. Max <b>12</b> (one 12th).</li>
              <li><b>C / VC</b> — set exactly one of each; must be different.</li>
              <li><b>Save</b> — Rive animation + toast confirms save; “Already saved” appears if nothing changed.</li>
            </ul>
            <div className="sq-modal-actions">
              <button className="sq-btn primary" onClick={() => setShowHelp(false)} type="button">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
