export default {
  id: 'sliderClear',
  name: '슬라이더 초보',
  description: '슬라이더 게임을 1회 클리어했습니다.',
  icon: '✅',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sliderClear');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 슬라이더 게임을 클리어했을 때
    const isCleared = gameData.gameId === 'slider' && scoreData && scoreData.score > 0;
    return {
      isUnlocked: isCleared,
      progress: isCleared ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};