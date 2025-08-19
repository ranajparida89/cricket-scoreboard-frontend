// Team-wise + Format-wise Squad & Lineup (clean UI)
// - Logic unchanged: same endpoints, DnD flows, validations.
// - UX: simpler 2-lane board, collapsible Memberships panel, soft-glow Help button, Import-from-format.
// - [FIX] Crash on 2nd visit: sanitize teams list from localStorage (strings only) + persist cleaned list
// - [FIX] Avoid state updates after unmount in async effects
// - [NEW] “+ Team” quick add; persists safely
// - [NEW] Multi-format soft-green highlight
// - [NEW] Delete-from-ALL-formats -> single backend call (?all=true&force=true)

import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  fetchPlayers,
  suggestPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,   // ⬅ will pass opts {force:true} / {all:true,force:true}
  getLineup,
  saveLineup,
} from "../services/api";
import "./SquadLineup.css";
import { useAuth } from "../services/auth";

/* ---- constants & helpers ---- */
const FORMATS = ["ODI", "T20", "TEST"];
const DEFAULT_TEAMS = ["India","Australia","England","New Zealand","Pakistan","South Africa","Sri Lanka","Bangladesh","Afghanistan"];
const MAX_LINEUP = 12;
const MIN_LINEUP = 11;

const ci = (s) => (s || "").trim().toLowerCase();
const ciEq = (a, b) => ci(a) === ci(b);
const iconFor = (p) => {
  const role = (p?.skill_type || "").toLowerCase();
  if (role.includes("wicket")) return "🧤";
  if (role.includes("all")) return "🏏🔴";
  if (role.includes("bowl")) return "🔴";
  return "🏏";
};
const buildBowlingType = (v) => {
  if (!v?.bowl_kind) return "";
  const arm = v.bowl_arm ? `${v.bowl_arm} ` : "";
  if (v.bowl_kind === "Pace" && v.pace_type) return `${arm}${v.pace_type}`.trim();
  if (v.bowl_kind === "Spin" && v.spin_type) return `${arm}${v.spin_type}`.trim();
  return "";
};

/* [FIX] team storage sanitizers — prevents React error #31 */
function coerceTeamItem(x) {
  if (typeof x === "string") return x.trim();
  if (x && typeof x === "object") {
    const s = String(x.name ?? x.label ?? x.value ?? "").trim();
    return s;
  }
  return "";
}
function cleanTeams(list) {
  const arr = Array.isArray(list) ? list : [];
  const cleaned = arr.map(coerceTeamItem).filter(Boolean);
  const seen = new Set();
  const uniq = [];
  for (const t of cleaned) {
    const k = ci(t);
    if (!seen.has(k)) { seen.add(k); uniq.push(t); }
  }
  return uniq.length ? uniq : DEFAULT_TEAMS.slice();
}
function saveTeamsLocal(teams) {
  try { localStorage.setItem("crickedge_teams", JSON.stringify(teams.map(coerceTeamItem).filter(Boolean))); }
  catch {}
}

/* ---- toasts ---- */
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

/* ---- role fields for Add/Edit ---- */
function RoleFields({ role, values, setValues }) {
  const set = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));
  const showBat = ["batsman", "wicketkeeper/batsman", "all rounder"].includes((role||"").toLowerCase());
  const showBowl = ["bowler", "all rounder"].includes((role||"").toLowerCase());

  return (
    <div className="sq-role-fields">
      {showBat && (
        <>
          <label className="sq-lab">Batting Style</label>
          <div className="sq-grid-2">
            <select className="sq-input" value={values.batting_style || ""} onChange={(e) => set("batting_style", e.target.value)}>
              <option value="">Select…</option>
              <option>Right-hand Bat</option>
              <option>Left-hand Bat</option>
            </select>
            {(role||"").toLowerCase()==="all rounder" && (
              <select className="sq-input" value={values.allrounder_type || ""} onChange={(e) => set("allrounder_type", e.target.value)}>
                <option value="">Allrounder Type…</option>
                <option>Batting Allrounder</option>
                <option>Bowling Allrounder</option>
                <option>Genuine Allrounder</option>
              </select>
            )}
          </div>
        </>
      )}

      {showBowl && (
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

/* ================== MAIN ================== */
export default function SquadLineup({ isAdmin = true }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || null;

  /* [FIX] team + format — sanitize teams from localStorage */
  const [teams, setTeams] = useState(() => {
    try { return cleanTeams(JSON.parse(localStorage.getItem("crickedge_teams"))); }
    catch { return DEFAULT_TEAMS.slice(); }
  });
  const [team, setTeam] = useState(() => (cleanTeams(JSON.parse(localStorage.getItem("crickedge_teams")))[0] || "India"));
  const [format, setFormat] = useState("ODI");

  /* data: squads per format for this team */
  const [squads, setSquads] = useState({ ODI: [], T20: [], TEST: [] });
  const [lineup, setLineup] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceId, setViceId] = useState(null);

  /* add/edit */
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("Batsman");
  const [addVals, setAddVals] = useState({ batting_style:"", bowl_kind:"", bowl_arm:"", pace_type:"", spin_type:"", allrounder_type:"" });
  const [editing, setEditing] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [suggests, setSuggests] = useState([]);

  /* UI */
  const [searchSquad, setSearchSquad] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [showRoster, setShowRoster] = useState(false);
  const [searchRoster, setSearchRoster] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const { toasts, push, close } = useToasts();

  /* [FIX] persist the sanitized teams back on first render and whenever teams change */
  useEffect(() => { saveTeamsLocal(teams); }, [teams]);

  /* [NEW] quick add team */
  const addTeamPrompt = () => {
    const name = (window.prompt("Add Team/Country name:") || "").trim();
    if (!name) return;
    const next = cleanTeams([...teams, name]);
    setTeams(next);
    saveTeamsLocal(next);
    setTeam(name);
    setTimeout(() => loadAll(name).catch(()=>{}), 0);
    push(`Team “${name}” added`, "success");
  };

  /* load all squads for this team */
  const loadAll = async (t) => {
    const [odi, t20, test] = await Promise.all([
      fetchPlayers(t, "ODI"),
      fetchPlayers(t, "T20"),
      fetchPlayers(t, "TEST"),
    ]);
    setSquads({ ODI: odi || [], T20: t20 || [], TEST: test || [] });
  };

  useEffect(() => {
    let alive = true; // [FIX] avoid setState after unmount
    (async () => {
      try {
        const [odi, t20, test] = await Promise.all([
          fetchPlayers(team, "ODI"),
          fetchPlayers(team, "T20"),
          fetchPlayers(team, "TEST"),
        ]);
        if (!alive) return;
        setSquads({ ODI: odi || [], T20: t20 || [], TEST: test || [] });
      } catch (e) {
        if (alive) push("Failed to load squads", "error");
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  useEffect(() => {
    let alive = true; // [FIX]
    (async () => {
      try {
        const L = await getLineup(team, format);
        if (!alive) return;
        if (L?.lineup?.length) {
          const items = L.lineup.map((it, i) => ({
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
          setLineup(items);
          setCaptainId(L.captain_id || null);
          setViceId(L.vice_id || null);
        } else {
          setLineup([]); setCaptainId(null); setViceId(null);
        }
      } catch (e) {
        if (alive) { setLineup([]); setCaptainId(null); setViceId(null); }
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, format]);

  /* suggestions while typing */
  useEffect(() => {
    const q = addName.trim();
    if (q.length < 2) { setSuggests([]); return; }
    let ok = true;
    (async () => {
      try { const s = await suggestPlayers(team, q); if (ok) setSuggests(s || []); }
      catch { if (ok) setSuggests([]); }
    })();
    return () => { ok = false; };
  }, [addName, team]);

  /* roster union */
  const roster = useMemo(() => {
    const map = new Map();
    for (const F of FORMATS) {
      for (const p of (squads[F] || [])) {
        const k = ci(p.player_name);
        if (!map.has(k)) map.set(k, { name: p.player_name, sample: p, fmtIds: { ODI:null, T20:null, TEST:null } });
        const row = map.get(k);
        row.fmtIds[F] = p.id;
        const s = row.sample || {};
        const richness = (x) => (!!x.batting_style) + (!!x.bowling_type) + (!!x.skill_type);
        if (richness(p) > richness(s)) row.sample = p;
      }
    }
    return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name));
  }, [squads]);

  const idsInLineup = new Set(lineup.map((x) => x.player_id));

  const isMultiByName = (name) => {
    const key = ci(name);
    let count = 0;
    for (const F of FORMATS) {
      if ((squads[F] || []).some((p) => ci(p.player_name) === key)) count++;
    }
    return count >= 2;
  };

  const currentSquad = useMemo(() => {
    const list = squads[format] || [];
    const q = ci(searchSquad);
    return list
      .filter((p) => !idsInLineup.has(p.id))
      .filter((p) => filterRole==="ALL" ? true : ci(p.skill_type)===ci(filterRole))
      .filter((p) => !q || ci(p.player_name).includes(q))
      .sort((a,b)=>a.player_name.localeCompare(b.player_name));
  }, [squads, format, lineup, searchSquad, filterRole, idsInLineup]);

  /* toggle membership chip */
  const toggleMembership = async (person, destFormat) => {
    const id = person.fmtIds[destFormat];
    if (id) {
      try {
        await deletePlayer(id, { force: true }); // [FIX] force to satisfy FK if any
        setSquads((prev) => ({ ...prev, [destFormat]: (prev[destFormat] || []).filter((x) => x.id !== id) }));
        if (destFormat === format) {
          setLineup((prev) => {
            const items = prev.filter((x) => x.player_id !== id);
            return items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 }));
          });
          if (captainId === id) setCaptainId(null);
          if (viceId === id) setViceId(null);
        }
        push(`Removed from ${destFormat}`, "success");
      } catch { push("Failed to remove membership", "error"); }
      return;
    }
    try {
      if (!userId) { push("Please sign in to add players.", "error"); return; }
      const payload = {
        player_name: person.name,
        team_name: team,
        lineup_type: destFormat,
        skill_type: person.sample?.skill_type || "Batsman",
        batting_style: person.sample?.batting_style || "",
        bowling_type: person.sample?.bowling_type || "",
        user_id: userId,
      };
      const created = await createPlayer(payload);
      setSquads((prev) => ({ ...prev, [destFormat]: [...(prev[destFormat]||[]), created] }));
      push(`Added to ${destFormat}`, "success");
    } catch (e) {
      const s = e?.response?.status;
      if (s === 409) push("Already in that format", "info");
      else push(e?.response?.data?.error || "Failed to add membership", "error");
    }
  };

  /* add brand-new player (current format) */
  const addNew = async () => {
    const name = addName.trim();
    if (!name) return;
    if ((squads[format] || []).some((p) => ciEq(p.player_name, name))) { push("Player already exists in this format's squad", "error"); return; }
    if (!userId) { push("Please sign in to add players.", "error"); return; }
    const bowling_type = buildBowlingType(addVals);
    const skill = addRole === "All Rounder" && addVals.allrounder_type ? `All Rounder (${addVals.allrounder_type})` : addRole;
    try {
      const created = await createPlayer({
        player_name: name,
        team_name: team,
        lineup_type: format,
        skill_type: skill,
        batting_style: addVals.batting_style || "",
        bowling_type,
        user_id: userId,
      });
      setSquads((prev) => ({ ...prev, [format]: [...prev[format], created] }));
      setAddName(""); setSuggests([]);
      setAddVals({ batting_style:"", bowl_kind:"", bowl_arm:"", pace_type:"", spin_type:"", allrounder_type:"" });
      push(`Added ${created.player_name} to ${team} ${format}`, "success");
    } catch (e) { push(e?.response?.data?.error || "Failed to add", "error"); }
  };

  /* edit/delete existing membership row */
  const openEdit = (p) => {
    setEditing(p);
    const vals = { batting_style: p.batting_style || "", bowl_kind:"", bowl_arm:"", pace_type:"", spin_type:"", allrounder_type:"" };
    if ((p.skill_type||"").toLowerCase().startsWith("all rounder (batting")) vals.allrounder_type="Batting Allrounder";
    else if ((p.skill_type||"").toLowerCase().startsWith("all rounder (bowling")) vals.allrounder_type="Bowling Allrounder";
    else if ((p.skill_type||"").toLowerCase().startsWith("all rounder (genuine")) vals.allrounder_type="Genuine Allrounder";
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

  const doUpdate = async () => {
    if (!editing) return;
    const bowling_type = buildBowlingType(editVals);
    const skill = editing.skill_type?.startsWith("All Rounder")
      ? (editVals.allrounder_type ? `All Rounder (${editVals.allrounder_type})` : "All Rounder")
      : editing.skill_type;
    try {
      const upd = await updatePlayer(editing.id, {
        player_name: editing.player_name,
        team_name: team,
        lineup_type: editing.lineup_type,
        skill_type: skill,
        batting_style: editVals.batting_style || "",
        bowling_type,
        profile_url: editing.profile_url,
      });
      setSquads((prev) => ({
        ...prev,
        [editing.lineup_type]: (prev[editing.lineup_type] || []).map((x) => (x.id === upd.id ? upd : x)),
      }));
      setLineup((prev) => prev.map((x) => x.player_id === upd.id ? { ...x, obj: { ...x.obj, ...upd } } : x));
      setEditing(null);
      push("Updated", "success");
    } catch { push("Update failed", "error"); }
  };

  const doDelete = async (id) => {
    if (!window.confirm("Delete this player from the format squad?")) return;
    try {
      await deletePlayer(id, { force: true }); // [FIX] tell backend to also clear perf rows if needed
      setSquads((p) => ({ ...p, [format]: (p[format] || []).filter((x) => x.id !== id) }));
      setLineup((prev) => {
        const items = prev.filter((x) => x.player_id !== id);
        return items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 }));
      });
      if (captainId === id) setCaptainId(null);
      if (viceId === id) setViceId(null);
      push("Deleted", "success");
    } catch { push("Delete failed", "error"); }
  };

  /* [NEW] Delete from ALL formats — single backend call */
  const deleteEverywhere = async (name) => {
    if (!window.confirm(`Delete “${name}” from ALL formats for ${team}?`)) return;
    // find any id for that name in this team
    const any =
      (squads.ODI || []).find(p => ci(p.player_name) === ci(name)) ||
      (squads.T20 || []).find(p => ci(p.player_name) === ci(name)) ||
      (squads.TEST || []).find(p => ci(p.player_name) === ci(name));
    if (!any) return;

    try {
      await deletePlayer(any.id, { all: true, force: true }); // ⬅ backend cleans lineups & performances
      // remove from all 3 local lists + lineup if present
      setSquads(prev => ({
        ODI:  (prev.ODI  || []).filter(p => ci(p.player_name) !== ci(name)),
        T20:  (prev.T20  || []).filter(p => ci(p.player_name) !== ci(name)),
        TEST: (prev.TEST || []).filter(p => ci(p.player_name) !== ci(name)),
      }));
      setLineup(prev => {
        const items = prev.filter(it => ci(it.obj.player_name) !== ci(name));
        return items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 }));
      });
      if (editing && ci(editing.player_name) === ci(name)) setEditing(null);
      push(`Deleted “${name}” from all formats`, "success");
    } catch {
      push("Delete-all failed", "error");
    }
  };

  /* Import from another format into current format (skips duplicates) */
  const importFrom = async (sourceFormat) => {
    if (sourceFormat === format) return;
    const source = squads[sourceFormat] || [];
    if (!source.length) { push(`No players in ${sourceFormat} to import`, "info"); return; }
    const current = new Set((squads[format] || []).map(p => ci(p.player_name)));
    let added = 0, failed = 0;
    for (const p of source) {
      if (current.has(ci(p.player_name))) continue;
      try {
        if (!userId) { failed++; continue; }
        const created = await createPlayer({
          player_name: p.player_name,
          team_name: team,
          lineup_type: format,
          skill_type: p.skill_type || "Batsman",
          batting_style: p.batting_style || "",
          bowling_type: p.bowling_type || "",
          profile_url: p.profile_url || null,
          user_id: userId,
        });
        added++;
        setSquads((prev) => ({ ...prev, [format]: [...(prev[format]||[]), created] }));
      } catch { failed++; }
    }
    if (added || failed) push(`Imported ${added}${failed ? `, failed ${failed}` : ""}`, added ? "success" : "error");
  };

  /* DnD (Squad <-> Lineup) */
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === "lineup" && destination.droppableId === "lineup") {
      const items = Array.from(lineup);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      setLineup(items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 })));
      return;
    }

    if (source.droppableId === "squad" && destination.droppableId === "lineup") {
      if (lineup.length >= MAX_LINEUP) { push(`Max ${MAX_LINEUP} players allowed in lineup`, "error"); return; }
      const p = currentSquad[source.index];
      if (!p) return;
      if (lineup.some((x) => x.player_id === p.id || ciEq(x.obj.player_name, p.player_name))) {
        push("Already in lineup", "info");
        return;
      }
      setLineup((prev) => [
        ...prev,
        { player_id: p.id, order_no: prev.length + 1, is_twelfth: prev.length + 1 === 12, obj: p },
      ]);
      return;
    }

    if (source.droppableId === "lineup" && destination.droppableId === "squad") {
      const items = Array.from(lineup);
      const [removed] = items.splice(source.index, 1);
      if (removed?.player_id === captainId) setCaptainId(null);
      if (removed?.player_id === viceId) setViceId(null);
      setLineup(items.map((x, i) => ({ ...x, order_no: i + 1, is_twelfth: i === 11 })));
    }
  };

  /* save lineup */
  const onSave = async () => {
    if (lineup.length < MIN_LINEUP) return push(`At least ${MIN_LINEUP} players required`, "error");
    if (!captainId || !viceId) return push("Pick one Captain and one Vice-captain", "error");
    if (captainId === viceId) return push("Captain and Vice-captain must be different", "error");
    try {
      await saveLineup({
        team_name: team,
        lineup_type: format,
        captain_player_id: captainId,
        vice_captain_player_id: viceId,
        players: lineup.map((x) => ({ player_id: x.player_id, order_no: x.order_no, is_twelfth: !!x.is_twelfth })),
      });
      push("Lineup saved", "success");
    } catch (e) { push(e?.response?.data?.error || "Failed to save lineup", "error"); }
  };

  const presenceIn = (nameKey) => {
    const fmt = { ODI:false, T20:false, TEST:false };
    for (const F of FORMATS) {
      if ((squads[F] || []).some((p) => ci(p.player_name) === nameKey)) fmt[F] = true;
    }
    return fmt;
  };

  /* ===== UI ===== */
  return (
    <div className="sq-wrap">
      <Toasts list={toasts} onClose={close} />

      {/* Header */}
      <header className="sq-header">
        <div className="sq-title">
          <div className="sq-title-line">
            <span className="sq-big">Build Lineup</span>
            <button className="sq-icon-btn info" title="How this page works" onClick={() => setShowHelp(true)} type="button">i</button>
          </div>
          <div className="sq-steps">
            <span className="sq-step on">1. Add to squad</span>
            <span className="sq-step on">2. Drag to lineup</span>
            <span className="sq-step on">3. Set C & VC</span>
            <span className="sq-step">4. Save</span>
          </div>
        </div>

        <div className="sq-ctlbar">
          {/* [NEW] safer Team select + +Team */}
          <div className="sq-team-select">
            <label className="sq-mini">Team</label>
            <div className="sq-team-row">
              <select
                className="sq-select"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                {cleanTeams(teams).map((t) => (
                  <option key={String(t)} value={String(t)}>
                    {String(t)}
                  </option>
                ))}
              </select>
              <button className="sq-btn ghost" onClick={addTeamPrompt} type="button">+ Team</button>
            </div>
          </div>

          <div className="sq-format-tabs">
            {FORMATS.map((f) => (
              <button key={f} className={`sq-tab ${format===f?"active":""}`} onClick={() => setFormat(f)} type="button">
                {f}
              </button>
            ))}
          </div>

          <div className="sq-import">
            <label className="sq-mini">Quick import</label>
            <div className="sq-import-row">
              {FORMATS.filter(f => f!==format).map((f) => (
                <button key={f} className="sq-btn ghost" onClick={() => importFrom(f)} type="button">From {f}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Add to current-format squad */}
        <div className="sq-addbar">
          <div className="sq-add-left">
            <input className="sq-input" placeholder={`Add to ${team} ${format} squad… (type for suggestions)`} value={addName} onChange={(e) => setAddName(e.target.value)} />
            {!!suggests.length && (
              <div className="sq-suggest">
                {suggests.map((s) => {
                  const text = s.name || s.player_name || "";
                  const pf = presenceIn(ci(text));
                  return (
                    <div key={`${text}-${s.team||team}`} className="sq-suggest-item" onClick={() => setAddName(text)}>
                      <span>{text}</span>
                      <span className="sq-suggest-note">
                        {["ODI","T20","TEST"].map((F) => (
                          <span key={F} style={{marginLeft:8, opacity: pf[F] ? 1 : .5}}>
                            {F}{pf[F] ? "✓" : "—"}
                          </span>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <select className="sq-role" value={addRole} onChange={(e) => setAddRole(e.target.value)}>
            <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicketkeeper/Batsman</option>
          </select>
          <button className="sq-btn" onClick={addNew} type="button">Add</button>
        </div>
        <RoleFields role={addRole} values={addVals} setValues={setAddVals} />
      </header>

      {/* Filters + Roster toggle */}
      <div className="sq-toprow">
        <div className="sq-filters">
          <input className="sq-input" placeholder={`Search ${format} squad…`} value={searchSquad} onChange={(e)=>setSearchSquad(e.target.value)} />
          <select className="sq-select" value={filterRole} onChange={(e)=>setFilterRole(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All Rounder">All Rounder</option>
            <option value="Wicketkeeper/Batsman">Wicketkeeper/Batsman</option>
          </select>
        </div>

        <button className="sq-btn ghost" onClick={() => setShowRoster(v => !v)} type="button">
          {showRoster ? "Hide" : "Manage memberships"}
        </button>
      </div>

      {/* Collapsible Roster (union of formats) */}
      {showRoster && (
        <div className="sq-roster">
          <div className="sq-roster-head">
            <div className="sq-panel-title">👥 Team Roster (union of ODI/T20/TEST)</div>
            <input className="sq-input" placeholder="Search roster…" value={searchRoster} onChange={(e)=>setSearchRoster(e.target.value)} />
          </div>
          <div className="sq-roster-list">
            {roster
              .filter((r) => !searchRoster || ci(r.name).includes(ci(searchRoster)))
              .map((r, idx) => {
                const has2plus = (["ODI","T20","TEST"].filter(F => !!r.fmtIds[F])).length >= 2;
                return (
                  <div key={`ro-${idx}`} className={`sq-card ${has2plus ? "multi" : ""}`}>
                    <div className="sq-card-left">
                      <span className="sq-ico">{iconFor(r.sample)}</span>
                      <div>
                        <div className="sq-name">{r.name}</div>
                        <div className="sq-sub">{r.sample?.batting_style || "—"} • {r.sample?.bowling_type || "—"}</div>
                      </div>
                    </div>
                    <div className="sq-actions">
                      {FORMATS.map((F) => {
                        const on = !!r.fmtIds[F];
                        return (
                          <button
                            key={F}
                            className={`sq-chip ${on?"on":""}`}
                            title={`${on?"Remove from":"Add to"} ${F}`}
                            onClick={() => toggleMembership(r, F)}
                            type="button"
                          >
                            {F}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            {!roster.length && <div className="sq-empty">No players yet. Add to squad above.</div>}
          </div>
        </div>
      )}

      {/* Board: Squad + Lineup */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid-2">
          {/* Squad (current format) */}
          <Droppable droppableId="squad">
            {(provided) => (
              <div className="sq-panel" ref={provided.innerRef} {...provided.droppableProps}>
                <div className="sq-panel-title">🧢 {format} Squad ({(squads[format]||[]).length})</div>
                {currentSquad.map((p, idx) => (
                  <Draggable key={`p-${p.id}`} draggableId={`p-${p.id}`} index={idx}>
                    {(prov) => (
                      <div className={`sq-card ${isMultiByName(p.player_name) ? "multi" : ""}`} ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <div className="sq-card-left">
                          <span className="sq-ico">{iconFor(p)}</span>
                          <div>
                            <div className="sq-name">{p.player_name}</div>
                            <div className="sq-sub">{p.batting_style || "—"} • {p.bowling_type || "—"}</div>
                          </div>
                        </div>
                        <div className="sq-actions">
                          <button className="sq-icon-btn" title="Edit" onClick={() => openEdit(p)} type="button">✏️</button>
                          {isAdmin && <button className="sq-icon-btn danger" title="Delete from this format" onClick={() => doDelete(p.id)} type="button">🗑️</button>}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {!currentSquad.length && <div className="sq-empty">No available players (others may be in Lineup). Add new or import.</div>}
              </div>
            )}
          </Droppable>

          {/* Lineup */}
          <Droppable droppableId="lineup">
            {(provided) => (
              <div className="sq-panel lineup" ref={provided.innerRef} {...provided.droppableProps}>
                <div className="sq-panel-title">🎯 {format} Lineup ({lineup.length}/{MAX_LINEUP})</div>
                {lineup.map((x, idx) => (
                  <Draggable key={`l-${x.player_id}`} draggableId={`l-${x.player_id}`} index={idx}>
                    {(prov) => (
                      <div className="sq-card" ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <div className="sq-card-left">
                          <span className="sq-order">{idx + 1}</span>
                          <span className="sq-ico">{iconFor(x.obj)}</span>
                          <div className="sq-name">{x.obj.player_name}</div>
                          {idx === 11 && <span className="sq-tag">12th</span>}
                          {x.player_id === captainId && <span className="sq-tag gold">C</span>}
                          {x.player_id === viceId && <span className="sq-tag teal">VC</span>}
                        </div>
                        <div className="sq-actions">
                          <button className={`sq-chip ${x.player_id===captainId?"on":""}`} onClick={() => { if (x.player_id===viceId) setViceId(null); setCaptainId((p)=>p===x.player_id?null:x.player_id); }} type="button">C</button>
                          <button className={`sq-chip ${x.player_id===viceId?"on":""}`} onClick={() => { if (x.player_id===captainId) setCaptainId(null); setViceId((p)=>p===x.player_id?null:x.player_id); }} type="button">VC</button>
                          <button className="sq-icon-btn" title="Remove from lineup" onClick={() => {
                            const items = lineup.filter((it) => it.player_id !== x.player_id);
                            if (x.player_id === captainId) setCaptainId(null);
                            if (x.player_id === viceId) setViceId(null);
                            setLineup(items.map((p, i) => ({ ...p, order_no: i + 1, is_twelfth: i === 11 })));
                          }} type="button">➖</button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {!lineup.length && <div className="sq-empty">Drag from Squad to build XI (max 12; one 12th).</div>}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Save bar */}
      <div className="sq-savebar">
        <div>
          <strong>{lineup.length}</strong> selected • C: {captainId ? (squads[format]?.find((p)=>p.id===captainId)?.player_name || "—") : "—"}
          {"  "}• VC: {viceId ? (squads[format]?.find((p)=>p.id===viceId)?.player_name || "—") : "—"}
        </div>
        <button className="sq-btn primary" onClick={onSave} type="button">Save Lineup</button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="sq-modal" role="dialog" aria-modal="true">
          <div className="sq-modal-card">
            <div className="sq-modal-title">Edit Player (format membership)</div>
            <label className="sq-lab">Name</label>
            <input className="sq-input" value={editing.player_name || ""} onChange={(e)=>setEditing({ ...editing, player_name: e.target.value })} />
            <label className="sq-lab">Role</label>
            <select className="sq-input" value={editing.skill_type?.startsWith("All Rounder") ? "All Rounder" : (editing.skill_type || "Batsman")} onChange={(e)=>setEditing({ ...editing, skill_type: e.target.value })}>
              <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicketkeeper/Batsman</option>
            </select>
            <RoleFields role={editing.skill_type?.startsWith("All Rounder") ? "All Rounder" : (editing.skill_type || "Batsman")} values={editVals} setValues={setEditVals} />

            {/* Danger zone */}
            <div className="sq-danger-zone">
              <div style={{marginBottom:8, opacity:.9}}>Danger zone</div>
              <button
                className="sq-btn danger"
                onClick={() => deleteEverywhere(editing.player_name)}
                type="button"
              >
                Delete “{editing.player_name}” from ALL formats
              </button>
            </div>

            <div className="sq-modal-actions">
              <button className="sq-btn" onClick={()=>setEditing(null)} type="button">Cancel</button>
              <button className="sq-btn primary" onClick={doUpdate} type="button">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="sq-modal" role="dialog" aria-modal="true" onClick={() => setShowHelp(false)}>
          <div className="sq-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sq-modal-title">How this page works</div>
            <ul className="sq-help-list">
              <li><b>Pick Team & Format</b> at the top. Use <i>Quick import</i> to copy players from a different format into the current format (duplicates are skipped).</li>
              <li><b>Add to Squad</b> with role & batting/bowling details. Suggestions show where this name already exists.</li>
              <li><b>Build Lineup</b> by dragging from Squad → Lineup. Reorder by dragging inside Lineup. Max 12 (includes one 12th).</li>
              <li><b>C & VC</b> — exactly one Captain and one Vice-captain; must be different.</li>
              <li><b>Manage memberships</b> expands the full team roster (union of formats) with chips to add/remove a player to ODI/T20/TEST.</li>
              <li><b>Save</b> stores the current lineup for the selected team & format.</li>
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
