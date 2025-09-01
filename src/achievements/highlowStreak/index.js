const THRESHOLD = 5;

export default {
  id: 'highlowStreak',
  name: '연속 하이로우',
  description: `${THRESHOLD}연승을 달성했습니다.`,
  icon: '🔥',
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'highlow') {
      const existingAchievement = user.achievements.find(a => a.id === 'highlowStreak');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'highlowStreak');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;

    let newProgress = previousProgress;
    if (scoreData && scoreData.isWin) {
      newProgress++;
    } else if (scoreData && !scoreData.isWin) {
      newProgress = 0; // 패배 시 연속 승리 초기화
    }

    const isUnlocked = newProgress >= THRESHOLD;

    return {
      isUnlocked: isUnlocked,
      progress: newProgress,
      tier: null,
      newTierUnlocked: false,
    };
  },
};