module.exports = {
  id: 'g2048LuckyBeginner',
  name: '초보의 행운',
  description: '2048 타일을 500점 미만으로 달성했습니다.',
  icon: '🍀',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'g2048LuckyBeginner');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 2048 타일을 만들었을 때 점수가 500점 미만일 때
    const isLucky = gameData.gameId === 'g2048' && scoreData && scoreData.options && scoreData.options.maxTile >= 2048 && scoreData.score < 500;
    return {
      isUnlocked: isLucky,
      progress: isLucky ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
