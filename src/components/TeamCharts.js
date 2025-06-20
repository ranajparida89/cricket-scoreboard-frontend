// ✅ src/components/TeamCharts.js
// ✅ [Ranaj Parida - 2025-04-17 | 4:10 AM]
// ✅ [ChatGPT | 2025-06-19] Pie chart for Test Win/Loss/Draw with Test team dropdown

import React, { useEffect, useState } from "react";
import { getTeamChartData } from "../services/api"; // ✅ Uses team-rankings only for charts
import './TeamCharts.css'; // <-- for css style
import { Pie } from "react-chartjs-2"; // For Piechart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,      // <--- NEW for Pie
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar, Line } from "react-chartjs-2";

// ✅ Register ChartJS modules globally

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement, // <--- ADD THIS!
  Tooltip,
  Legend,
  Title,
  ChartDataLabels
);

const TeamCharts = () => {
  const [teams, setTeams] = useState([]);
  const [filteredType, setFilteredType] = useState("All");
  const [selectedTestTeam, setSelectedTestTeam] = useState(""); // NEW: for Pie chart team selection

  // ✅ Fetch chart-specific team data (grouped by match_type)
  useEffect(() => {
    const fetchData = async () => {
      const data = await getTeamChartData();

      // ✅ Normalize match_type for filtering
      const normalized = data.map((team) => ({
        ...team,
        match_type: (team.match_type || "").trim().toLowerCase(),
      }));

      // ✅ Sort by points descending
      const sorted = normalized.sort((a, b) => b.points - a.points);
      setTeams(sorted);
    };

    fetchData();
  }, []);

  // Compute Test teams for dropdown
  const testTeams = teams.filter(t => t.match_type === "test").map(t => t.team_name);
  const uniqueTestTeams = [...new Set(testTeams)];

  // Auto-select first Test team if not set
  useEffect(() => {
    if (filteredType === "Test" && uniqueTestTeams.length > 0 && !selectedTestTeam) {
      setSelectedTestTeam(uniqueTestTeams[0]);
    }
    // eslint-disable-next-line
  }, [filteredType, teams]);

  // ✅ Filter by selected match_type (T20/ODI/Test/All)
  const filteredTeams =
    filteredType === "All"
      ? teams
      : teams.filter(
          (t) =>
            t.match_type === filteredType.trim().toLowerCase()
        );

  // ✅ Extract team chart values
  const teamNames = filteredTeams.map((t) => t.team_name);
  const teamPoints = filteredTeams.map((t) => parseInt(t.points));
  const teamNRR = filteredTeams.map((t) => {
    const nrr = parseFloat(t.nrr);
    return isNaN(nrr) ? 0 : parseFloat(nrr.toFixed(2));
  });

  // ✅ Color mapping by match type
  const matchTypeColor = {
    t20: "rgba(255, 159, 64, 0.7)",
    odi: "rgba(54, 162, 235, 0.7)",
    test: "rgba(153, 102, 255, 0.7)",
    all: "rgba(75, 192, 192, 0.7)",
  };

  const color = matchTypeColor[filteredType.toLowerCase()] || matchTypeColor.all;

  // ✅ Bar chart config for points
  const barData = {
    labels: teamNames,
    datasets: [
      {
        label: "Points",
        data: teamPoints,
        backgroundColor: color,
        borderRadius: 5,
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#fff",
          font: { weight: "bold" },
        },
      },
    ],
  };

  // ✅ Line chart config for NRR
  const lineData = {
    labels: teamNames,
    datasets: [
      {
        label: "Net Run Rate (NRR)",
        data: teamNRR,
        fill: false,
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#fff",
          font: { weight: "bold" },
        },
      },
    ],
  };

  // ✅ Shared chart styling
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#fff" },
      },
      datalabels: {
        display: true,
        formatter: (value) => value,
      },
    },
    scales: {
      x: { ticks: { color: "#fff" } },
      y: {
        beginAtZero: true,
        ticks: { color: "#fff" },
      },
    },
  };

  // Find data for the selected Test team for Pie chart
  const selectedTeamData =
    filteredType === "Test" && selectedTestTeam
      ? teams.find(
          t =>
            t.match_type === "test" &&
            t.team_name === selectedTestTeam
        )
      : null;

  return (
    <div className="container mt-5">
      <h3 className="text-center text-info">📊 Team Performance Charts</h3>

      {/* ✅ Match Type Filter Dropdown */}
      <div className="d-flex justify-content-end mb-3">
        <select
          className="team-chart-type-select"
          value={filteredType}
          onChange={(e) => setFilteredType(e.target.value)}
        >
          <option value="All">All</option>
          <option value="T20">T20</option>
          <option value="ODI">ODI</option>
          <option value="Test">Test</option>
        </select>
      </div>

      {/* ✅ Test Team Dropdown for Pie Chart */}
      {filteredType === "Test" && uniqueTestTeams.length > 0 && (
        <div className="d-flex justify-content-end mb-3">
          <select
            className="team-chart-type-select"
            value={selectedTestTeam}
            onChange={e => setSelectedTestTeam(e.target.value)}
          >
            {uniqueTestTeams.map(team => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ✅ Bar Chart for Points */}
      <div className="card p-4 shadow mt-4 bg-dark text-white">
        <h5>Points Comparison</h5>
        <Bar
          key={`bar-${filteredType}-${teamNames.join("-")}`}
          data={barData}
          options={chartOptions}
          plugins={[ChartDataLabels]}
        />
      </div>

      {/* ✅ Pie Chart for Win/Loss/Draw - Test Only */}
      {filteredType === "Test" && selectedTeamData ? (
        <div className="card p-4 shadow mt-4 bg-dark text-white">
          <h5>Win/Loss/Draw Breakdown ({selectedTeamData.team_name})</h5>
          <Pie
            data={{
              labels: ["Wins", "Losses", "Draws"],
              datasets: [
                {
                  data: [
                    selectedTeamData.wins || 0,
                    selectedTeamData.losses || 0,
                    selectedTeamData.draws || 0
                  ],
                  backgroundColor: [
                    "#4CAF50", // Wins - Green
                    "#F44336", // Losses - Red
                    "#FFC107"  // Draws - Yellow
                  ],
                },
              ],
            }}
            options={{
              plugins: {
                legend: { labels: { color: "#fff" } }
              }
            }}
          />
        </div>
      ) : (
        /* Show NRR line chart for ODI/T20/All */
        filteredType !== "Test" && (
          <div className="card p-4 shadow mt-4 bg-dark text-white">
            <h5>Net Run Rate (NRR)</h5>
            <Line
              key={`line-${filteredType}-${teamNames.join("-")}`}
              data={lineData}
              options={chartOptions}
              plugins={[ChartDataLabels]}
            />
          </div>
        )
      )}
    </div>
  );
};

export default TeamCharts;
