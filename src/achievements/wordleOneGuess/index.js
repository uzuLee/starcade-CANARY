module.exports = {
  id: 'wordleOneGuess',
  name: '단어 탐정',
  description: '워들 게임에서 1회 시도만에 정답을 맞췄습니다.',
  icon: '🔍',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'wordleOneGuess');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 워들 게임에서 1회 시도만에 승리했을 때
    const isOneGuessWin = gameData.gameId === 'wordle' && scoreData && scoreData.options && scoreData.options.guesses === 1;
    return {
      isUnlocked: isOneGuessWin,
      progress: isOneGuessWin ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
