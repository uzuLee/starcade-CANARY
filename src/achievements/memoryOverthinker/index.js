const THRESHOLD = 100;

export default {
  id: 'memoryOverthinker',
  name: '고뇌의 시간',
  description: `카드 맞추기 게임을 ${THRESHOLD}회 이상 이동하여 클리어했습니다.`,
  icon: '🤔',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'memoryOverthinker');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 카드 맞추기 게임을 100회 이상 이동하여 클리어했을 때
    const isOverthinker = gameData.gameId === 'memory' && scoreData && scoreData.options && scoreData.options.moves >= THRESHOLD;
    return {
      isUnlocked: isOverthinker,
      progress: isOverthinker ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};