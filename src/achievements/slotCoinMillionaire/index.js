const TIERS = [
  { threshold: 5000, name: '코인 부자', icon: '💰' },
  { threshold: 10000, name: '코인 재벌', icon: '💎' },
  { threshold: 25000, name: '코인 황제', icon: '👑' },
];

export default {
  id: 'slotCoinMillionaire',
  name: '코인 수집가',
  description: '슬롯머신에서 달성한 최대 코인 보유량에 따라 티어가 부여됩니다.',
  icon: '🪙',
  tiers: TIERS,
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'slot' || !scoreData || typeof scoreData.finalCoins === 'undefined') {
      const existingAchievement = user.achievements.find(a => a.id === 'slotCoinMillionaire');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'slotCoinMillionaire');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;
    const newProgress = Math.max(previousProgress, scoreData.finalCoins);

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