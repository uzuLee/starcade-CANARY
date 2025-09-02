module.exports = {
  id: 'wordleFirstWin',
  name: '워들 초보',
  description: '워들 게임에서 첫 승리를 기록했습니다.',
  icon: '🏆',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'wordleFirstWin');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 워들 게임에서 승리했을 때
    const isWin = gameData.gameId === 'wordle' && scoreData && scoreData.score > 0;
    return {
      isUnlocked: isWin,
      progress: isWin ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
