const THRESHOLD = 5;

module.exports = {
  id: 'blackjackPusher',
  name: '밀당의 고수',
  description: `블랙잭 게임에서 한 덱으로 무승부(Push)를 ${THRESHOLD}번 이상 기록했습니다.`,
  icon: '⚖️',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'blackjackPusher');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null, newTierUnlocked: false };
    }
    
    const isPusher = gameData.gameId === 'blackjack' && scoreData && scoreData.options && scoreData.options.pushes >= THRESHOLD;
    
    return {
      isUnlocked: isPusher,
      progress: isPusher ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
