module.exports = {
  id: 'sliderPerfect',
  name: '최소 이동의 달인',
  description: '슬라이더 게임을 최소 이동 횟수(15회)로 클리어했습니다.',
  icon: '✨',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sliderPerfect');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 슬라이더 게임을 최소 이동 횟수(15회)로 클리어했을 때
    const isPerfect = gameData.gameId === 'slider' && scoreData && scoreData.options && scoreData.options.moves === 15;
    return {
      isUnlocked: isPerfect,
      progress: isPerfect ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
