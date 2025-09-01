export default {
  id: 'memoryPerfect',
  name: '완벽한 기억력',
  description: '카드 맞추기 게임을 최소 이동 횟수(12회)로 클리어했습니다.',
  icon: '✨',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'memoryPerfect');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 카드 맞추기 게임을 최소 이동 횟수(12회)로 클리어했을 때
    const isPerfect = gameData.gameId === 'memory' && scoreData && scoreData.options && scoreData.options.moves === 12;
    return {
      isUnlocked: isPerfect,
      progress: isPerfect ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};