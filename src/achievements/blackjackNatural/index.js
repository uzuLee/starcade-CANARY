module.exports = {
  id: 'blackjackNatural',
  name: '블랙잭의 신',
  description: '첫 두 장으로 블랙잭을 달성했습니다.',
  icon: '♠️♣️',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'blackjackNatural');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 블랙잭 게임에서 첫 두 장으로 블랙잭을 달성했을 때
    const isNatural = gameData.gameId === 'blackjack' && scoreData && scoreData.isNaturalBlackjack;
    return {
      isUnlocked: isNatural,
      progress: isNatural ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
