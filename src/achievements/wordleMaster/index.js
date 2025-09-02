const TIERS = [
  { threshold: 1, name: '워들 초보', icon: '🌱' },
  { threshold: 5, name: '워들 숙련가', icon: '🌳' },
  { threshold: 10, name: '워들 마스터', icon: '🌲' },
];

module.exports = {
  id: 'wordleMaster',
  name: '워들 마스터',
  description: '워들 게임에서 승리한 횟수에 따라 티어가 부여됩니다.',
  icon: '👑',
  tiers: TIERS,
  rewards: [
    { type: 'profileEffect', effectId: 'Stars' },
    { type: 'title', titleId: '단어 탐정' },
  ],
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'wordle') {
      const existingAchievement = user.achievements.find(a => a.id === 'wordleMaster');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const isWin = scoreData && scoreData.score > 0;
    if (!isWin) {
        const existingAchievement = user.achievements.find(a => a.id === 'wordleMaster');
        return { 
            isUnlocked: !!existingAchievement, 
            progress: existingAchievement ? existingAchievement.progress : 0,
            tier: existingAchievement ? existingAchievement.tier : null,
            newTierUnlocked: false 
        };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'wordleMaster');
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
