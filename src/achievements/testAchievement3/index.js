module.exports = {
  id: 'testAch3',
  name: '테스트 도전과제 3',
  description: '테스트용 도전과제입니다.',
  icon: '🥉',
  evaluate: (user, gameData, scoreData) => {
    return { isUnlocked: true, progress: 1, tier: null };
  },
};
