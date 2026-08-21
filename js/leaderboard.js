// Online leaderboard — placeholder until Stage 6.
//
// Plan (see CLAUDE.md "Leaderboard plan"): Firebase Firestore, one high score per
// player name, later expanded to friend groups. Not wired up yet — these functions
// exist now so the rest of the game can call them without caring whether the real
// backend is connected, and just do nothing / resolve harmlessly until it is.
const Leaderboard = {
  async submitScore(playerName, score) {
    console.log(`[leaderboard stub] would submit score: ${playerName} = ${score}`);
  },

  async getTopScores(count = 10) {
    console.log('[leaderboard stub] would fetch top scores');
    return [];
  },
};
