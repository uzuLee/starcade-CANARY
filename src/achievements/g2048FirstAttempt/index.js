export default {
  id: 'g2048FirstAttempt',
  name: '첫 2048 시도',
  description: '2048 게임을 처음으로 플레이했습니다.',
  icon: '🔢',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'g2048FirstAttempt');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 2048 게임을 시작하면 바로 달성
    const isPlayed = gameData.gameId === 'g2048';
    return {
      isUnlocked: isPlayed,
      progress: isPlayed ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};