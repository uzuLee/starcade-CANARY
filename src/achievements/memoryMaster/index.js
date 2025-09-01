const TIERS = [
  { threshold: 1, name: '기억력 초보', icon: '🌱' },
  { threshold: 5, name: '기억력 숙련가', icon: '🌳' },
  { threshold: 10, name: '기억력 마스터', icon: '🌲' },
];

export default {
  id: 'memoryMaster',
  name: '기억력 마스터',
  description: '카드 맞추기 게임을 클리어한 횟수에 따라 티어가 부여됩니다.',
  icon: '🧠',
  tiers: TIERS,
  rewards: [
    { type: 'profileEffect', effectId: 'Rain' },
    { type: 'title', titleId: '기억의 대가' },
  ],
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'memory') {
      const existingAchievement = user.achievements.find(a => a.id === 'memoryMaster');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const isCleared = scoreData && scoreData.score > 0;
    if (!isCleared) {
        const existingAchievement = user.achievements.find(a => a.id === 'memoryMaster');
        return { 
            isUnlocked: !!existingAchievement, 
            progress: existingAchievement ? existingAchievement.progress : 0,
            tier: existingAchievement ? existingAchievement.tier : null,
            newTierUnlocked: false 
        };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'memoryMaster');
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