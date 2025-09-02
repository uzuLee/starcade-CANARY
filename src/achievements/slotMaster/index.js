const TIERS = [
  { threshold: 1, name: '슬롯머신 초보', icon: '🌱' },
  { threshold: 5, name: '슬롯머신 숙련가', icon: '🌳' },
  { threshold: 10, name: '슬롯머신 마스터', icon: '🌲' },
];

module.exports = {
  id: 'slotMaster',
  name: '슬롯머신 마스터',
  description: '슬롯머신 게임에서 승리한 횟수에 따라 티어가 부여됩니다.',
  icon: '👑',
  tiers: TIERS,
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'slot') {
      const existingAchievement = user.achievements.find(a => a.id === 'slotMaster');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const isWin = scoreData && scoreData.score > 0;
    if (!isWin) {
        const existingAchievement = user.achievements.find(a => a.id === 'slotMaster');
        return { 
            isUnlocked: !!existingAchievement, 
            progress: existingAchievement ? existingAchievement.progress : 0,
            tier: existingAchievement ? existingAchievement.tier : null,
            newTierUnlocked: false 
        };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'slotMaster');
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
