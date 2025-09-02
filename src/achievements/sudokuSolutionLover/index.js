module.exports = {
  id: 'sudokuSolutionLover',
  name: '정답지 애용가',
  description: '스도쿠 정답을 3번 이상 확인하고 클리어했습니다.',
  icon: '📖❤️',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sudokuSolutionLover');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 스도쿠 게임에서 정답을 3번 이상 확인하고 클리어했을 때
    const isSolutionLover = gameData.gameId === 'sudoku' && scoreData && scoreData.viewedSolutionCount >= 3 && scoreData.score > 0;
    return {
      isUnlocked: isSolutionLover,
      progress: isSolutionLover ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
