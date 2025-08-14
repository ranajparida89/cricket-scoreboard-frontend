// src/components/SquadLineup.js
// Team-wise Master Bench + ODI/T20/TEST squads with copy-by-drag + Lineup builder
// Rive toasts retained. No "Import" or "Copy to" modals anymore.

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
  return (
    <div className={className} aria-hidden="true">
      {RiveComponent ? <RiveComponent /> : null}
    </div>
  );
}

/* Helpers */
const DEFAULT_TEAMS = [
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

const iconFor = (p) => {
  const role = (p?.skill_type || "").toLowerCase();
  if (role.includes("wicket")) return "🧤🏏";
  if (role.includes("all")) return "🏏🔴";
  if (role.includes("bowl")) return "🔴";
  return "🏏";
};

function Toasts({ toasts, onClose }) {
  return (
    <div className="sq-toasts">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`sq-toast ${t.type || "info"}`}
          onClick={() => onClose(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* Role-aware fields (Add + Edit) */
function RoleFields({ role, values, setValues }) {
  const set = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));

  const showBatting = ["batsman", "wicketkeeper/batsman", "all rounder"].includes(
    (role || "").toLowerCase()
  );
  const showBowling = ["bowler", "all rounder"].includes(
    (role || "").toLowerCase()
  );

  return (
    <div className="sq-role-fields">
      {showBatting && (
        <>
          <label className="sq-lab">Batting Style</label>
          <div className="sq-grid-2">
            <select
              className="sq-input"
              value={values.batting_style || ""}
              onChange={(e) => set("batting_style", e.target.value)}
            >
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
            <select
              className="sq-input"
              value={values.bowl_kind || ""}
              onChange={(e) => set("bowl_kind", e.target.value)}
            >
              <option value="">Select Kind…</option>
              <option>Pace</option>
              <option>Spin</option>
            </select>

            <select
              className="sq-input"
              value={values.bowl_arm || ""}
              onChange={(e) => set("bowl_arm", e.target.value)}
              disabled={!values.bowl_kind}
            >
              <option value="">Arm…</option>
              <option>Right-arm</option>
              <option>Left-arm</option>
            </select>

            {values.bowl_kind === "Pace" ? (
              <select
                className="sq-input"
                value={values.pace_type || ""}
                onChange={(e) => set("pace_type", e.target.value)}
              >
                <option value="">Type…</option>
                <option>Fast</option>
                <option>Medium Fast</option>
              </select>
            ) : values.bowl_kind === "Spin" ? (
              <select
                className="sq-input"
                value={values.spin_type || ""}
                onChange={(e) => set("spin_type", e.target.value)}
              >
                <option value="">Spin…</option>
                <option>Off Spin</option>
                <option>Leg Spin</option>
                <option>Left-arm Orthodox</option>
                <option>Left-arm Wrist Spin</option>
              </select>
            ) : (
              <select className="sq-input" disabled>
                <option>Type…</option>
              </select>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* bowling_type builder */
function buildBowlingType(vals) {
  if (!vals?.bowl_kind) return "";
  const arm = vals.bowl_arm ? `${vals.bowl_arm} ` : "";
  if (vals.bowl_kind === "Pace" && vals.pace_type)
    return `${arm}${vals.pace_type}`.trim();
  if (vals.bowl_kind === "Spin" && vals.spin_type)
    return `${arm}${vals.spin_type}`.trim();
  return "";
}

/* -------- Component -------- */
export default function SquadLineup({ isAdmin = true }) {
  /* Teams */
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem("crickedge_teams");
    return saved ? JSON.parse(saved) : DEFAULT_TEAMS;
  });
  const [team, setTeam] = useState(teams[0] || "India");

  /* Bench (master squad) – persisted per team in localStorage only */
  const benchKey = (t) => `crickedge_bench_${ci(t)}`;
  const [bench, setBench] = useState(() => {
    try {
      const raw = localStorage.getItem(benchKey(team));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(benchKey(team), JSON.stringify(bench));
    } catch {}
  }, [bench, team]);

  /* Format state */
  const [format, setFormat] = useState("ODI");
  const [lists, setLists] = useState({ ODI: [], T20: [], TEST: [] }); // server squads
  const [lineup, setLineup] = useState([]); // current format lineup
  const [captainId, setCaptainId] = useState(null);
  const [viceId, setViceId] = useState(null);
  const [lastSavedSig, setLastSavedSig] = useState(null);

  /* Add/Edit */
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("Batsman");
  const [addVals, setAddVals] = useState({
    batting_style: "",
    bowl_kind: "",
    bowl_arm: "",
    pace_type: "",
    spin_type: "",
    allrounder_type: "",
  });

  const [editing, setEditing] = useState(null);
  const [editVals, setEditVals] = useState({});

  const [suggests, setSuggests] = useState([]);
  const [search, setSearch] = useState("");

  /* Toasts */
  const [toasts, setToasts] = useState([]);
  const pushToast = (message, type = "info", ttl = 2600) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), ttl);
  };

  /* Rive */
  const [riv, setRiv] = useState({ empty: null, success: null, glow: null });
  const [showSaveCongrats, setShowSaveCongrats] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const empty = (await import("../assets/rive/empty_lineup.riv")).default;
        const success = (await import("../assets/rive/save_success.riv")).default;
        let glow = null;
        try {
          glow = (await import("../assets/rive/drop_glow.riv")).default;
        } catch {}
        if (alive) setRiv({ empty, success, glow });
      } catch {
        if (alive) setRiv({ empty: null, success: null, glow: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* Load squads (ODI/T20/TEST) + current lineup when team/format changes */
  const loadAll = async (t) => {
    const [odi, t20, test] = await Promise.all([
      fetchPlayers(t, "ODI"),
      fetchPlayers(t, "T20"),
      fetchPlayers(t, "TEST"),
    ]);
    setLists({ ODI: odi || [], T20: t20 || [], TEST: test || [] });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadAll(team);
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
          setLastSavedSig(
            JSON.stringify({
              team,
              format,
              c: L.captain_id || null,
              v: L.vice_id || null,
              arr: enriched.map((x) => [
                x.player_id,
                x.order_no,
                !!x.is_twelfth,
              ]),
            })
          );
        } else {
          setLineup([]);
          setCaptainId(null);
          setViceId(null);
          setLastSavedSig(
            JSON.stringify({ team, format, c: null, v: null, arr: [] })
          );
        }

        // refresh bench from storage for this team
        try {
          const raw = localStorage.getItem(benchKey(team));
          setBench(raw ? JSON.parse(raw) : []);
        } catch {
          setBench([]);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      active = false;
    };
  }, [team, format]);

  /* Suggestions */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const q = addName.trim();
      if (q.length < 2) {
        setSuggests([]);
        return;
      }
      try {
        const s = await suggestPlayers(team, q);
        if (mounted) setSuggests(s || []);
      } catch {
        if (mounted) setSuggests([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [addName, team]);

  /* Presence map for highlighting (by name) */
  const presenceCount = useMemo(() => {
    const map = new Map();
    for (const f of FORMATS) {
      (lists[f] || []).forEach((p) => {
        const key = ci(p.player_name);
        map.set(key, (map.get(key) || 0) + 1);
      });
    }
    return map; // name -> 1/2/3
  }, [lists]);

  /* Filtered lists for display */
  const searchLc = ci(search);
  const benchFiltered = useMemo(() => {
    return bench
      .filter((p) => !searchLc || ci(p.player_name).includes(searchLc))
      .sort((a, b) => a.player_name.localeCompare(b.player_name));
  }, [bench, searchLc]);

  const listFiltered = (fmt) =>
    (lists[fmt] || [])
      .filter((p) => !searchLc || ci(p.player_name).includes(searchLc))
      .sort((a, b) => a.player_name.localeCompare(b.player_name));

  /* Add to Bench (local only) */
  const onAddToBench = () => {
    const name = addName.trim();
    if (!name) return;

    // Already somewhere in bench?
    if (bench.some((p) => ciEq(p.player_name, name))) {
      pushToast("Already on bench", "error");
      return;
    }

    const newObj = {
      id: `bench-${Date.now()}`,
      player_name: name,
      skill_type:
        addRole === "All Rounder" && addVals.allrounder_type
          ? `All Rounder (${addVals.allrounder_type})`
          : addRole,
      batting_style: addVals.batting_style || "",
      bowling_type: buildBowlingType(addVals),
    };

    setBench((prev) => [...prev, newObj]);
    setAddName("");
    setSuggests([]);
    setAddVals({
      batting_style: "",
      bowl_kind: "",
      bowl_arm: "",
      pace_type: "",
      spin_type: "",
      allrounder_type: "",
    });
    pushToast(`Added ${newObj.player_name} to bench`, "success");
  };

  /* Update player (format squad only) */
  const openEdit = (p) => {
    setEditing(p);
    const vals = {
      batting_style: p.batting_style || "",
      bowl_kind: "",
      bowl_arm: "",
      pace_type: "",
      spin_type: "",
      allrounder_type: "",
    };

    if ((p.skill_type || "").toLowerCase().startsWith("all rounder (batting"))
      vals.allrounder_type = "Batting Allrounder";
    else if (
      (p.skill_type || "").toLowerCase().startsWith("all rounder (bowling")
    )
      vals.allrounder_type = "Bowling Allrounder";
    else if (
      (p.skill_type || "").toLowerCase().startsWith("all rounder (genuine")
    )
      vals.allrounder_type = "Genuine Allrounder";

    const bt = p.bowling_type || "";
    if (bt) {
      const isPace = /Fast/i.test(bt);
      vals.bowl_kind = isPace ? "Pace" : "Spin";
      vals.bowl_arm = /Left-arm/i.test(bt)
        ? "Left-arm"
        : /Right-arm/i.test(bt)
        ? "Right-arm"
        : "";
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
    const skillTypeOut = editing.skill_type?.startsWith("All Rounder")
      ? editVals.allrounder_type
        ? `All Rounder (${editVals.allrounder_type})`
        : "All Rounder"
      : editing.skill_type;

    try {
      const upd = await updatePlayer(editing.id, {
        player_name: editing.player_name,
        team_name: team,
        lineup_type: editing.lineup_type,
        skill_type: skillTypeOut,
        batting_style: editVals.batting_style || "",
        bowling_type,
        profile_url: editing.profile_url,
      });

      // refresh lists
      await loadAll(team);
      // reflect in lineup cards as well
      setLineup((prev) =>
        prev.map((x) =>
          x.player_id === upd.id ? { ...x, obj: { ...x.obj, ...upd } } : x
        )
      );

      setEditing(null);
      pushToast("Player updated", "success");
    } catch (e) {
      console.error(e);
      pushToast(e?.response?.data?.error || "Update failed", "error");
    }
  };

  /* Delete from a format squad */
  const doDeletePlayer = async (pid) => {
    if (!window.confirm("Delete this player from the format squad?")) return;
    try {
      await deletePlayer(pid);
      await loadAll(team);
      // cleanup lineup if necessary
      setLineup((prev) => {
        const items = prev.filter((x) => x.player_id !== pid);
        return items.map((x, i) => ({
          ...x,
          order_no: i + 1,
          is_twelfth: i === 11,
        }));
      });
      if (captainId === pid) setCaptainId(null);
      if (viceId === pid) setViceId(null);
      pushToast("Deleted from this format squad", "success");
    } catch {
      pushToast("Failed to delete", "error");
    }
  };

  /* Drag & Drop rules
     - bench -> FORMAT : create on server (copy), keep on bench
     - FORMAT -> other FORMAT : create on server (copy), keep in source
     - FORMAT (current) -> lineup : same as old "squad -> lineup"
     - lineup -> FORMAT (current) : remove from lineup only
  */

  // 🔧 FIX #2: make copy optimistic so the drop doesn't snap back.
  const ensureInFormat = async (srcPlayer, destFormat) => {
    // already there by name?
    if ((lists[destFormat] || []).some((p) => ciEq(p.player_name, srcPlayer.player_name))) {
      pushToast(`${srcPlayer.player_name} already in ${destFormat}`, "info");
      return false;
    }

    // 1) optimistic add with a temporary id
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLists((prev) => ({
      ...prev,
      [destFormat]: [
        ...prev[destFormat],
        { ...srcPlayer, id: tempId, lineup_type: destFormat },
      ],
    }));

    // 2) persist on server
    try {
      const created = await createPlayer({
        player_name: srcPlayer.player_name,
        team_name: team,
        lineup_type: destFormat,
        skill_type: srcPlayer.skill_type,
        batting_style: srcPlayer.batting_style,
        bowling_type: srcPlayer.bowling_type,
      });

      // replace temp with real record
      setLists((prev) => ({
        ...prev,
        [destFormat]: prev[destFormat].map((p) => (p.id === tempId ? created : p)),
      }));

      pushToast(`Added to ${destFormat}`, "success");
      return true;
    } catch (e) {
      // 3) rollback on failure
      setLists((prev) => ({
        ...prev,
        [destFormat]: prev[destFormat].filter((p) => p.id !== tempId),
      }));

      const s = e?.response?.status;
      if (s === 409) {
        pushToast("Already exists", "info");
        try { await loadAll(team); } catch {}
        return false;
      }
      console.error(e);
      pushToast(e?.response?.data?.error || "Failed to add", "error");
      return false;
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const srcId = source.droppableId;
    const dstId = destination.droppableId;

    // FORMAT -> FORMAT copy
    if (FORMATS.includes(srcId) && FORMATS.includes(dstId)) {
      if (srcId === dstId) return; // do nothing
      const srcList = listFiltered(srcId);
      const p = srcList[source.index];
      if (!p) return;
      await ensureInFormat(p, dstId);
      return;
    }

    // BENCH -> FORMAT copy
    if (srcId === "bench" && FORMATS.includes(dstId)) {
      const p = benchFiltered[source.index];
      if (!p) return;
      await ensureInFormat(p, dstId);
      return;
    }

    // 🔧 FIX #3: FORMAT(current) -> lineup (read from the visible list; guard duplicates)
    if (FORMATS.includes(srcId) && dstId === "lineup" && srcId === format) {
      const visible = listFiltered(srcId);     // exactly what the user sees
      const player = visible[source.index];
      if (!player) return;

      if (lineup.some((x) => x.player_id === player.id)) {
        pushToast("Already in lineup", "info");
        return;
      }
      if (lineup.length >= MAX_LINEUP) {
        pushToast(`Max ${MAX_LINEUP} players allowed in lineup`, "error");
        return;
      }

      const newItem = {
        player_id: player.id,
        order_no: lineup.length + 1,
        is_twelfth: lineup.length + 1 === 12,
        obj: { ...player, lineup_type: format },
      };
      setLineup((prev) => [...prev, newItem]);
      return;
    }

    // lineup -> FORMAT(current) (remove)
    if (srcId === "lineup" && FORMATS.includes(dstId) && dstId === format) {
      const items = Array.from(lineup);
      const [removed] = items.splice(source.index, 1);
      if (removed?.player_id === captainId) setCaptainId(null);
      if (removed?.player_id === viceId) setViceId(null);
      const reseq = items.map((x, i) => ({
        ...x,
        order_no: i + 1,
        is_twelfth: i === 11,
      }));
      setLineup(reseq);
      return;
    }

    // lineup re-order
    if (srcId === "lineup" && dstId === "lineup") {
      const items = Array.from(lineup);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      const reseq = items.map((x, i) => ({
        ...x,
        order_no: i + 1,
        is_twelfth: i === 11,
      }));
      setLineup(reseq);
      return;
    }
  };

  /* Save lineup */
  const doSave = async () => {
    const currentSig = JSON.stringify({
      team,
      format,
      c: captainId,
      v: viceId,
      arr: lineup.map((x) => [x.player_id, x.order_no, !!x.is_twelfth]),
    });

    if (currentSig === lastSavedSig) {
      pushToast("Already saved. Make changes to save again.", "info");
      return;
    }
    if (lineup.length < MIN_LINEUP)
      return pushToast(`At least ${MIN_LINEUP} players required`, "error");
    if (!captainId || !viceId)
      return pushToast("Pick one Captain and one Vice-captain", "error");
    if (captainId === viceId)
      return pushToast("Captain and Vice-captain must be different", "error");

    try {
      await saveLineup({
        team_name: team,
        lineup_type: format,
        captain_player_id: captainId,
        vice_captain_player_id: viceId,
        players: lineup.map((x) => ({
          player_id: x.player_id,
          order_no: x.order_no,
          is_twelfth: !!x.is_twelfth,
        })),
      });
      setShowSaveCongrats(true);
      setTimeout(() => setShowSaveCongrats(false), 1400);
      setLastSavedSig(currentSig);
      pushToast("Lineup saved", "success");
    } catch (e) {
      console.error(e);
      pushToast(e?.response?.data?.error || "Failed to save lineup", "error");
    }
  };

  /* Edit dialog helpers */
  const presenceClass = (name) =>
    presenceCount.get(ci(name)) === 3 ? "multi-all" : "";

  return (
    <div className="sq-wrap sq-full">
      <Toasts
        toasts={toasts}
        onClose={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />

      {/* Header */}
      <header className="sq-header">
        <div className="sq-team-tabs">
          <div className="sq-team-select">
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="sq-select"
            >
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
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

        <div className="sq-addbar">
          <div className="sq-add-left">
            <input
              className="sq-input"
              placeholder="Add player to Bench (type for suggestions)…"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
            />
            {!!suggests.length && (
              <div className="sq-suggest">
                {suggests.map((s) => (
                  <div
                    key={`${s.name}-${s.team}`}
                    className="sq-suggest-item"
                    onClick={() => setAddName(s.name)}
                    title={`Found in ${s.team}`}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            className="sq-role"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
          >
            <option>Batsman</option>
            <option>Bowler</option>
            <option>All Rounder</option>
            <option>Wicketkeeper/Batsman</option>
          </select>

          <button className="sq-btn" onClick={onAddToBench} type="button">
            Add to Bench
          </button>
        </div>

        <RoleFields role={addRole} values={addVals} setValues={setAddVals} />
      </header>

      {/* Quick Legend */}
      <div className="sq-legend">
        <span className="sq-dot all" /> in all three formats
      </div>

      {/* Search */}
      <div className="sq-filters">
        <input
          className="sq-input"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Quad Board + Lineup */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="quad-grid">
          {/* Bench */}
          <Droppable droppableId="bench">
            {(provided) => (
              <div className="sq-panel" ref={provided.innerRef} {...provided.droppableProps}>
                <div className="sq-panel-title">🧢 Bench (Master Squad)</div>
                {benchFiltered.map((p, idx) => (
                  // 🔧 FIX #1: stable draggable id based on the player, not the index
                  <Draggable key={`bench-${p.id || idx}`} draggableId={`bench-${p.id || idx}`} index={idx}>
                    {(prov) => (
                      <div
                        className={`sq-card ${presenceClass(p.player_name)}`}
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                      >
                        <div className="sq-card-left">
                          <span className="sq-ico">{iconFor(p)}</span>
                          <div>
                            <div className="sq-name">{p.player_name}</div>
                            <div className="sq-sub">
                              {p.batting_style || "—"} • {p.bowling_type || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {!benchFiltered.length && (
                  <div className="sq-empty">Add players to the Bench, then drag to ODI/T20/TEST.</div>
                )}
              </div>
            )}
          </Droppable>

          {/* ODI / T20 / TEST columns */}
          {FORMATS.map((F) => (
            <Droppable key={F} droppableId={F}>
              {(provided) => (
                <div className="sq-panel" ref={provided.innerRef} {...provided.droppableProps}>
                  <div className="sq-panel-title">
                    {F} Squad ({lists[F]?.length || 0})
                  </div>
                  {listFiltered(F).map((p, idx) => (
                    <Draggable key={`${F}-${p.id}`} draggableId={`${F}-${p.id}`} index={idx}>
                      {(prov) => (
                        <div
                          className={`sq-card ${presenceClass(p.player_name)}`}
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                        >
                          <div className="sq-card-left">
                            <span className="sq-ico">{iconFor(p)}</span>
                            <div>
                              <div className="sq-name">{p.player_name}</div>
                              <div className="sq-sub">
                                {p.batting_style || "—"} • {p.bowling_type || "—"}
                              </div>
                            </div>
                          </div>
                          <div className="sq-actions">
                            <button
                              className="sq-icon-btn"
                              title="Edit"
                              onClick={() => openEdit({ ...p, lineup_type: F })}
                              type="button"
                            >
                              ✏️
                            </button>
                            {isAdmin && (
                              <button
                                className="sq-icon-btn danger"
                                title="Delete from this format squad"
                                onClick={() => doDeletePlayer(p.id)}
                                type="button"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {!listFiltered(F).length && (
                    <div className="sq-empty">Drag here from Bench or from another format.</div>
                  )}
                </div>
              )}
            </Droppable>
          ))}
        </div>

        {/* Lineup area for the currently selected format */}
        <Droppable droppableId="lineup">
          {(provided, snapshot) => (
            <div className="sq-panel lineup" ref={provided.innerRef} {...provided.droppableProps}>
              {snapshot.isDraggingOver && riv.glow && (
                <div className="sq-drop-glow">
                  <RiveSlot src={riv.glow} className="sq-rive on" />
                </div>
              )}
              <div className="sq-panel-title">
                🎯 {format} Lineup ({lineup.length}/{MAX_LINEUP})
              </div>

              {/* lineup cards */}
              {lineup.map((x, idx) => (
                <Draggable key={`l-${x.player_id}`} draggableId={`l-${x.player_id}`} index={idx}>
                  {(prov) => (
                    <div
                      className="sq-card"
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                    >
                      <div className="sq-card-left">
                        <span className="sq-order">{idx + 1}</span>
                        <span className="sq-ico">{iconFor(x.obj)}</span>
                        <div className="sq-name">{x.obj.player_name}</div>
                        {idx === 11 && <span className="sq-tag">12th</span>}
                        {x.player_id === captainId && <span className="sq-tag gold">C</span>}
                        {x.player_id === viceId && <span className="sq-tag teal">VC</span>}
                      </div>
                      <div className="sq-actions">
                        <button
                          className={`sq-chip ${x.player_id === captainId ? "on" : ""}`}
                          onClick={() => {
                            if (x.player_id === viceId) setViceId(null);
                            setCaptainId((prev) => (prev === x.player_id ? null : x.player_id));
                          }}
                          title="Set Captain"
                          type="button"
                        >
                          C
                        </button>
                        <button
                          className={`sq-chip ${x.player_id === viceId ? "on" : ""}`}
                          onClick={() => {
                            if (x.player_id === captainId) setCaptainId(null);
                            setViceId((prev) => (prev === x.player_id ? null : x.player_id));
                          }}
                          title="Set Vice-captain"
                          type="button"
                        >
                          VC
                        </button>
                        <button
                          className="sq-icon-btn"
                          title="Remove from lineup"
                          onClick={() => {
                            const items = lineup.filter((it) => it.player_id !== x.player_id);
                            if (x.player_id === captainId) setCaptainId(null);
                            if (x.player_id === viceId) setViceId(null);
                            const reseq = items.map((p, i) => ({
                              ...p,
                              order_no: i + 1,
                              is_twelfth: i === 11,
                            }));
                            setLineup(reseq);
                          }}
                          type="button"
                        >
                          ➖
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}

              {!lineup.length && (
                <div className="sq-empty-anim">
                  <RiveSlot src={riv.empty} className="sq-rive" />
                  <div className="sq-empty">
                    Drag from the <b>{format} Squad</b> above to build XI (max 12; one 12th).
                  </div>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Save bar */}
      <div className="sq-savebar">
        <div>
          <strong>{lineup.length}</strong> selected • C:{" "}
          {captainId
            ? lists[format]?.find((p) => p.id === captainId)?.player_name || "—"
            : "—"}{" "}
          • VC:{" "}
          {viceId
            ? lists[format]?.find((p) => p.id === viceId)?.player_name || "—"
            : "—"}
        </div>
        <button className="sq-btn primary" onClick={doSave} type="button">
          Save Lineup
        </button>
      </div>

      {/* Update Modal */}
      {editing && (
        <div className="sq-modal" role="dialog" aria-modal="true">
          <div className="sq-modal-card">
            <div className="sq-modal-title">Edit Player</div>

            <label className="sq-lab">Name</label>
            <input
              className="sq-input"
              value={editing.player_name || ""}
              onChange={(e) => setEditing({ ...editing, player_name: e.target.value })}
            />

            <label className="sq-lab">Role</label>
            <select
              className="sq-input"
              value={
                editing.skill_type?.startsWith("All Rounder")
                  ? "All Rounder"
                  : editing.skill_type || "Batsman"
              }
              onChange={(e) => setEditing({ ...editing, skill_type: e.target.value })}
            >
              <option>Batsman</option>
              <option>Bowler</option>
              <option>All Rounder</option>
              <option>Wicketkeeper/Batsman</option>
            </select>

            <RoleFields
              role={
                editing.skill_type?.startsWith("All Rounder")
                  ? "All Rounder"
                  : editing.skill_type || "Batsman"
              }
              values={editVals}
              setValues={setEditVals}
            />

            <div className="sq-modal-actions">
              <button className="sq-btn" onClick={() => setEditing(null)} type="button">
                Cancel
              </button>
              <button className="sq-btn primary" onClick={doUpdatePlayer} type="button">
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save animation */}
      {showSaveCongrats && (
        <div className="sq-rive-overlay">
          <RiveSlot src={riv.success} className="sq-rive-center" />
        </div>
      )}
    </div>
  );
}
