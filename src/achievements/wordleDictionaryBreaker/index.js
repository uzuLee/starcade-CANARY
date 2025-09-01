const THRESHOLD = 5;

export default {
  id: 'wordleDictionaryBreaker',
  name: '사전 파괴자',
  description: `워들 게임에서 단어 목록에 없는 단어를 ${THRESHOLD}번 이상 시도했습니다.`,
  icon: '📚💥',
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'wordle') {
      const existingAchievement = user.achievements.find(a => a.id === 'wordleDictionaryBreaker');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'wordleDictionaryBreaker');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;

    // scoreData.options.invalidGuessCount가 있을 때만 진행도 증가
    const newProgress = previousProgress + (scoreData && scoreData.options && scoreData.options.invalidGuessCount ? scoreData.options.invalidGuessCount : 0);

    const isUnlocked = newProgress >= THRESHOLD;

    return {
      isUnlocked: isUnlocked,
      progress: newProgress,
      tier: null,
      newTierUnlocked: false,
    };
  },
};