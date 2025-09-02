const TIERS = [
  { threshold: 1, name: '블랙잭 초보', icon: '🌱' },
  { threshold: 5, name: '블랙잭 숙련가', icon: '🌳' },
  { threshold: 10, name: '블랙잭 마스터', icon: '🌲' },
];

module.exports = {
  id: 'blackjackMaster',
  name: '블랙잭 마스터',
  description: '블랙잭 게임에서 승리한 횟수에 따라 티어가 부여됩니다.',
  icon: '👑',
  tiers: TIERS,
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'blackjack') {
      const existingAchievement = user.achievements.find(a => a.id === 'blackjackMaster');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const isWin = scoreData && scoreData.isWin;
    if (!isWin) {
        const existingAchievement = user.achievements.find(a => a.id === 'blackjackMaster');
        return { 
            isUnlocked: !!existingAchievement, 
            progress: existingAchievement ? existingAchievement.progress : 0,
            tier: existingAchievement ? existingAchievement.tier : null,
            newTierUnlocked: false 
        };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'blackjackMaster');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;
    const newProgress = previousProgress + 1;

    let currentTier = null;
    let newTierUnlocked = false;

    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (newProgress >= TIERS[i].threshold) {
        currentTier = TIERS[i];
        break;
      }
    }

    const previousTierName = existingAchievement?.tier?.name;
    const currentTierName = currentTier?.name;

    if (currentTierName && currentTierName !== previousTierName) {
      newTierUnlocked = true;
    }

    return {
      isUnlocked: newProgress > 0,
      progress: newProgress,
      tier: currentTier,
      newTierUnlocked: newTierUnlocked,
    };
  },
};
