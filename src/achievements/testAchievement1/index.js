export default {
  id: 'testAch1',
  name: '테스트 도전과제 1',
  description: '테스트용 도전과제입니다.',
  icon: '🥇',
  evaluate: (user, gameData, scoreData) => {
    return { isUnlocked: true, progress: 1, tier: null };
  },
};