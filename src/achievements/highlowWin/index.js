module.exports = {
  id: 'highlowWin',
  name: '하이로우 승리',
  description: '하이로우 게임에서 첫 승리를 기록했습니다.',
  icon: '🎉',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'highlowWin');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 하이로우 게임에서 승리했을 때
    const isWin = gameData.gameId === 'highlow' && scoreData && scoreData.isWin;
    return {
      isUnlocked: isWin,
      progress: isWin ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
