// src/utils/qualificationCalculator.js

// Utility function to convert overs from format 49.3 to 49.5 (decimal format)
export function oversToDecimal(overs) {
    const parts = overs.toString().split(".");
    const whole = parseInt(parts[0], 10);
    const balls = parts[1] ? parseInt(parts[1], 10) : 0;
    return whole + balls / 6;
  }
  
  // Core Qualification Calculator
  export function calculateQualificationScenario(teamsData, upcomingMatches, targetTeamName) {
    if (!teamsData || teamsData.length === 0) return [];
  
    const scenarios = [];
  
  // ✅ Loop through every team (except top 4) to generate scenario
const sortedTeams = [...teamsData].sort((a, b) => b.points - a.points || b.nrr - a.nrr);
const cutoffTeam = sortedTeams[3]; // 4th position cutoff (index 3)
const requiredNRR = cutoffTeam.nrr;

teamsData.forEach(targetTeam => {
  console.log("🔁 Target Team in loop:", targetTeam?.team_name, "Looking for:", targetTeamName);
  console.log("📦 targetTeam full object:", targetTeam);
  if (!targetTeam || !targetTeam.team_name) return;
  if (!targetTeam || targetTeam.points >= cutoffTeam.points) return;

  // Loop through upcoming matches where targetTeam is playing
  upcomingMatches.forEach((match) => {
    if (!match || !match.team1 || !match.team2) return; // added new line
    const team1 = (match.team1 || "").trim().toLowerCase();
              console.log("🧪 Comparing:", {
                team1,
                team2,
                targetName,
                match
              });
    
    const team2 = (match.team2 || "").trim().toLowerCase();   
    const targetName = (targetTeam?.team_name || "").trim().toLowerCase();
  
    if (team1 === targetName || team2 === targetName) {
      console.log("🎯 Match found! Target team:", targetTeamName, "vs", opponent);
      console.log("🧪 Comparing:", {
        team1,
        team2,
        targetName,
        match
      });
      
      const opponent = team1 === targetName ? match.team2 : match.team1;

  
      if (!opponent) {
        console.warn("⚠️ Skipping scenario, opponent not found for match:", match.match_name);
        return;
      }
      
      // ✅ Only runs if opponent is valid
      console.log("📊 Scenario calc call with:", {
        targetTeam,
        opponent,
        requiredNRR
      });      
      const battingFirstScenario = generateBattingFirstScenario(targetTeam, opponent, requiredNRR);
      const chasingScenario = generateChasingScenario(targetTeam, opponent, requiredNRR);
      console.log("✅ Scenario generated for:", targetTeam.team_name, "vs", opponent);

      scenarios.push({
        match: `${targetTeam.team_name} vs ${opponent?.trim?.() || "???"}`,
        battingFirstScenario,
        chasingScenario,
      });
    }
  });
  
});

  
    return scenarios;
  }
  
  // -------------------------
  // Supporting Functions
  // -------------------------
  
  function generateBattingFirstScenario(team, opponent, requiredNRR) {
    // Assume team bats full 50 overs
    const ownOversFaced = team.oversFaced + 50;
    const ownRunsScored = team.runsScored + 300; // Assume 300 runs base
  
    // Assume restrict opponent to low score in low overs
    const maxOpponentRuns = 150; // Example restrict opponent under 150
    const opponentOversBowled = team.oversBowled + 30; // Example: bowling out in 30 overs
  
    const newNRR = ((ownRunsScored / ownOversFaced) - (team.runsConceded + maxOpponentRuns) / opponentOversBowled).toFixed(3);
  
    return `If ${team.team_name} scores 300+ and restricts ${opponent} under 150 in 30 overs, new NRR will be ~${newNRR}`;
  }
  
  function generateChasingScenario(team, opponent, requiredNRR) {
    // Assume opponent scores 250 in 50 overs
    const opponentRuns = 250;
    const opponentOversFaced = 50;
  
    // Assume team chases in X overs
    const targetRuns = opponentRuns + 1; // To win, must beat by 1 run minimum
  
    let bestCaseOversToChase = 30; // Target to chase inside 30 overs for huge boost
  
    const newRunsScored = team.runsScored + targetRuns;
    const newOversFaced = team.oversFaced + bestCaseOversToChase;
  
    const newRunsConceded = team.runsConceded + opponentRuns;
    const newOversBowled = team.oversBowled + opponentOversFaced;
  
    const newNRR = ((newRunsScored / newOversFaced) - (newRunsConceded / newOversBowled)).toFixed(3);
  
    return `If ${team.team_name} chases ${targetRuns} in under ${bestCaseOversToChase} overs, new NRR will be ~${newNRR}`;
  }
  