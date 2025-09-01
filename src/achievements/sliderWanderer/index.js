const THRESHOLD = 200;

export default {
  id: 'sliderWanderer',
  name: '길 잃은 방랑자',
  description: `슬라이더 게임을 ${THRESHOLD}회 이상 이동하여 클리어했습니다.`,
  icon: '🚶‍♂️',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sliderWanderer');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 슬라이더 게임을 200회 이상 이동하여 클리어했을 때
    const isWanderer = gameData.gameId === 'slider' && scoreData && scoreData.options && scoreData.options.moves >= THRESHOLD;
    return {
      isUnlocked: isWanderer,
      progress: isWanderer ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};