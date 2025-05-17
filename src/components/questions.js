const questions = [
  // 🏏 Centuries
  { id: "most_centuries_india", text: "Who has the most centuries for India?" },
  { id: "most_centuries_australia", text: "Most centuries for Australia" },
  { id: "most_centuries_pakistan", text: "Top century scorer for Pakistan" },
  { id: "most_centuries_england", text: "England player with most centuries" },
  { id: "most_centuries_bangladesh", text: "Top 100 scorer for Bangladesh" },
  { id: "most_centuries_srilanka", text: "Most centuries by a Sri Lankan batsman" },

  // 🏏 Total Runs
  { id: "top_scorer_odi_india", text: "Top scorer for India in ODIs" },
  { id: "top_scorer_t20_australia", text: "Top scorer for Australia in T20s" },
  { id: "top_scorer_test_england", text: "Top scorer for England in Test matches" },
  { id: "top_scorer_odi_southafrica", text: "Top ODI scorer for South Africa" },
  { id: "top_scorer_test_newzealand", text: "Top Test scorer from New Zealand" },
  { id: "top_scorer_t20_pakistan", text: "Top run scorer in T20s for Pakistan" },

  // 🎯 Bowling
  { id: "top_wicket_t20_india", text: "Top wicket taker for India in T20s" },
  { id: "top_wicket_odi_southafrica", text: "Top wicket taker for South Africa in ODIs" },
  { id: "top_wicket_test_pakistan", text: "Most wickets taken by Pakistan in Tests" },
  { id: "top_wicket_t20_westindies", text: "Top West Indies bowler in T20 cricket" },
  { id: "top_wicket_odi_srilanka", text: "Sri Lanka’s highest ODI wicket taker" },
  { id: "most_wickets_test_australia", text: "Most wickets by an Australian in Test matches" },

  // ⭐ Player Ratings
  { id: "highest_batting_rating_odi", text: "Highest rated batsman in ODI" },
  { id: "highest_bowling_rating_test", text: "Top bowling rating in Test matches" },
  { id: "top_allrounder_rating_t20", text: "Top allrounder in T20s by rating" },
  { id: "top_allrounder_rating_odi", text: "Best rated allrounder in ODI" },
  { id: "best_bowler_rating_t20", text: "Highest rated T20 bowler" },

  // 🏆 Tournament Winners
  { id: "winner_asia_cup_2023", text: "Who won Asia Cup 2023?" },
  { id: "winner_world_cup_2023", text: "Winner of World Cup 2023" },
  { id: "winner_world_cup_latest", text: "Latest World Cup winner" },
  { id: "winner_asia_cup_2022", text: "Asia Cup 2022 winner?" },
  { id: "winner_test_championship", text: "WTC Final 2023 winner?" },
  { id: "winner_champions_trophy_2017", text: "Champions Trophy 2017 winner" },

  // 📊 Team Stats
  { id: "team_highest_centuries", text: "Which team has the highest number of centuries?" },
  { id: "team_most_wickets", text: "Which team took most wickets in ODIs?" },
  { id: "team_best_batting_avg", text: "Which team has the best batting average in T20s?" },
  { id: "team_best_bowling_avg", text: "Best bowling average among teams in ODI" },
  { id: "team_most_runs", text: "Team with most runs in Test cricket" },

  // 🔥 Milestones
  { id: "fastest_century_t20", text: "Who hit the fastest century in T20s?" },
  { id: "most_50s_odi", text: "Which player has most fifties in ODIs?" },
  { id: "best_strike_rate_t20", text: "Best strike rate in T20 cricket" },
  { id: "fastest_50_odi", text: "Fastest fifty in ODI history?" },
  { id: "highest_score_individual", text: "Highest individual score in any format" },
  { id: "most_sixes_t20", text: "Most sixes hit in T20 internationals" },

  // 🎖️ Fun / Trivia
  { id: "who_played_most_matches", text: "Who played the most matches in ODIs?" },
  { id: "youngest_century_maker", text: "Youngest player to score a century in ODI?" },
  { id: "highest_match_score_test", text: "Highest total score in a Test match?" },
  { id: "highest_partnership", text: "Highest partnership ever in international cricket?" },
  { id: "best_keeper_dismissals", text: "Wicketkeeper with most dismissals in ODI" },
  { id: "most_ducks", text: "Which player has most ducks in career?" },

  // 💡 Player + Format + Team combos
  { id: "centuries_by_player_t20", text: "How many centuries has Rohit Sharma scored in T20s?" },
  { id: "wickets_by_player_test", text: "Wickets taken by Ashwin in Test cricket?" },
  { id: "runs_by_player_odi", text: "Total ODI runs by Virat Kohli?" },
  { id: "rating_of_player", text: "What is the batting rating of Steve Smith in Test?" },
  { id: "average_of_player", text: "Batting average of Babar Azam in ODI?" },

  // 🧠 ICC Stats (Advanced)
  { id: "icc_top_teams", text: "Top 3 ranked teams in T20s?" },
  { id: "icc_points_table_odi", text: "Current ICC points table for ODI?" },
  { id: "icc_nrr_team", text: "Which team has the highest NRR in T20?" },
  { id: "icc_team_position", text: "India's position in ICC Test ranking?" },

  // 🔁 Recent Events
  { id: "last_match_winner", text: "Who won the last ODI match?" },
  { id: "last_match_top_scorer", text: "Top scorer in last T20 match?" },
  { id: "last_match_top_bowler", text: "Top wicket taker in last Test match?" },

  // 📅 Date-specific
  { id: "match_result_on_date", text: "Who won on 10 April 2024?" },
  { id: "player_stats_on_date", text: "What were Kohli's stats on 15 March 2023?" },

  // 💥 Strike Rate + Avg
  { id: "highest_strike_rate_t20", text: "Player with highest strike rate in T20s?" },
  { id: "highest_batting_avg_test", text: "Best batting average in Test cricket" },
  { id: "lowest_bowling_avg", text: "Lowest bowling average in ODI" },

  // ⏳ Career Records
  { id: "longest_career_player", text: "Player with longest international career" },
  { id: "most_matches_as_captain", text: "Who has played most matches as captain?" },
  { id: "most_not_outs", text: "Player with most not outs in ODI" },

  // 📈 Win %
  { id: "team_win_percent_t20", text: "India's win percentage in T20s?" },
  { id: "team_win_percent_test", text: "Australia win % in Test" },
  { id: "team_win_percent_odi", text: "Pakistan win % in ODIs?" },

  // 🎯 Economy + Bowling
  { id: "best_economy_bowler", text: "Bowler with best economy in T20" },
  { id: "most_dot_balls", text: "Bowler with most dot balls in ODI?" },
  { id: "most_maiden_overs", text: "Most maiden overs bowled in Test cricket?" },

  // 📉 Failures
  { id: "worst_loss", text: "Worst loss margin in ODI history?" },
  { id: "biggest_collapses", text: "Biggest batting collapse ever?" },

  // 🧩 Other custom cricket queries...
];

export default questions;
