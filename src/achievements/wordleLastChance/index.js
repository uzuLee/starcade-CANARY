export default {
  id: 'wordleLastChance',
  name: '아슬아슬 워들',
  description: '워들 게임에서 6회 시도만에 정답을 맞췄습니다.',
  icon: '⏳',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'wordleLastChance');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 워들 게임에서 6회 시도만에 승리했을 때
    const isLastChanceWin = gameData.gameId === 'wordle' && scoreData && scoreData.options && scoreData.options.guesses === 6;
    return {
      isUnlocked: isLastChanceWin,
      progress: isLastChanceWin ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};