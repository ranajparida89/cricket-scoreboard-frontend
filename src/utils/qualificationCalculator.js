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
  
    // Find target team (the team trying to qualify)
    const targetTeam = teamsData.find(team => team.name.toLowerCase() === targetTeamName.toLowerCase());
  
    if (!targetTeam) {
      return [`Team ${targetTeamName} not found in teams list.`];
    }
  
    // Identify the "cut-off" NRR to beat (e.g., NRR of 4th ranked team if top 4 qualify)
    const sortedTeams = [...teamsData].sort((a, b) => b.points - a.points || b.nrr - a.nrr);
    const cutoffTeam = sortedTeams[3]; // 4th position cutoff (index 3)
  
    const requiredNRR = cutoffTeam.nrr; // Target NRR to beat
  
    // Simulate matches
    upcomingMatches.forEach((match) => {
      if (match.team1.toLowerCase() === targetTeamName.toLowerCase() || match.team2.toLowerCase() === targetTeamName.toLowerCase()) {
        const opponent = match.team1.toLowerCase() === targetTeamName.toLowerCase() ? match.team2 : match.team1;
  
        // Batting First Scenario
        const battingFirstScenario = generateBattingFirstScenario(targetTeam, opponent, requiredNRR);
  
        // Chasing Scenario
        const chasingScenario = generateChasingScenario(targetTeam, opponent, requiredNRR);
  
        scenarios.push({
          match: `${targetTeam.name} vs ${opponent}`,
          battingFirstScenario,
          chasingScenario,
        });
      }
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
  
    return `If ${team.name} scores 300+ and restricts ${opponent} under 150 in 30 overs, new NRR will be ~${newNRR}`;
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
  
    return `If ${team.name} chases ${targetRuns} in under ${bestCaseOversToChase} overs, new NRR will be ~${newNRR}`;
  }
  