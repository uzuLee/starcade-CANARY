export default {
  id: 'g2048_8192',
  name: '8192 달성',
  description: '2048 게임에서 8192 타일을 만들었습니다.',
  icon: '🌟',
  reward: { type: 'profileEffect', effectId: 'Confetti' },
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'g2048_8192');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 2048 게임에서 8192 타일을 만들었을 때
    const isAchieved = gameData.gameId === 'g2048' && scoreData && scoreData.options && scoreData.options.maxTile >= 8192;
    return {
      isUnlocked: isAchieved,
      progress: isAchieved ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};