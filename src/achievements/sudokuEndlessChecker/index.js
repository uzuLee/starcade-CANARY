module.exports = {
  id: 'sudokuEndlessChecker',
  name: '무한 검사자',
  description: `스도쿠 '검사' 버튼을 10번 이상 누르고 클리어했습니다.`,
  icon: '♾️',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sudokuEndlessChecker');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 스도쿠 게임에서 '검사' 버튼을 10번 이상 누르고 클리어했을 때
    const isEndlessChecker = gameData.gameId === 'sudoku' && scoreData && scoreData.checkCount >= 10 && scoreData.score > 0;
    return {
      isUnlocked: isEndlessChecker,
      progress: isEndlessChecker ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};
