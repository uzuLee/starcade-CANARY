module.exports = {
  id: 'memoryFirstAttempt',
  name: '첫 카드 맞추기 시도',
  description: '카드 맞추기 게임을 처음으로 플레이했습니다.',
  icon: '🃏',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'memoryFirstAttempt');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 카드 맞추기 게임을 시작하면 바로 달성
    const isPlayed = gameData.gameId === 'memory';
    return {
      isUnlocked: isPlayed,
      progress: isPlayed ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
