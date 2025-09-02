module.exports = {
  id: 'firstLoss',
  name: '패배도 경험이야',
  description: 'Starcade에서 첫 패배를 기록했습니다.',
  icon: '📉',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'firstLoss');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // Check if the game resulted in a loss (score <= 0 and not a win)
    const isLoss = scoreData && scoreData.score <= 0 && !scoreData.isWin; // Assuming isWin is passed for games where 0 score can be a win
    return {
      isUnlocked: isLoss,
      progress: isLoss ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
