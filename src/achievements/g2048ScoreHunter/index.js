const TIERS = [
  { threshold: 20000, name: '점수 사냥꾼', icon: '🏹' },
  { threshold: 50000, name: '점수 수집가', icon: '🎯' },
  { threshold: 100000, name: '점수 지배자', icon: '👑' },
];

export default {
  id: 'g2048ScoreHunter',
  name: '점수 사냥꾼',
  description: '2048 게임에서 달성한 최고 점수에 따라 티어가 부여됩니다.',
  icon: '🏆',
  tiers: TIERS,
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'g2048' || !scoreData || typeof scoreData.score === 'undefined') {
      const existingAchievement = user.achievements.find(a => a.id === 'g2048ScoreHunter');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'g2048ScoreHunter');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;
    const newProgress = Math.max(previousProgress, scoreData.score);

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