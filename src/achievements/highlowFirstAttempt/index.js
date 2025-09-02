module.exports = {
  id: 'highlowFirstAttempt',
  name: '첫 하이로우 시도',
  description: '하이로우 게임을 처음으로 플레이했습니다.',
  icon: '⬆️⬇️',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'highlowFirstAttempt');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 하이로우 게임을 시작하면 바로 달성
    const isPlayed = gameData.gameId === 'highlow';
    return {
      isUnlocked: isPlayed,
      progress: isPlayed ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
