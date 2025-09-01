const TIERS = [
  { threshold: 1, name: '워들 플레이어', icon: '🕹️' },
  { threshold: 5, name: '워들 매니아', icon: '🎮' },
  { threshold: 10, name: '워들 중독자', icon: '👾' },
  { threshold: 25, name: '워들 마스터', icon: '🏆' },
  { threshold: 50, name: '워들 전설', icon: '🌟' },
];

export default {
  id: 'wordlePlayedCount',
  name: '워들 플레이어',
  description: '워들 게임을 플레이한 횟수에 따라 티어가 부여됩니다.',
  icon: '🕹️',
  tiers: TIERS,
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'wordle') {
      const existingAchievement = user.achievements.find(a => a.id === 'wordlePlayedCount');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'wordlePlayedCount');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;
    
    // 게임이 종료될 때마다 (점수 제출 시) 진행도 증가
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