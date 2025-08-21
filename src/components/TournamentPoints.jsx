// src/components/TournamentPoints.jsx
// Ant Design UI that computes points/NRR client-side from /api/match-history
// Matches your CSS classes (tp-ant, tp-head, tp-card, team-card, podium-*).

import React, { useEffect, useMemo, useState } from "react";
import { Select, Button, Row, Col, Card, Tooltip, Empty, message } from "antd";
import { InfoCircleTwoTone, ReloadOutlined } from "@ant-design/icons";
import { Column } from "@ant-design/plots";
import axios from "axios";
import { API_URL } from "../services/api";
import "./TournamentPoints.css";

// --- helpers ----------------------------------------------------
const MTYPES = ["All", "T20", "ODI"]; // we ignore Test for NRR/points on this page

const canon = (s) => (s || "").toString().trim().toLowerCase();
const num = (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? 0 : Number(v));

const isDraw = (winner) => {
  const w = canon(winner);
  return w === "draw" || w === "match draw" || w === "match drawn";
};

const winnerIsTeam = (winner, team) => {
  const w = canon(winner);
  const t = canon(team);
  return w === t || w.startsWith(t + " ") || w.includes(`${t} won`);
};

function buildTable(rows, { matchType, tournamentName, seasonYear }) {
  const map = new Map();

  const filtered = rows.filter((r) => {
    const mt = (r.match_type || "").toString();
    if (matchType !== "All" && mt !== matchType) return false;
    if (tournamentName && canon(r.tournament_name) !== canon(tournamentName)) return false;
    if (seasonYear && Number(r.season_year) !== Number(seasonYear)) return false;
    return mt === "T20" || mt === "ODI";
  });

  for (const r of filtered) {
    const t1 = r.team1, t2 = r.team2, w = r.winner;

    let t1Win = false, t2Win = false, draw = false;
    if (isDraw(w)) draw = true;
    else if (winnerIsTeam(w, t1)) t1Win = true;
    else if (winnerIsTeam(w, t2)) t2Win = true;

    const rf1 = num(r.runs1), rf2 = num(r.runs2);
    const o1  = num(r.overs1), o2  = num(r.overs2);

    if (!map.has(t1)) map.set(t1, { team: t1, matches: 0, wins: 0, losses: 0, draws: 0, points: 0, rf: 0, of: 0, ra: 0, ob: 0, tournament_name: r.tournament_name ?? "—", season_year: r.season_year ?? "—" });
    if (!map.has(t2)) map.set(t2, { team: t2, matches: 0, wins: 0, losses: 0, draws: 0, points: 0, rf: 0, of: 0, ra: 0, ob: 0, tournament_name: r.tournament_name ?? "—", season_year: r.season_year ?? "—" });

    const s1 = map.get(t1);
    s1.matches += 1; s1.rf += rf1; s1.of += o1; s1.ra += rf2; s1.ob += o2;
    if (t1Win) { s1.wins += 1; s1.points += 2; }
    else if (draw) { s1.draws += 1; s1.points += 1; }
    else { s1.losses += 1; }

    const s2 = map.get(t2);
    s2.matches += 1; s2.rf += rf2; s2.of += o2; s2.ra += rf1; s2.ob += o1;
    if (t2Win) { s2.wins += 1; s2.points += 2; }
    else if (draw) { s2.draws += 1; s2.points += 1; }
    else { s2.losses += 1; }
  }

  const table = Array.from(map.values()).map((s) => {
    const nrrFor = s.of > 0 ? s.rf / s.of : 0;
    const nrrAg  = s.ob > 0 ? s.ra / s.ob : 0;
    const nrr    = Number((nrrFor - nrrAg).toFixed(2));
    return { ...s, nrr };
  });

  table.sort((a, b) => b.points - a.points || b.nrr - a.nrr || a.team.localeCompare(b.team));
  return table;
}

function extractFilters(rows) {
  const tnames = new Set();
  const years = new Set();
  rows.forEach((r) => {
    if (r.tournament_name) tnames.add(r.tournament_name);
    if (r.season_year) years.add(Number(r.season_year));
  });
  return {
    tournaments: Array.from(tnames).sort((a, b) => a.localeCompare(b)),
    years: Array.from(years).sort((a, b) => a - b),
  };
}

// --- component --------------------------------------------------
export default function TournamentPoints() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [matchType, setMatchType] = useState("T20");
  const [tournamentName, setTournamentName] = useState();
  const [seasonYear, setSeasonYear] = useState();

  const { tournaments, years } = useMemo(() => extractFilters(rows), [rows]);
  const table = useMemo(
    () => buildTable(rows, { matchType, tournamentName, seasonYear }),
    [rows, matchType, tournamentName, seasonYear]
  );

  const topPoints = useMemo(
    () => table.slice(0, 10).map(({ team, points }) => ({ team, value: points })),
    [table]
  );
  const topNRR = useMemo(
    () => table.slice(0, 10).map(({ team, nrr }) => ({ team, value: nrr })),
    [table]
  );

  async function reload() {
    try {
      setLoading(true);
      const params = {};
      if (matchType !== "All") params.match_type = matchType;
      const { data } = await axios.get(`${API_URL}/match-history`, { params });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      message.error("Failed to load match history.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); /* initial */ }, []); // eslint-disable-line

  const infoTip = (
    <Tooltip
      color="#151b28"
      title={
        <div style={{ maxWidth: 320 }}>
          Points/NRR computed on the client from <code>/api/match-history</code>.
          Filter by match type, tournament, and year.
        </div>
      }
    >
      <InfoCircleTwoTone twoToneColor="#f5d26b" className="tp-info" />
    </Tooltip>
  );

  return (
    <div className="tp-ant">
      {/* Header */}
      <div className="tp-head">
        <h2 className="tp-title">
          <span className="medal" role="img" aria-label="trophy">🏆</span>
          Tournament Points
          {infoTip}
        </h2>

        {/* Filters */}
        <Row gutter={8} className="tp-filters">
          <Col>
            <div className="tp-filter">
              <small>Match Type</small>
              <Select
                value={matchType}
                onChange={setMatchType}
                options={MTYPES.map((m) => ({ value: m, label: m }))}
                dropdownClassName="tp-dropdown"
                style={{ minWidth: 140 }}
              />
            </div>
          </Col>

          <Col>
            <div className="tp-filter">
              <small>Tournament</small>
              <Select
                allowClear
                placeholder="All tournaments"
                value={tournamentName}
                onChange={setTournamentName}
                options={tournaments.map((t) => ({ value: t, label: t }))}
                showSearch
                optionFilterProp="label"
                dropdownClassName="tp-dropdown"
                style={{ minWidth: 220 }}
              />
            </div>
          </Col>

          <Col>
            <div className="tp-filter">
              <small>Season Year</small>
              <Select
                allowClear
                placeholder="All years"
                value={seasonYear}
                onChange={setSeasonYear}
                options={years.map((y) => ({ value: y, label: String(y) }))}
                showSearch
                optionFilterProp="label"
                dropdownClassName="tp-dropdown"
                style={{ minWidth: 140 }}
              />
            </div>
          </Col>

          <Col>
            <div className="tp-filter">
              <small>&nbsp;</small>
              <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={reload}>
                Reload
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Charts */}
      <Row gutter={[16, 16]} className="tp-row">
        <Col xs={24} lg={12}>
          <Card className="tp-card" title="Points (Top 10)" bordered>
            {topPoints.length ? (
              <Column
                data={topPoints}
                xField="team"
                yField="value"
                xAxis={{ label: { autoHide: true, autoRotate: false } }}
                height={300}
                paddingLeft={16}
                paddingRight={16}
              />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="tp-card" title="NRR (Top 10)" bordered>
            {topNRR.length ? (
              <Column
                data={topNRR}
                xField="team"
                yField="value"
                xAxis={{ label: { autoHide: true, autoRotate: false } }}
                height={300}
                paddingLeft={16}
                paddingRight={16}
              />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
      </Row>

      {/* Team card grid */}
      <Row gutter={[16, 16]} className="tp-row">
        {table.length === 0 ? (
          <Col span={24}><Empty description="No matches for this selection" /></Col>
        ) : (
          table.map((t, idx) => {
            const podium = idx === 0 ? "podium-1" : idx === 1 ? "podium-2" : idx === 2 ? "podium-3" : "";
            return (
              <Col key={t.team} xs={24} md={12} lg={8} xl={6}>
                <Card
                  className={`tp-card team-card ${podium}`}
                  bordered
                  title={
                    <div>
                      <span className="rank-badge">#{idx + 1}</span>
                      <span className={`team-name ${idx < 3 ? "top3" : ""}`}>{t.team}</span>
                    </div>
                  }
                >
                  <div className="stats-grid">
                    <div><small>Matches</small><div className="num">{t.matches}</div></div>
                    <div><small>Wins</small><div className="num good">{t.wins}</div></div>
                    <div><small>Losses</small><div className="num bad">{t.losses}</div></div>
                    <div><small>Draws</small><div className="num">{t.draws}</div></div>
                    <div><small>Points</small><div className={`num ${idx < 3 ? "gold" : ""}`}>{t.points}</div></div>
                    <div><small>NRR</small><div className="num">{t.nrr.toFixed(2)}</div></div>
                  </div>
                  <div style={{ marginTop: 10, opacity: .8 }}>
                    <small>Tournament:</small> <b>{t.tournament_name ?? "—"}</b>
                    <span style={{ margin: "0 8px" }}>|</span>
                    <small>Year:</small> <b>{t.season_year ?? "—"}</b>
                  </div>
                </Card>
              </Col>
            );
          })
        )}
      </Row>
    </div>
  );
}
