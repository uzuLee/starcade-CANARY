export default {
  id: 'testAch2',
  name: '테스트 도전과제 2',
  description: '테스트용 도전과제입니다.',
  icon: '🥈',
  evaluate: (user, gameData, scoreData) => {
    return { isUnlocked: true, progress: 1, tier: null };
  },
};