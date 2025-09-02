module.exports = {
  id: 'sudokuConfident',
  name: '자신감 넘치는 해결사',
  description: '스도쿠 게임을 \'검사\' 버튼을 한 번도 사용하지 않고 클리어했습니다.',
  icon: '😎',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'sudokuConfident');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null, newTierUnlocked: false };
    }
    
    const isConfident = gameData.gameId === 'sudoku' && scoreData && scoreData.score > 0 && scoreData.checkCount === 0;
    
    return {
      isUnlocked: isConfident,
      progress: isConfident ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};