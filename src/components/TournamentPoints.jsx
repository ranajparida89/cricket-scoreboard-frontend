// ✅ src/components/TournamentPoints.jsx (Ant Design version)
// Dark Pro look with gold accents, info chip, dropdowns sourced from data,
// card grid (top-3 soft glow), and charts via @ant-design/plots.

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  Tooltip,
  Typography,
  Button,
  Space,
  Tag,
  ConfigProvider,
  theme as antdTheme,
  Empty,
} from "antd";
import { InfoCircleTwoTone, ReloadOutlined } from "@ant-design/icons";
import { Column, Line } from "@ant-design/plots";
import "./TournamentPoints.css";

const { Title, Text } = Typography;
const API = "/api/match-history";

/* ---------------- helpers ---------------- */
const canon = (s = "") =>
  s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/[–—]/g, "-")
    .trim()
    .toLowerCase();

const titleize = (s = "") =>
  s.replace(/\s+/g, " ").trim().replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));

const fmt = (n, d = 0) => (Number.isFinite(n) ? Number(n).toFixed(d) : "—");

const isDraw = (winner = "") => {
  const w = canon(winner);
  return w === "draw" || w === "match draw";
};

const isWinFor = (winner = "", team = "") => {
  const w = canon(winner);
  const t = canon(team);
  return w === t || w === `${t} won the match!`;
};

/* ---------------- component ---------------- */
export default function TournamentPoints() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [matchType, setMatchType] = useState("T20"); // All | T20 | ODI
  const [tournament, setTournament] = useState("All tournaments");
  const [seasonYear, setSeasonYear] = useState("All years");

  const { darkAlgorithm } = antdTheme;

  // Load data once
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { credentials: "include" });
      const js = await res.json();
      setRows(Array.isArray(js) ? js : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build dropdown choices from actual data (keeps in sync with match entry)
  const allTournaments = useMemo(() => {
    const set = new Set(
      rows
        .filter((r) => r.tournament_name && (r.match_type === "ODI" || r.match_type === "T20"))
        .map((r) => titleize(r.tournament_name))
    );
    return ["All tournaments", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const allYears = useMemo(() => {
    const set = new Set(
      rows
        .filter((r) => (r.match_type === "ODI" || r.match_type === "T20") && Number.isFinite(Number(r.season_year)))
        .map((r) => Number(r.season_year))
    );
    const arr = Array.from(set).sort((a, b) => b - a);
    return ["All years", ...arr];
  }, [rows]);

  // Compute standings from match_history (ODI/T20 only)
  const standings = useMemo(() => {
    const filtered = rows.filter((r) => {
      if (!(r.match_type === "ODI" || r.match_type === "T20")) return false;
      if (matchType !== "All" && r.match_type !== matchType) return false;
      if (tournament && tournament !== "All tournaments") {
        if (titleize(r.tournament_name || "") !== tournament) return false;
      }
      if (seasonYear && seasonYear !== "All years") {
        if (String(r.season_year) !== String(seasonYear)) return false;
      }
      return true;
    });

    const map = new Map();
    const add = (team, runsFor, oversFaced, runsAg, oversBowled, win, draw) => {
      const key = titleize(team || "");
      if (!key) return;
      if (!map.has(key))
        map.set(key, {
          team: key,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          rf: 0,
          of: 0,
          ra: 0,
          ob: 0,
        });
      const o = map.get(key);
      o.matches += 1;
      o.rf += runsFor;
      o.of += oversFaced;
      o.ra += runsAg;
      o.ob += oversBowled;
      if (draw) {
        o.draws += 1;
        o.points += 1;
      } else if (win) {
        o.wins += 1;
        o.points += 2;
      } else {
        o.losses += 1;
      }
    };

    for (const r of filtered) {
      const t1 = r.team1,
        t2 = r.team2;
      const w = r.winner || "";
      const t1Win = isWinFor(w, t1),
        t2Win = isWinFor(w, t2);
      const draw = isDraw(w);

      add(t1, Number(r.runs1 || 0), Number(r.overs1 || 0), Number(r.runs2 || 0), Number(r.overs2 || 0), t1Win, draw);
      add(t2, Number(r.runs2 || 0), Number(r.overs2 || 0), Number(r.runs1 || 0), Number(r.overs1 || 0), t2Win, draw);
    }

    const arr = Array.from(map.values())
      .map((o) => {
        const nrr = o.of > 0 && o.ob > 0 ? o.rf / o.of - o.ra / o.ob : 0;
        return { ...o, nrr };
      })
      .sort((a, b) => b.points - a.points || b.nrr - a.nrr);

    return arr.map((o, idx) => ({ rank: idx + 1, ...o }));
  }, [rows, matchType, tournament, seasonYear]);

  const top10 = standings.slice(0, 10);
  const pointsData = top10.map((s) => ({ team: s.team, value: s.points }));
  const nrrData = top10.map((s, i) => ({ idx: i + 1, team: s.team, value: Number(s.nrr.toFixed(2)) }));

  // Charts configs (Ant Design Plots / G2Plot)
  const columnCfg = {
    data: pointsData,
    xField: "team",
    yField: "value",
    columnWidthRatio: 0.6,
    label: { position: "top", style: { fill: "#dfe7ff" } },
    tooltip: { showMarkers: false },
    interactions: [{ type: "active-region" }],
  };

  const lineCfg = {
    data: nrrData,
    xField: "idx",
    yField: "value",
    smooth: true,
    xAxis: { label: { formatter: (v) => (top10[Number(v) - 1]?.team || "").split(" ")[0] } },
    yAxis: { label: { formatter: (v) => String(v) } },
    tooltip: {
      customItems: (items) =>
        items.map((it) => ({
          ...it,
          name: top10[it.data.idx - 1]?.team || "Team",
          value: it.data.value,
        })),
    },
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorPrimary: "#F5D26B", // gold
          colorInfo: "#F5D26B",
          colorText: "#E8EEFC",
          colorTextSecondary: "#A9B5CF",
          borderRadius: 12,
          colorBgContainer: "#121B2A",
        },
      }}
    >
      <div className="tp-ant">
        {/* header & filters */}
        <div className="tp-head">
          <Title level={3} className="tp-title">
            <span className="medal">🏆</span> Tournament Points
            <Tooltip
              placement="right"
              title="This view is computed from your ODI/T20 entries in /api/match-history. Make sure you fill Tournament & Season Year during match entry."
            >
              <InfoCircleTwoTone twoToneColor="#F5D26B" className="tp-info" />
            </Tooltip>
          </Title>

          <Space wrap size="middle" className="tp-filters">
            <div className="tp-filter">
              <Text type="secondary">Match Type</Text>
              <Select
                popupClassName="tp-dropdown"
                value={matchType}
                onChange={setMatchType}
                options={[{ value: "All" }, { value: "T20" }, { value: "ODI" }]}
                style={{ minWidth: 140 }}
              />
            </div>

            <div className="tp-filter">
              <Text type="secondary">Tournament</Text>
              <Select
                showSearch
                optionFilterProp="label"
                popupClassName="tp-dropdown"
                value={tournament}
                onChange={setTournament}
                options={allTournaments.map((n) => ({ value: n, label: n }))}
                style={{ minWidth: 240 }}
              />
            </div>

            <div className="tp-filter">
              <Text type="secondary">Season Year</Text>
              <Select
                showSearch
                optionFilterProp="label"
                popupClassName="tp-dropdown"
                value={seasonYear}
                onChange={setSeasonYear}
                options={allYears.map((y) => ({ value: String(y), label: String(y) }))}
                style={{ minWidth: 160 }}
              />
            </div>

            <Button type="primary" icon={<ReloadOutlined />} onClick={load}>
              Reload
            </Button>
          </Space>
        </div>

        {/* charts */}
        <Row gutter={[16, 16]} className="tp-row">
          <Col xs={24} lg={12}>
            <Card title="Points (Top 10)" className="tp-card chart-card" bordered>
              {top10.length ? <Column {...columnCfg} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="NRR (Top 10)" className="tp-card chart-card" bordered>
              {top10.length ? <Line {...lineCfg} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </Card>
          </Col>
        </Row>

        {/* card grid */}
        <Row gutter={[16, 16]} className="tp-row">
          {loading && (
            <Col span={24}>
              <Card className="tp-card"><Text>Loading…</Text></Card>
            </Col>
          )}
          {!loading && standings.length === 0 && (
            <Col span={24}>
              <Card className="tp-card"><Empty description="No matches for this selection" /></Card>
            </Col>
          )}

          {standings.map((s) => (
            <Col xs={24} sm={12} md={12} lg={8} xl={6} key={s.team}>
              <Card
                bordered
                className={`tp-card team-card ${s.rank <= 3 ? `podium-${s.rank}` : ""}`}
                title={
                  <Space align="center">
                    <Tag className="rank-badge">#{s.rank}</Tag>
                    <Text strong className="team-name">
                      {s.team}
                    </Text>
                  </Space>
                }
                extra={
                  s.rank <= 3 ? (
                    <Tag color="gold" className="top3">Top {s.rank}</Tag>
                  ) : null
                }
              >
                <div className="stats-grid">
                  <div><Text type="secondary">Matches</Text><div className="num">{s.matches}</div></div>
                  <div><Text type="secondary">Wins</Text><div className="num good">{s.wins}</div></div>
                  <div><Text type="secondary">Losses</Text><div className="num bad">{s.losses}</div></div>
                  <div><Text type="secondary">Draws</Text><div className="num">{s.draws}</div></div>
                  <div><Text type="secondary">Points</Text><div className="num gold">{s.points}</div></div>
                  <div><Text type="secondary">NRR</Text><div className="num">{fmt(s.nrr, 2)}</div></div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </ConfigProvider>
  );
}
