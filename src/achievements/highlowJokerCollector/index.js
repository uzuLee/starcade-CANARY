const THRESHOLD = 3;

export default {
  id: 'highlowJokerCollector',
  name: '조커 수집가',
  description: `하이로우 게임에서 조커 카드를 ${THRESHOLD}번 이상 뽑았습니다.`,
  icon: '🃏',
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'highlow') {
      const existingAchievement = user.achievements.find(a => a.id === 'highlowJokerCollector');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'highlowJokerCollector');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;

    // scoreData.isJokerDrawn이 true일 때만 진행도 증가
    const newProgress = previousProgress + (scoreData && scoreData.isJokerDrawn ? 1 : 0);

    const isUnlocked = newProgress >= THRESHOLD;

    return {
      isUnlocked: isUnlocked,
      progress: newProgress,
      tier: null,
      newTierUnlocked: false,
    };
  },
};