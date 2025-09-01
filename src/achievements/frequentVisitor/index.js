const TIERS = [
  { threshold: 3, name: '꾸준한 방문자', icon: '🚶' },
  { threshold: 7, name: '매일 출석', icon: '🏃' },
  { threshold: 30, name: '성실한 개근상', icon: '🏆' },
];

export default {
  id: 'frequentVisitor',
  name: '자주 출석',
  description: '연속 출석 일수에 따라 티어가 부여됩니다.',
  icon: '🗓️',
  tiers: TIERS,
  rewards: [
    { type: 'title', titleId: '성실한 방문자' },
  ],
  evaluate: (user, gameData, scoreData) => {
    if (gameData.event !== 'login') {
      const existingAchievement = user.achievements.find(a => a.id === 'frequentVisitor');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const newProgress = scoreData.consecutiveLoginDays;

    let currentTier = null;
    let newTierUnlocked = false;

    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (newProgress >= TIERS[i].threshold) {
        currentTier = TIERS[i];
        break;
      }
    }

    const previousTierName = user.achievements.find(a => a.id === 'frequentVisitor')?.tier?.name;
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