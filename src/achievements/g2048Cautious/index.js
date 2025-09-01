export default {
  id: 'g2048Cautious',
  name: '신중한 플레이어',
  description: '2048 타일을 20,000점 미만으로 달성했습니다.',
  icon: '🧐',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'g2048Cautious');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null, newTierUnlocked: false };
    }
    
    const isCautious = gameData.gameId === 'g2048' && scoreData && scoreData.options && scoreData.options.maxTile >= 2048 && scoreData.score < 20000;
    
    return {
      isUnlocked: isCautious,
      progress: isCautious ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};