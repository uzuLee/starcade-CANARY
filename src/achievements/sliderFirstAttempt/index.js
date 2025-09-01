export default {
  id: 'sliderFirstAttempt',
  name: '첫 슬라이더 시도',
  description: '슬라이더 게임을 처음으로 플레이했습니다.',
  icon: '🧩',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sliderFirstAttempt');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 슬라이더 게임을 시작하면 바로 달성
    const isPlayed = gameData.gameId === 'slider';
    return {
      isUnlocked: isPlayed,
      progress: isPlayed ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};