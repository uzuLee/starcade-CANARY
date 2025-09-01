const THRESHOLD = 50;

export default {
  id: 'sliderLucky',
  name: '운빨 슬라이더',
  description: `슬라이더 게임을 ${THRESHOLD}회 미만 이동으로 클리어했습니다.`,
  icon: '🍀',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sliderLucky');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 슬라이더 게임을 50회 미만 이동으로 클리어했을 때
    const isLucky = gameData.gameId === 'slider' && scoreData && scoreData.options && scoreData.options.moves < THRESHOLD;
    return {
      isUnlocked: isLucky,
      progress: isLucky ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};