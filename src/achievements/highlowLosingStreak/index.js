const THRESHOLD = 5;

module.exports = {
  id: 'highlowLosingStreak',
  name: '운빨 망겜',
  description: `${THRESHOLD}연패를 달성했습니다.`,
  icon: '📉',
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'highlow') {
      const existingAchievement = user.achievements.find(a => a.id === 'highlowLosingStreak');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'highlowLosingStreak');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;

    let newProgress = previousProgress;
    if (scoreData && !scoreData.isWin) {
      newProgress++;
    } else if (scoreData && scoreData.isWin) {
      newProgress = 0; // 승리 시 연속 패배 초기화
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
