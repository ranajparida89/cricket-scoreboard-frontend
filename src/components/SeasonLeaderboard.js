import React, { useEffect, useState } from "react";
import "./SeasonLeaderboard.css";
const SeasonLeaderboard = () => {
const [data,setData]=useState([]);
const [matchType,setMatchType]=useState("ALL");
const [loading,setLoading]=useState(true);
const loadData=async(type)=>{
setLoading(true);
let url="https://cricket-scoreboard-backend.onrender.com/api/crickedge-season/leaderboard";

if(type!=="ALL")
url+=`?match_type=${type}`;
const res=await fetch(url);
const json=await res.json();
setData(json);
setLoading(false);
};

useEffect(()=>{
loadData("ALL");
},
[]);

return (
<div className="seasonContainer">
<h2>🏆 CrickEdge Season Leaderboard</h2>
<div className="filterBox">
<select
value={matchType}
onChange={(e)=>{
setMatchType(e.target.value);
loadData(e.target.value);
}}
>
<option value="ALL">All Matches</option>
<option value="ODI">ODI</option>
<option value="T20">T20</option>
<option value="Test">Test</option>
</select>
</div>
{loading?
<div className="loadingBox">
Loading Season Leaderboard...
</div>
:
<table className="seasonTable">
<thead>
<tr>
<th>Rank</th>
<th>Team</th>
<th>Matches</th>
<th>Wins</th>
<th>Losses</th>
<th>Draws</th>
<th>Points</th>
</tr>
</thead>
<tbody>
{data.map((t,i)=>(
<tr key={i}
className={t.rank===1?"topTeam":""}
>
<td>
{t.rank===1?
"👑 "+t.rank
:
t.rank
}
</td>
<td>
{t.team}
</td>
<td>{t.matches}</td>
<td>{t.wins}</td>
<td>{t.losses}</td>
<td>{t.draws}</td>
<td className="points">
{t.points}
</td>
</tr>
))}
</tbody>
</table>
}
</div>
);
};
export default SeasonLeaderboard;