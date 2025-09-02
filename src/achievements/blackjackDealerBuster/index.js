const THRESHOLD = 5;

module.exports = {
  id: 'blackjackDealerBuster',
  name: '딜러의 친구',
  description: `블랙잭 게임에서 딜러가 ${THRESHOLD}번 이상 버스트했습니다.`,
  icon: '🤝',
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'blackjack') {
      const existingAchievement = user.achievements.find(a => a.id === 'blackjackDealerBuster');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'blackjackDealerBuster');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;

    // scoreData.isDealerBust가 true일 때만 진행도 증가
    const newProgress = previousProgress + (scoreData && scoreData.isDealerBust ? 1 : 0);

    const isUnlocked = newProgress >= THRESHOLD;

    return {
      isUnlocked: isUnlocked,
      progress: newProgress,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
