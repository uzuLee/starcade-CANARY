module.exports = {
  id: 'g2048_4096',
  name: '4096 달성',
  description: '2048 게임에서 4096 타일을 만들었습니다.',
  icon: '✨',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'g2048_4096');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 2048 게임에서 4096 타일을 만들었을 때
    const isAchieved = gameData.gameId === 'g2048' && scoreData && scoreData.options && scoreData.options.maxTile >= 4096;
    return {
      isUnlocked: isAchieved,
      progress: isAchieved ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
