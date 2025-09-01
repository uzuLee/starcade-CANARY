export default {
  id: 'g2048TileAddict',
  name: '타일 중독자',
  description: '2048 게임에서 10000점 이상을 달성했습니다.',
    icon: '😵',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'g2048TileAddict');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 2048 게임에서 10000점 이상을 달성했을 때
    const isAddict = gameData.gameId === 'g2048' && scoreData && scoreData.score >= 10000;
    return {
      isUnlocked: isAddict,
      progress: isAddict ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};