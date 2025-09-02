module.exports = {
  id: 'sudokuPerfectClear',
  name: '완벽한 스도쿠',
  description: '오답 없이 스도쿠를 클리어했습니다.',
  icon: '💯',
  reward: { type: 'profileEffect', effectId: 'Snow' },
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sudokuPerfectClear');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 스도쿠 게임에서 오답 없이 클리어했을 때
    const isPerfect = gameData.gameId === 'sudoku' && scoreData && scoreData.wrongCount === 0 && scoreData.score > 0;
    return {
      isUnlocked: isPerfect,
      progress: isPerfect ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
