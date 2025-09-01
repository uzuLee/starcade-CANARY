const THRESHOLD = 5;

export default {
  id: 'slotBankruptcyExpert',
  name: '파산 전문가',
  description: `슬롯머신 게임에서 ${THRESHOLD}번 이상 파산했습니다.`,
  icon: '💀',
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'slot') {
      const existingAchievement = user.achievements.find(a => a.id === 'slotBankruptcyExpert');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'slotBankruptcyExpert');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;

    // scoreData.isBankruptcy가 true일 때만 진행도 증가
    const newProgress = previousProgress + (scoreData && scoreData.isBankruptcy ? 1 : 0);

    const isUnlocked = newProgress >= THRESHOLD;

    return {
      isUnlocked: isUnlocked,
      progress: newProgress,
      tier: null,
      newTierUnlocked: false,
    };
  },
};