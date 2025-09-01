export default {
  id: 'profileDecorator',
  name: '프로필 꾸미기',
  description: '프로필 효과를 처음으로 적용했습니다.',
  icon: '🎨',
  rewards: [
    { type: 'title', titleId: '프로필 꾸미기' },
  ],
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'profileDecorator');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    const isUnlocked = user.profileEffect && user.profileEffect !== '';
    return {
      isUnlocked: isUnlocked,
      progress: isUnlocked ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};