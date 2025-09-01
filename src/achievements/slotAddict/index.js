const THRESHOLD = 100;

export default {
  id: 'slotAddict',
  name: '도박 중독자',
  description: `슬롯머신 게임에서 ${THRESHOLD}회 이상 스핀했습니다.`,
  icon: '🎰',
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'slot') {
      const existingAchievement = user.achievements.find(a => a.id === 'slotAddict');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'slotAddict');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;

    // scoreData.spinsCount가 있을 때만 진행도 증가
    const newProgress = previousProgress + (scoreData && scoreData.spinsCount ? scoreData.spinsCount : 0);

    const isUnlocked = newProgress >= THRESHOLD;

    return {
      isUnlocked: isUnlocked,
      progress: newProgress,
      tier: null,
      newTierUnlocked: false,
    };
  },
};