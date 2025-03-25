import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const TeamCharts = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getTeams();
      // Sort by points for better display
      const sorted = data.sort((a, b) => b.points - a.points);
      setTeams(sorted);
    };

    fetchData();
  }, []);

  const teamNames = teams.map((t) => t.team_name);
  const teamPoints = teams.map((t) => parseInt(t.points));
  const teamNRR = teams.map((t) => parseFloat(t.nrr).toFixed(2));

  const barData = {
    labels: teamNames,
    datasets: [
      {
        label: "Points",
        data: teamPoints,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderRadius: 5,
      },
    ],
  };

  const lineData = {
    labels: teamNames,
    datasets: [
      {
        label: "Net Run Rate (NRR)",
        data: teamNRR,
        fill: false,
        borderColor: "rgba(255, 99, 132, 0.8)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="container mt-5">
      <h3 className="text-center text-info">📊 Team Performance Charts</h3>
      <div className="card p-4 shadow mt-4">
        <h5>Points Comparison</h5>
        <Bar data={barData} />
      </div>

      <div className="card p-4 shadow mt-4">
        <h5>Net Run Rate (NRR)</h5>
        <Line data={lineData} />
      </div>
    </div>
  );
};

export default TeamCharts;
